import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this user.'],
    },
    mobile: {
        type: String,
        required: [true, 'Please provide a 10-digit mobile number.'],
        unique: true,
        match: [/^\d{10}$/, 'Please provide a valid 10-digit mobile number.'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password.'],
        select: false, // Don't return password by default
    },
    role: {
        type: String,
        required: true,
        enum: ['super_admin', 'founder', 'ca', 'staff'],
    },
    permissions: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
