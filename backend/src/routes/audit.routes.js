const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Get all audit logs (admin only)
router.get(
    '/logs',
    authenticate,
    auditController.getAllLogs
);

// Get logs for specific record
router.get(
    '/logs/:recordId',
    authenticate,
    auditController.getLogsByRecordId
);

// Get activity summary (admin only)
router.get(
    '/summary',
    authenticate,
    authorize('admin'),
    auditController.getActivitySummary
);

module.exports = router;
