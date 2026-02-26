import connectDB from './db/mongodb';
import AuditLog from './models/AuditLog';
import { verifyJwt } from './auth';
import { cookies } from 'next/headers';

/**
 * Helper to log system actions to MongoDB.
 * @param {Object} params
 * @param {string} params.action - CREATE, UPDATE, DELETE, LOGIN, LOGOUT, APPROVE, REJECT, EXPORT
 * @param {string} params.resource - User, Donation, Expense, Utsav, Settings, Auth
 * @param {string} params.details - Human readable description (e.g. "Logged in successfully")
 * @param {string} [params.resourceId] - MongoDB ObjectId of the affected document
 * @param {Object} [params.userOverride] - Provide a specific user object (id, name, role) if not using the request cookie JWT
 * @param {Object} [params.metadata] - Extra JSON payload
 */
export async function logAction({ action, resource, details, resourceId, userOverride, metadata = {} }) {
    try {
        await connectDB();

        let userData = { id: null, name: 'System', role: 'system' };

        // 1. Try to use explicit override (e.g. during Login POST where cookie isn't set yet)
        if (userOverride) {
            userData = {
                id: userOverride._id || userOverride.id,
                name: userOverride.name,
                role: userOverride.role
            };
        }
        // 2. Otherwise try to extract from cookies automatically (for standard protected APIs)
        else {
            const cookieStore = await cookies();
            const token = cookieStore.get('ssst_token')?.value;
            if (token) {
                const decoded = verifyJwt(token);
                if (decoded) {
                    userData = {
                        id: decoded.userId,
                        name: decoded.name || 'User', // name might not be in basic JWT, but frontend usually has it
                        role: decoded.role
                    };

                    // If token doesn't have name, we could fetch it, but usually the Role + ID is enough for the log reference.
                    // For perfect logs, we rely on the DB population later.
                }
            }
        }

        const logEntry = new AuditLog({
            action,
            resource,
            resourceId,
            details,
            user: userData,
            metadata
        });

        await logEntry.save();
    } catch (err) {
        // We catch and suppress audit log errors so they don't crash main business logic
        console.error('Failed to write Audit Log:', err);
    }
}
