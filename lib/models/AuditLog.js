import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'SYSTEM'],
    },
    resource: {
        type: String,
        required: true,
        enum: ['User', 'Donation', 'Expense', 'Utsav', 'Settings', 'Auth'],
    },
    resourceId: {
        // ID of the affected document (if applicable)
        type: mongoose.Schema.Types.ObjectId,
        required: false,
    },
    details: {
        // Human readable statement: e.g. "Approved expense for Tent rental"
        type: String,
        required: true,
    },
    user: {
        // The person who performed the action
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        name: { type: String, required: false },
        role: { type: String, required: false }
    },
    metadata: {
        // Any extra JSON data you might want to store (e.g. old vs new values)
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        required: false
    }
}, { timestamps: true });

// Index for fast dashboard querying (e.g. "show all recent logs by this user")
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ 'user.id': 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, action: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
