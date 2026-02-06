const express = require('express');
const router = express.Router();
const reconciliationController = require('../controllers/reconciliationController');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { upload } = require('../config/multer');

// Upload and reconcile file
router.post(
    '/upload',
    authenticate,
    authorize('admin', 'analyst'),
    upload.single('file'),
    reconciliationController.uploadAndReconcile
);

// Get reconciliation results
router.get(
    '/results',
    authenticate,
    reconciliationController.getResults
);

// Get single result
router.get(
    '/results/:id',
    authenticate,
    reconciliationController.getResultById
);

// Manual correction
router.put(
    '/results/:id/correct',
    authenticate,
    authorize('admin', 'analyst'),
    reconciliationController.manualCorrection
);

// Get statistics
router.get(
    '/statistics',
    authenticate,
    reconciliationController.getStatistics
);

// Get historical statistics (for trends)
router.get(
    '/statistics/historical',
    authenticate,
    reconciliationController.getHistoricalStatistics
);

module.exports = router;
