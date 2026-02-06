const Transaction = require('../models/Transaction');
const ReconciliationResult = require('../models/ReconciliationResult');
const ReconciliationRule = require('../models/ReconciliationRule');
const reconciliationService = require('../services/reconciliationService');
const fileParserService = require('../services/fileParserService');
const auditService = require('../services/auditService');
const mongoose = require('mongoose');

class ReconciliationController {
    // @route   POST /api/reconciliation/upload
    // @desc    Upload file and perform reconciliation
    // @access  Private (analyst, admin)
    async uploadAndReconcile(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            // Parse column mapping from request body
            let columnMapping = null;
            if (req.body.mapping) {
                try {
                    columnMapping = JSON.parse(req.body.mapping);
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid column mapping format'
                    });
                }
            }

            // Parse uploaded file with column mapping
            const uploadedData = await fileParserService.parseFile(req.file, columnMapping);

            if (uploadedData.length === 0) {
                await fileParserService.cleanupFile(req.file.path);
                return res.status(400).json({
                    success: false,
                    message: 'No valid records found in file'
                });
            }

            // Create upload job ID
            const uploadJobId = new mongoose.Types.ObjectId();

            // Save uploaded transactions
            const uploadedRecords = await Transaction.insertMany(
                uploadedData.map(data => ({
                    ...data,
                    source: 'upload',
                    uploadJobId
                }))
            );

            // Get system records
            const systemRecords = await Transaction.find({ source: 'system' });

            // Get active reconciliation rules
            const rules = await ReconciliationRule.find({ enabled: true }).sort({ order: 1 });

            // Perform reconciliation
            const reconciliationResults = await reconciliationService.reconcile(
                uploadedRecords,
                systemRecords,
                rules,
                uploadJobId
            );

            // Save reconciliation results
            await ReconciliationResult.insertMany(reconciliationResults);

            // Get statistics
            const stats = await reconciliationService.getStatistics(uploadJobId);

            // Clean up uploaded file
            await fileParserService.cleanupFile(req.file.path);

            // Log activity
            await auditService.log({
                recordId: uploadJobId.toString(),
                userId: req.user._id,
                userName: req.user.name,
                action: 'upload',
                changes: [{
                    field: 'records_uploaded',
                    newValue: uploadedRecords.length
                }],
                source: 'upload',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                metadata: {
                    ...stats,
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    uploadJobId: uploadJobId.toString()
                }
            });

            res.status(200).json({
                success: true,
                message: 'File uploaded and reconciled successfully',
                data: {
                    uploadJobId,
                    statistics: stats,
                    fileStats: await fileParserService.getFileStats(uploadedData)
                }
            });
        } catch (error) {
            if (req.file) {
                await fileParserService.cleanupFile(req.file.path);
            }
            next(error);
        }
    }

    // @route   GET /api/reconciliation/results
    // @desc    Get reconciliation results with filters
    // @access  Private
    async getResults(req, res, next) {
        try {
            const {
                page = 1,
                limit = 50,
                status,
                uploadJobId,
                startDate,
                endDate,
                isResolved
            } = req.query;

            const query = {};

            if (status) query.status = status;
            if (uploadJobId) query.uploadJobId = uploadJobId;
            if (isResolved !== undefined) query.isResolved = isResolved === 'true';

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const results = await ReconciliationResult
                .find(query)
                .populate('uploadedRecord')
                .populate('systemRecord')
                .populate('reviewedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await ReconciliationResult.countDocuments(query);

            res.status(200).json({
                success: true,
                data: results,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   GET /api/reconciliation/results/:id
    // @desc    Get single reconciliation result
    // @access  Private
    async getResultById(req, res, next) {
        try {
            const result = await ReconciliationResult
                .findById(req.params.id)
                .populate('uploadedRecord')
                .populate('systemRecord')
                .populate('reviewedBy', 'name email role');

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Reconciliation result not found'
                });
            }

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   PUT /api/reconciliation/results/:id/correct
    // @desc    Apply manual correction to a result
    // @access  Private (analyst, admin)
    async manualCorrection(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const result = await ReconciliationResult.findById(id).populate('uploadedRecord');

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Reconciliation result not found'
                });
            }

            // Update the uploaded record
            const oldData = { ...result.uploadedRecord.toObject() };
            const updatedRecord = await Transaction.findByIdAndUpdate(
                result.uploadedRecord._id,
                updates,
                { new: true }
            );

            // Re-run reconciliation for this record
            const rules = await ReconciliationRule.find({ enabled: true }).sort({ order: 1 });
            const newResult = await reconciliationService.reconcileSingle(updatedRecord, rules);

            // Update reconciliation result
            const updatedResult = await ReconciliationResult.findByIdAndUpdate(
                id,
                {
                    ...newResult,
                    reviewedBy: req.user._id,
                    reviewedAt: new Date()
                },
                { new: true }
            ).populate('uploadedRecord systemRecord');

            // Log manual correction
            const changes = Object.keys(updates).map(field => ({
                field,
                oldValue: oldData[field],
                newValue: updates[field]
            }));

            await auditService.log({
                recordId: id,
                userId: req.user._id,
                userName: req.user.name,
                action: 'manual_edit',
                changes,
                source: 'manual',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                message: 'Manual correction applied successfully',
                data: updatedResult
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   GET /api/reconciliation/statistics
    // @desc    Get reconciliation statistics
    // @access  Private
    async getStatistics(req, res, next) {
        try {
            const { uploadJobId, startDate, endDate } = req.query;

            if (uploadJobId) {
                const stats = await reconciliationService.getStatistics(uploadJobId);
                return res.status(200).json({
                    success: true,
                    data: stats
                });
            }

            // Get overall statistics
            const query = {};
            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const results = await ReconciliationResult.find(query);

            const stats = {
                total: results.length,
                matched: results.filter(r => r.status === 'matched').length,
                partiallyMatched: results.filter(r => r.status === 'partially_matched').length,
                notMatched: results.filter(r => r.status === 'not_matched').length,
                duplicates: results.filter(r => r.status === 'duplicate').length,
                resolved: results.filter(r => r.isResolved).length
            };

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   GET /api/reconciliation/statistics/historical
    // @desc    Get historical reconciliation statistics (for trends)
    // @access  Private
    async getHistoricalStatistics(req, res, next) {
        try {
            const { days = 7, startDate, endDate } = req.query;

            // Calculate date range
            let start, end;
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            } else {
                end = new Date();
                start = new Date();
                start.setDate(start.getDate() - parseInt(days));
            }

            // Set to start of day
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);

            // Aggregate statistics by date
            const dailyStats = await ReconciliationResult.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        total: { $sum: 1 },
                        matched: {
                            $sum: { $cond: [{ $eq: ['$status', 'matched'] }, 1, 0] }
                        },
                        partiallyMatched: {
                            $sum: { $cond: [{ $eq: ['$status', 'partially_matched'] }, 1, 0] }
                        },
                        notMatched: {
                            $sum: { $cond: [{ $eq: ['$status', 'not_matched'] }, 1, 0] }
                        },
                        duplicates: {
                            $sum: { $cond: [{ $eq: ['$status', 'duplicate'] }, 1, 0] }
                        }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]);

            // Calculate accuracy and format data
            const formattedData = dailyStats.map(stat => ({
                date: new Date(stat._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                accuracy: stat.total > 0 ? parseFloat(((stat.matched / stat.total) * 100).toFixed(1)) : 0,
                total: stat.total,
                matched: stat.matched,
                partiallyMatched: stat.partiallyMatched,
                notMatched: stat.notMatched,
                duplicates: stat.duplicates
            }));

            res.status(200).json({
                success: true,
                data: formattedData
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ReconciliationController();
