export default {
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-key-for-animal-shelter',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    },
    bcrypt: {
        saltRounds: 12
    }
};