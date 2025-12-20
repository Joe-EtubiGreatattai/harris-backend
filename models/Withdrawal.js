const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    amount: { type: Number, required: true }, // in Naira
    status: {
        type: String,
        enum: ['Pending', 'Success', 'Failed'],
        default: 'Pending'
    },
    bankName: { type: String, required: true },
    bankCode: { type: String, required: true },
    accountNumber: { type: String, required: true },
    accountName: { type: String, required: true },
    transferCode: String,
    reference: { type: String, required: true, unique: true },
    reason: String
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
