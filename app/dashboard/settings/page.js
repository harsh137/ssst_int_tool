'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useLang } from '@/lib/context/LangContext';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { toast } from '@/components/ui/Toast';

export default function SettingsPage() {
    const { currentUser } = useAuth();
    const { lang } = useLang();
    const fileRef = useRef(null);

    const isSuperAdmin = hasPermission(currentUser, PERMISSIONS.USER_CREATE);

    const [settings, setSettings] = useState({ upiQrUrl: '', upiQrPublicId: '', trustName: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            if (data.success) setSettings(data.settings);
        } catch { toast.error('Check your connection'); }
    };

    useEffect(() => { loadSettings(); }, []);

    if (!isSuperAdmin) {
        return (
            <div className="clay-card p-10 text-center">
                <p className="text-4xl mb-3">🔒</p>
                <p style={{ color: '#374151', fontWeight: 600 }}>
                    {lang === 'hi' ? 'केवल सुपर एडमिन के लिए' : 'Super Admin access only'}
                </p>
            </div>
        );
    }

    const handleQrUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setUploadError(lang === 'hi' ? 'केवल छवि फ़ाइलें स्वीकृत हैं' : 'Only image files accepted');
            return;
        }
        setUploadError('');
        setUploading(true);
        try {
            const { url, publicId } = await uploadToCloudinary(file, 'ssst/qr');
            const updated = { upiQrUrl: url, upiQrPublicId: publicId };

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSettings((prev) => ({ ...prev, ...updated }));
                toast.success(lang === 'hi' ? 'QR कोड अपलोड हो गया' : 'UPI QR code uploaded successfully');
            } else {
                throw new Error(data.error || 'Failed to update settings');
            }
        } catch (err) {
            setUploadError(err.message || 'Upload failed');
            toast.error('Upload failed');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const handleRemoveQr = async () => {
        const updated = { upiQrUrl: '', upiQrPublicId: '' };
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
            if (res.ok) {
                setSettings((prev) => ({ ...prev, ...updated }));
                toast.info(lang === 'hi' ? 'QR कोड हटाया गया' : 'UPI QR code removed');
            } else {
                toast.error('Failed to remove');
            }
        } catch {
            toast.error('Network Error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="anim-fade-up">
                <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>
                    {lang === 'hi' ? 'सेटिंग्स' : 'Settings'}
                </h1>
                <p className="text-sm font-medium mt-0.5" style={{ color: '#4B5563' }}>
                    {lang === 'hi' ? 'सिस्टम कॉन्फ़िगरेशन — केवल सुपर एडमिन' : 'System configuration — Super Admin only'}
                </p>
            </div>

            {/* ── UPI QR Code Section ── */}
            <div className="clay-card p-6 anim-fade-up delay-1">
                {/* Section header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: 'linear-gradient(135deg, #FF8534, #FF6B00)', boxShadow: '0 4px 12px rgba(255,107,0,0.35)' }}>
                        📱
                    </div>
                    <div>
                        <h2 className="font-bold" style={{ fontSize: 15, color: '#111827' }}>
                            {lang === 'hi' ? 'UPI QR कोड' : 'UPI QR Code'}
                        </h2>
                        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
                            {lang === 'hi'
                                ? 'दान के दौरान दिखाया गया Trust का स्थायी QR कोड'
                                : 'The Trust\'s fixed QR code shown to donors during UPI payments'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* QR Preview */}
                    <div className="flex-shrink-0">
                        {settings.upiQrUrl ? (
                            <div className="relative">
                                <img
                                    src={settings.upiQrUrl}
                                    alt="UPI QR Code"
                                    className="w-44 h-44 object-contain rounded-2xl border-2"
                                    style={{ border: '2px solid rgba(0,0,0,0.10)', background: '#fff' }}
                                />
                                <div className="absolute -top-2 -right-2">
                                    <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-44 h-44 rounded-2xl flex flex-col items-center justify-center"
                                style={{ background: 'linear-gradient(145deg, #F3F3F3, #E8E4DF)', border: '2px dashed rgba(0,0,0,0.15)' }}>
                                <span className="text-4xl mb-2">🔲</span>
                                <p className="text-xs font-medium text-center px-3" style={{ color: '#9CA3AF' }}>
                                    {lang === 'hi' ? 'कोई QR नहीं' : 'No QR uploaded'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Upload controls */}
                    <div className="flex-1 space-y-3">
                        <p className="text-sm font-medium" style={{ color: '#374151' }}>
                            {settings.upiQrUrl
                                ? (lang === 'hi' ? 'QR कोड सक्रिय है। नया अपलोड करने के लिए नीचे क्लिक करें।' : 'QR code is active. Upload a new one to replace it.')
                                : (lang === 'hi' ? 'Trust का UPI QR कोड अपलोड करें। यह दान फ़ॉर्म में दिखेगा।' : 'Upload the Trust\'s UPI QR code. It will appear in the donation form when staff selects UPI payment.')}
                        </p>

                        <input ref={fileRef} type="file" accept="image/*" onChange={handleQrUpload}
                            className="hidden" id="qr-upload" />

                        <div className="flex flex-wrap gap-2">
                            <label htmlFor="qr-upload"
                                className="clay-btn clay-btn-primary !text-sm cursor-pointer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.7 : 1 }}>
                                {uploading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full anim-spin" />
                                        {lang === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'}
                                    </>
                                ) : (
                                    <>📤 {settings.upiQrUrl ? (lang === 'hi' ? 'QR बदलें' : 'Replace QR') : (lang === 'hi' ? 'QR अपलोड करें' : 'Upload QR Code')}</>
                                )}
                            </label>

                            {settings.upiQrUrl && (
                                <button onClick={handleRemoveQr} className="clay-btn clay-btn-secondary !text-sm"
                                    style={{ color: '#DC2626' }}>
                                    🗑 {lang === 'hi' ? 'हटाएँ' : 'Remove'}
                                </button>
                            )}
                        </div>

                        {uploadError && (
                            <p className="text-sm text-red-600 font-medium">{uploadError}</p>
                        )}

                        <div className="p-3 rounded-xl text-xs font-medium"
                            style={{ background: 'linear-gradient(145deg, #FFF7ED, #FFEDD5)', border: '1px solid rgba(255,107,0,0.15)', color: '#92400E' }}>
                            💡 {lang === 'hi'
                                ? 'JPG, PNG फ़ॉर्मेट स्वीकार्य हैं। Cloudinary पर संग्रहीत।'
                                : 'JPG, PNG formats accepted. Stored securely on Cloudinary.'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Cloudinary Status Card ── */}
            <div className="clay-card p-5 anim-fade-up delay-2">
                <h2 className="font-bold mb-3" style={{ fontSize: 14, color: '#111827' }}>
                    {lang === 'hi' ? 'Cloudinary स्थिति' : 'Cloudinary Status'}
                </h2>
                {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        {lang === 'hi' ? 'Cloudinary कॉन्फ़िगर है' : 'Cloudinary configured & ready'}
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                            {lang === 'hi' ? 'Cloudinary कॉन्फ़िगर नहीं है (Dev मोड)' : 'Cloudinary not configured (Dev mode — local URLs used)'}
                        </div>
                        <div className="p-3 rounded-xl text-xs font-mono"
                            style={{ background: '#1F2937', color: '#F9FAFB' }}>
                            <p className="text-green-400 mb-1"># Add to .env.local:</p>
                            <p>NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud</p>
                            <p>NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_preset</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
