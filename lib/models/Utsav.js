import mongoose from 'mongoose';

const UtsavSchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameHi: { type: String },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Utsav || mongoose.model('Utsav', UtsavSchema);
