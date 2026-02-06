const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    recordId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: {
            values: [
                'upload',
                'reconcile',
                'manual_edit',
                'approve',
                'reject',
                'delete',
                'create',
                'update',
                'view'
            ],
            message: '{VALUE} is not a valid action'
        },
        index: true
    },
    changes: [{
        field: {
            type: String,
            required: true
        },
        oldValue: {
            type: mongoose.Schema.Types.Mixed
        },
        newValue: {
            type: mongoose.Schema.Types.Mixed
        }
    }],
    source: {
        type: String,
        enum: {
            values: ['manual', 'system', 'upload', 'api'],
            message: '{VALUE} is not a valid source'
        },
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false
});

// Compound indexes for efficient querying
auditLogSchema.index({ recordId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
