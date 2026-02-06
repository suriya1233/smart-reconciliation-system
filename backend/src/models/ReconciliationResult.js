const mongoose = require('mongoose');

const reconciliationResultSchema = new mongoose.Schema({
    uploadedRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
        index: true
    },
    systemRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    status: {
        type: String,
        enum: {
            values: ['matched', 'partially_matched', 'not_matched', 'duplicate', 'pending_review'],
            message: '{VALUE} is not a valid status'
        },
        required: true,
        index: true
    },
    matchedBy: {
        type: String,
        trim: true
    },
    mismatchedFields: {
        type: [String],
        default: []
    },
    confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    uploadJobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UploadJob',
        required: true,
        index: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    isResolved: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
reconciliationResultSchema.index({ uploadJobId: 1, status: 1 });
reconciliationResultSchema.index({ createdAt: -1 });

const ReconciliationResult = mongoose.model('ReconciliationResult', reconciliationResultSchema);

module.exports = ReconciliationResult;
