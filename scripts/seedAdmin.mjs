import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error('Missing MONGO_URI in .env.local');
    process.exit(1);
}

// User Schema Definition (simplified for seeding)
const UserSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    password: { type: String, select: false },
    role: String,
    permissions: [String],
    isActive: Boolean
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ mobile: '9999999999' });
        if (existingAdmin) {
            console.log('Super Admin already exists with mobile 9999999999');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = new User({
            name: 'Super Admin',
            mobile: '9999999999',
            password: hashedPassword,
            role: 'super_admin',
            permissions: [],
            isActive: true
        });

        await admin.save();
        console.log('Successfully created initial Super Admin!');
        console.log('Mobile: 9999999999');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedAdmin();
