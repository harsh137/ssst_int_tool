'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const sizeW = { sm: '420px', md: '560px', lg: '720px' }[size] ?? '560px';

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#1A1F36]/40 backdrop-blur-md" onClick={onClose} />

            {/* Modal — claymorphism */}
            <div className="clay-card-lg relative w-full anim-scale-in z-10 flex flex-col max-h-[90vh]"
                style={{ maxWidth: sizeW }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                    <button onClick={onClose}
                        className="clay-btn clay-btn-ghost w-8 h-8 !p-0 rounded-xl flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}>
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6 flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmVariant = 'danger' }) {
    if (!isOpen) return null;
    const btnCls = confirmVariant === 'danger' ? 'clay-btn-danger' : 'clay-btn-primary';
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <div className="flex gap-3">
                <button onClick={onClose} className="clay-btn clay-btn-secondary flex-1">Cancel</button>
                <button onClick={onConfirm} className={`clay-btn ${btnCls} flex-1`}>{confirmText}</button>
            </div>
        </Modal>
    );
}
