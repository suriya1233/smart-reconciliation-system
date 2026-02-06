const AuditLog = require('../models/AuditLog');

class AuditService {
    // Create audit log entry
    async log(logData) {
        try {
            const auditLog = await AuditLog.create({
                recordId: logData.recordId,
                userId: logData.userId,
                userName: logData.userName,
                action: logData.action,
                changes: logData.changes || [],
                source: logData.source,
                ipAddress: logData.ipAddress,
                userAgent: logData.userAgent,
                metadata: logData.metadata || {}
            });

            return auditLog;
        } catch (error) {
            console.error('Error creating audit log:', error);
            // Don't throw error - audit logging should not break main flow
            return null;
        }
    }

    // Get audit logs for a specific record
    async getLogsByRecordId(recordId, options = {}) {
        const { page = 1, limit = 50 } = options;

        const logs = await AuditLog.find({ recordId })
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await AuditLog.countDocuments({ recordId });

        return {
            logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get audit logs for a specific user
    async getLogsByUserId(userId, options = {}) {
        const { page = 1, limit = 50, action } = options;

        const query = { userId };
        if (action) {
            query.action = action;
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await AuditLog.countDocuments(query);

        return {
            logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get all audit logs with filters
    async getAllLogs(filters = {}, options = {}) {
        const { page = 1, limit = 50 } = options;
        const query = {};

        if (filters.action) {
            query.action = filters.action;
        }

        if (filters.userId) {
            query.userId = filters.userId;
        }

        if (filters.source) {
            query.source = filters.source;
        }

        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) {
                query.timestamp.$gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                query.timestamp.$lte = new Date(filters.endDate);
            }
        }

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await AuditLog.countDocuments(query);

        return {
            logs,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Get activity summary
    async getActivitySummary(startDate, endDate) {
        const match = {};
        if (startDate || endDate) {
            match.timestamp = {};
            if (startDate) match.timestamp.$gte = new Date(startDate);
            if (endDate) match.timestamp.$lte = new Date(endDate);
        }

        const summary = await AuditLog.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const userActivity = await AuditLog.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    actions: { $push: '$action' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return {
            actionSummary: summary,
            topUsers: userActivity
        };
    }
}

module.exports = new AuditService();
