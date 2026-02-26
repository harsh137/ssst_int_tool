import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export function signJwt(payload, expiresIn = '7d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}

export function setCookieUrlToken(res, name, value, options = {}) {
    const stringValue = typeof value === 'object' ? 'j:' + JSON.stringify(value) : String(value);

    if (options.maxAge) {
        options.expires = new Date(Date.now() + options.maxAge * 1000);
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
        ...options,
    };

    return serialize(name, stringValue, cookieOptions);
}
