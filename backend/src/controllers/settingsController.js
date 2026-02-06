const ReconciliationRule = require('../models/ReconciliationRule');
const User = require('../models/User');
const auditService = require('../services/auditService');

class SettingsController {
    // @route   GET /api/settings/rules
    // @desc    Get all reconciliation rules
    // @access  Private
    async getRules(req, res, next) {
        try {
            const rules = await ReconciliationRule.find()
                .populate('createdBy updatedBy', 'name email')
                .sort({ order: 1 });

            res.status(200).json({
                success: true,
                data: rules
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   PUT /api/settings/rules
    // @desc    Update reconciliation rules
    // @access  Private (admin)
    async updateRules(req, res, next) {
        try {
            const { rules } = req.body;

            if (!Array.isArray(rules)) {
                return res.status(400).json({
                    success: false,
                    message: 'Rules must be an array'
                });
            }

            const updatedRules = [];

            for (const ruleData of rules) {
                if (ruleData._id) {
                    // Update existing rule
                    const rule = await ReconciliationRule.findByIdAndUpdate(
                        ruleData._id,
                        {
                            ...ruleData,
                            updatedBy: req.user._id
                        },
                        { new: true }
                    );
                    updatedRules.push(rule);
                } else {
                    // Create new rule
                    const rule = await ReconciliationRule.create({
                        ...ruleData,
                        createdBy: req.user._id,
                        updatedBy: req.user._id
                    });
                    updatedRules.push(rule);
                }
            }

            // Log activity
            await auditService.log({
                recordId: 'settings',
                userId: req.user._id,
                userName: req.user.name,
                action: 'update',
                changes: [{
                    field: 'reconciliation_rules',
                    newValue: updatedRules.length
                }],
                source: 'manual',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                message: 'Rules updated successfully',
                data: updatedRules
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   GET /api/settings/users
    // @desc    Get all users
    // @access  Private (admin)
    async getUsers(req, res, next) {
        try {
            const { page = 1, limit = 50, role, isActive } = req.query;

            const query = {};
            if (role) query.role = role;
            if (isActive !== undefined) query.isActive = isActive === 'true';

            const users = await User.find(query)
                .select('-password -refreshToken')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await User.countDocuments(query);

            res.status(200).json({
                success: true,
                data: users,
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

    // @route   PUT /api/settings/users/:id
    // @desc    Update user
    // @access  Private (admin)
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Don't allow password updates through this endpoint
            delete updates.password;
            delete updates.refreshToken;

            const user = await User.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            ).select('-password -refreshToken');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Log activity
            await auditService.log({
                recordId: id,
                userId: req.user._id,
                userName: req.user.name,
                action: 'update',
                changes: Object.keys(updates).map(field => ({
                    field,
                    newValue: updates[field]
                })),
                source: 'manual',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   POST /api/settings/users
    // @desc    Create new user
    // @access  Private (admin)
    async createUser(req, res, next) {
        try {
            const { name, email, password, role, isActive } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Create new user
            const user = await User.create({
                name,
                email: email.toLowerCase(),
                password,
                role: role || 'viewer',
                isActive: isActive !== undefined ? isActive : true
            });

            // Log activity
            await auditService.log({
                recordId: user._id,
                userId: req.user._id,
                userName: req.user.name,
                action: 'create',
                changes: [{
                    field: 'user_created',
                    newValue: `${name} (${email})`
                }],
                source: 'manual',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            // Remove password from response
            const userResponse = user.toJSON();

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userResponse
            });
        } catch (error) {
            next(error);
        }
    }

    // @route   DELETE /api/settings/users/:id
    // @desc    Delete user
    // @access  Private (admin)
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;

            // Prevent deleting yourself
            if (id === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot delete your own account'
                });
            }

            const user = await User.findById(id).select('-password -refreshToken');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            await User.findByIdAndDelete(id);

            // Log activity
            await auditService.log({
                recordId: id,
                userId: req.user._id,
                userName: req.user.name,
                action: 'delete',
                changes: [{
                    field: 'user_deleted',
                    oldValue: `${user.name} (${user.email})`
                }],
                source: 'manual',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SettingsController();
