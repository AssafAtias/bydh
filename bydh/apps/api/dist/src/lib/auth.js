import jwt from 'jsonwebtoken';
const TOKEN_EXPIRES_IN = '7d';
const getJwtSecret = () => {
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (jwtSecret) {
        process.env.JWT_SECRET = jwtSecret;
        return jwtSecret;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is missing. Set JWT_SECRET in Render env vars.');
    }
    return 'dev-only-secret-change-me';
};
export const signAuthToken = (user) => jwt.sign({ email: user.email }, getJwtSecret(), {
    subject: user.id,
    expiresIn: TOKEN_EXPIRES_IN,
});
const parseBearerToken = (req) => {
    const authorization = req.header('authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) {
        return null;
    }
    const token = authorization.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
};
export const getUserIdFromRequest = (req) => {
    const token = parseBearerToken(req);
    if (!token) {
        return null;
    }
    try {
        const payload = jwt.verify(token, getJwtSecret());
        return payload.sub;
    }
    catch {
        return null;
    }
};
