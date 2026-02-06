const auditService = require('../services/auditService');

class AuditController {
   
    async getAllLogs(req, res, next) {
        try {
            const { page, limit, action, userId, source, startDate, endDate } = req.query;

            const filters = {};
            if (action) filters.action = action;
            if (userId) filters.userId = userId;
            if (source) filters.source = source;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;

            const result = await auditService.getAllLogs(filters, { page, limit });

            res.status(200).json({
                success: true,
                data: result.logs,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

   
    async getLogsByRecordId(req, res, next) {
        try {
            const { recordId } = req.params;
            const { page, limit } = req.query;

            const result = await auditService.getLogsByRecordId(recordId, { page, limit });

            res.status(200).json({
                success: true,
                data: result.logs,
                pagination: result.pagination
            });
        } catch (error) {
            next(error);
        }
    }

    async getActivitySummary(req, res, next) {
        try {
            const { startDate, endDate } = req.query;

            const summary = await auditService.getActivitySummary(startDate, endDate);

            res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuditController();
