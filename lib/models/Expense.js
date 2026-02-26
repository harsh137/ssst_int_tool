import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
    category: { type: String, required: true },
    vendor: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentMode: { type: String, enum: ['cash', 'upi', 'bankTransfer'], required: true },
    date: { type: String, required: true },
    notes: { type: String },
    billImageUrl: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
    approvedBy: { type: String },
    approvedByName: { type: String },
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
