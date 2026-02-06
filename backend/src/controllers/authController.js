const authService = require('../services/authService');
const auditService = require('../services/auditService');

class AuthController {
    async register(req, res, next) {
        try {
            const { name, email, password, role } = req.body;

            const result = await authService.register({
                name,
                email,
                password,
                role: role || 'viewer'
            });


            await auditService.log({
                recordId: result.user._id.toString(),
                userId: result.user._id,
                userName: result.user.name,
                action: 'create',
                source: 'api',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    token: result.token,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            next(error);
        }
    }


    async login(req, res, next) {
        try {
            const { email, password } = req.body;

            const result = await authService.login(email, password);


            await auditService.log({
                recordId: result.user._id.toString(),
                userId: result.user._id,
                userName: result.user.name,
                action: 'login',
                source: 'api',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    token: result.token,
                    refreshToken: result.refreshToken
                }
            });
        } catch (error) {
            console.error('Login error:', error.message); // Add logging for debugging
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }


    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token required'
                });
            }

            const result = await authService.refreshAccessToken(refreshToken);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }


    async logout(req, res, next) {
        try {
            await authService.logout(req.user._id);


            await auditService.log({
                recordId: req.user._id.toString(),
                userId: req.user._id,
                userName: req.user.name,
                action: 'logout',
                source: 'api',
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });

            res.status(200).json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error) {
            next(error);
        }
    }


    async getCurrentUser(req, res, next) {
        try {
            const user = await authService.getCurrentUser(req.user._id);

            res.status(200).json({
                success: true,
                data: { user }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
