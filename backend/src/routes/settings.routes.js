const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Get reconciliation rules
router.get(
    '/rules',
    authenticate,
    settingsController.getRules
);

// Update reconciliation rules (admin only)
router.put(
    '/rules',
    authenticate,
    authorize('admin'),
    settingsController.updateRules
);

// Get all users (admin only)
router.get(
    '/users',
    authenticate,
    authorize('admin'),
    settingsController.getUsers
);

// Create user (admin only)
router.post(
    '/users',
    authenticate,
    authorize('admin'),
    settingsController.createUser
);

// Update user (admin only)
router.put(
    '/users/:id',
    authenticate,
    authorize('admin'),
    settingsController.updateUser
);

// Delete user (admin only)
router.delete(
    '/users/:id',
    authenticate,
    authorize('admin'),
    settingsController.deleteUser
);

module.exports = router;
