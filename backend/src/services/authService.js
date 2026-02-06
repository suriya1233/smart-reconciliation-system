const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

class AuthService {
    // Generate JWT token
    generateToken(userId) {
        return jwt.sign(
            { id: userId },
            config.jwtSecret,
            { expiresIn: config.jwtExpire }
        );
    }

    // Generate refresh token
    generateRefreshToken(userId) {
        return jwt.sign(
            { id: userId, type: 'refresh' },
            config.jwtSecret,
            { expiresIn: config.jwtRefreshExpire }
        );
    }

    // Register new user
    async register(userData) {
        // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Create user
        const user = await User.create(userData);

        // Generate tokens
        const token = this.generateToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        return {
            user,
            token,
            refreshToken
        };
    }

    // Login user
    async login(email, password) {
        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is inactive');
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Update last login
        user.lastLogin = new Date();

        // Generate tokens
        const token = this.generateToken(user._id);
        const refreshToken = this.generateRefreshToken(user._id);

        // Save refresh token
        user.refreshToken = refreshToken;
        await user.save();

        // Remove password from response
        user.password = undefined;

        return {
            user,
            token,
            refreshToken
        };
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, config.jwtSecret);

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid refresh token');
            }

            const user = await User.findById(decoded.id).select('+refreshToken');

            if (!user || user.refreshToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Generate new access token
            const token = this.generateToken(user._id);

            return { token };
        } catch (error) {
            throw new Error('Invalid or expired refresh token');
        }
    }

    // Logout user
    async logout(userId) {
        await User.findByIdAndUpdate(userId, {
            refreshToken: null
        });
    }

    // Get current user
    async getCurrentUser(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
}

module.exports = new AuthService();
