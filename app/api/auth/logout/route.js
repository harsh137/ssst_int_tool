import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    // Clear the cookie natively
    response.cookies.delete('ssst_token');

    const { logAction } = await import('@/lib/logger');
    await logAction({
        action: 'LOGOUT',
        resource: 'Auth',
        details: 'User logged out'
    });

    return response;
}
