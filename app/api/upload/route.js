import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyJwt } from '@/lib/auth';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export async function POST(req) {
    try {
        // Must be logged in to upload
        const token = req.cookies.get('ssst_token')?.value;
        if (!verifyJwt(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get('file');
        const folder = formData.get('folder') || 'ssst';

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
            return NextResponse.json({ error: 'Cloudinary credentials not configured' }, { status: 500 });
        }

        const timestamp = Math.round((new Date).getTime() / 1000);

        // 1. Create string to sign
        // Cloudinary requires we sort params alphabetically, join with &, and append secret
        const strToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;

        // 2. Generate SHA-1 Hex signature
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

        // 3. Build the new form data for Cloudinary
        const cloudinaryData = new FormData();
        cloudinaryData.append('file', file);
        cloudinaryData.append('folder', folder);
        cloudinaryData.append('api_key', API_KEY);
        cloudinaryData.append('timestamp', timestamp);
        cloudinaryData.append('signature', signature);

        // 4. Send directly to Cloudinary via REST API
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: cloudinaryData
        });

        if (!res.ok) {
            const errLog = await res.json().catch(() => ({}));
            console.error('Cloudinary API Error:', errLog);
            return NextResponse.json({ error: errLog.error?.message || 'Upload failed' }, { status: res.status });
        }

        const data = await res.json();

        return NextResponse.json({
            success: true,
            url: data.secure_url,
            publicId: data.public_id
        });

    } catch (error) {
        console.error('Upload Route Error:', error);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
