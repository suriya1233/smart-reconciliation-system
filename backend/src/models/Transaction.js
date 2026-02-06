const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: [true, 'Transaction ID is required'],
        trim: true,
        index: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    referenceNumber: {
        type: String,
        trim: true,
        index: true
    },
    date: {
        type: Date,
        required: [true, 'Transaction date is required'],
        index: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        trim: true
    },
    vendor: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: {
            values: ['system', 'upload'],
            message: '{VALUE} is not a valid source'
        },
        required: true,
        index: true
    },
    uploadJobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UploadJob'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
transactionSchema.index({ transactionId: 1, source: 1 });
transactionSchema.index({ referenceNumber: 1, source: 1 });
transactionSchema.index({ date: 1, source: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
