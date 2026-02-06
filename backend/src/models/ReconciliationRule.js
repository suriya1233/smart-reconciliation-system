const mongoose = require('mongoose');

const reconciliationRuleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Rule name is required'],
        trim: true,
        unique: true
    },
    type: {
        type: String,
        enum: {
            values: ['exact_match', 'partial_match', 'duplicate_check', 'custom'],
            message: '{VALUE} is not a valid rule type'
        },
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    config: {
        fields: {
            type: [String],
            default: []
        },
        variance: {
            type: Number,
            min: 0,
            max: 1,
            default: 0.02
        },
        customLogic: {
            type: String
        },
        priority: {
            type: Number,
            default: 0
        }
    },
    enabled: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for efficient sorting and filtering
reconciliationRuleSchema.index({ enabled: 1, order: 1 });

const ReconciliationRule = mongoose.model('ReconciliationRule', reconciliationRuleSchema);

module.exports = ReconciliationRule;
