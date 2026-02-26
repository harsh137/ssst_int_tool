import mongoose from 'mongoose';

const UtsavSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameHi: { type: String },
    description: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    targetAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
}, { timestamps: true });

// In development, handle hot-reloads by deleting the model from cache
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Utsav;
}

export default mongoose.models.Utsav || mongoose.model('Utsav', UtsavSchema);
