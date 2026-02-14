import jwt from 'jsonwebtoken';
const TOKEN_EXPIRES_IN = '7d';
const getJwtSecret = () => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is missing.');
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
