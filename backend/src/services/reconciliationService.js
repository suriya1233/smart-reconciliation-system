const Transaction = require('../models/Transaction');
const ReconciliationResult = require('../models/ReconciliationResult');

class ReconciliationService {
    // Reconcile uploaded records against system records
    async reconcile(uploadedRecords, systemRecords, rules, uploadJobId) {
        const results = [];
        const transactionIdMap = new Map();
        const refNumberMap = new Map();
        const seenTransactionIds = new Set();

        // Build lookup maps for efficient matching
        systemRecords.forEach(record => {
            transactionIdMap.set(record.transactionId, record);
            if (record.referenceNumber) {
                refNumberMap.set(record.referenceNumber, record);
            }
        });

        // Sort rules by order
        const sortedRules = rules.sort((a, b) => a.order - b.order);

        for (const uploadedRecord of uploadedRecords) {
            let status = 'not_matched';
            let systemRecord = null;
            let mismatchedFields = [];
            let matchedBy = null;
            let confidence = 0;

            // Check for duplicates
            if (seenTransactionIds.has(uploadedRecord.transactionId)) {
                status = 'duplicate';
                confidence = 100;
            } else {
                seenTransactionIds.add(uploadedRecord.transactionId);

                // Apply rules in order
                for (const rule of sortedRules) {
                    if (!rule.enabled) continue;

                    if (rule.type === 'exact_match') {
                        const result = this.applyExactMatchRule(
                            uploadedRecord,
                            transactionIdMap,
                            rule
                        );
                        if (result.matched) {
                            status = 'matched';
                            systemRecord = result.systemRecord;
                            matchedBy = 'Exact Match';
                            confidence = 100;
                            break;
                        }
                    }

                    if (rule.type === 'partial_match' && status === 'not_matched') {
                        const result = this.applyPartialMatchRule(
                            uploadedRecord,
                            refNumberMap,
                            rule
                        );
                        if (result.matched) {
                            status = 'partially_matched';
                            systemRecord = result.systemRecord;
                            matchedBy = 'Partial Match (Reference)';
                            confidence = result.confidence;
                            mismatchedFields = result.mismatchedFields;
                            break;
                        }
                    }
                }
            }

            results.push({
                uploadedRecord: uploadedRecord._id,
                systemRecord: systemRecord?._id || null,
                status,
                mismatchedFields,
                matchedBy,
                confidence,
                uploadJobId,
                isResolved: status === 'matched'
            });
        }

        return results;
    }

    // Apply exact match rule
    applyExactMatchRule(uploadedRecord, transactionIdMap, rule) {
        const match = transactionIdMap.get(uploadedRecord.transactionId);

        if (!match) {
            return { matched: false };
        }

        // Check if amount matches (within 0.01 tolerance)
        const amountMatches = Math.abs(match.amount - uploadedRecord.amount) < 0.01;

        if (amountMatches) {
            return {
                matched: true,
                systemRecord: match
            };
        }

        return { matched: false };
    }

    // Apply partial match rule
    applyPartialMatchRule(uploadedRecord, refNumberMap, rule) {
        if (!uploadedRecord.referenceNumber) {
            return { matched: false };
        }

        const match = refNumberMap.get(uploadedRecord.referenceNumber);

        if (!match) {
            return { matched: false };
        }

        const variance = Math.abs(match.amount - uploadedRecord.amount) / match.amount;
        const allowedVariance = rule.config.variance || 0.02;

        if (variance <= allowedVariance) {
            const mismatchedFields = [];

            // Check for mismatched fields
            if (match.transactionId !== uploadedRecord.transactionId) {
                mismatchedFields.push('transactionId');
            }
            if (Math.abs(match.amount - uploadedRecord.amount) > 0.01) {
                mismatchedFields.push('amount');
            }
            if (match.date?.getTime() !== uploadedRecord.date?.getTime()) {
                mismatchedFields.push('date');
            }

            const confidence = Math.round((1 - variance) * 100);

            return {
                matched: true,
                systemRecord: match,
                mismatchedFields,
                confidence
            };
        }

        return { matched: false };
    }

    // Reconcile single record (for manual corrections)
    async reconcileSingle(uploadedRecord, rules) {
        const systemRecords = await Transaction.find({ source: 'system' });
        const results = await this.reconcile(
            [uploadedRecord],
            systemRecords,
            rules,
            uploadedRecord.uploadJobId
        );
        return results[0];
    }

    // Get reconciliation statistics
    async getStatistics(uploadJobId) {
        const results = await ReconciliationResult.find({ uploadJobId });

        const stats = {
            total: results.length,
            matched: results.filter(r => r.status === 'matched').length,
            partiallyMatched: results.filter(r => r.status === 'partially_matched').length,
            notMatched: results.filter(r => r.status === 'not_matched').length,
            duplicates: results.filter(r => r.status === 'duplicate').length,
            averageConfidence: 0
        };

        if (results.length > 0) {
            const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
            stats.averageConfidence = Math.round(totalConfidence / results.length);
        }

        stats.matchRate = results.length > 0
            ? Math.round((stats.matched / results.length) * 100)
            : 0;

        return stats;
    }
}

module.exports = new ReconciliationService();
