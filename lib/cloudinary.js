// lib/cloudinary.js
// All image uploads in SSST route through this utility.
// Set these in .env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Upload a File object to Cloudinary.
 * @param {File}   file    The file to upload
 * @param {string} folder  Cloudinary folder: 'ssst/qr' | 'ssst/upi_screenshots' | 'ssst/bills'
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(file, folder = 'ssst') {
    // ── Dev fallback: no credentials → use local object URL ──────────────
    if (!CLOUD_NAME) {
        console.warn('[Cloudinary] No credentials set. Using local object URL for dev.');
        const url = URL.createObjectURL(file);
        return { url, publicId: `local_${Date.now()}` };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    // Hit our secure backend route which calculates the crypto signature
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Server upload failed');
    }

    const data = await res.json();
    return { url: data.url, publicId: data.publicId };
}

/**
 * React hook-friendly upload handler.
 * Returns { uploading, error, upload }
 */
export function useCloudinaryUpload() {
    const { useState } = require('react');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const upload = async (file, folder) => {
        setUploading(true);
        setError(null);
        try {
            const result = await uploadToCloudinary(file, folder);
            return result;
        } catch (e) {
            setError(e.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    return { uploading, error, upload };
}
