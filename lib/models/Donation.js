import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema({
    donorName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    fundType: { type: String, enum: ['general', 'utsav'], required: true },
    utsavId: { type: String },
    utsavName: { type: String },
    paymentMode: { type: String, enum: ['cash', 'upi', 'bankTransfer'], required: true },
    upiRefNo: { type: String },
    upiScreenshotUrl: { type: String },
    date: { type: String, required: true },
    receiptNumber: { type: String, required: true, unique: true },
    notes: { type: String },
    receiptPdfUrl: { type: String }, // To be generated later
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Donation || mongoose.model('Donation', DonationSchema);
