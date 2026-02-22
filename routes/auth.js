const jwt = require('jsonwebtoken');
const { Firma } = require('../source/db');
const User = Firma;

module.exports = async (req, res, next) => {
    try {
        console.log("hallo")
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            console.log("hallo1")
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            console.log("hallo2")
            return res.status(401).json({ message: 'Token missing' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            console.log("hallo6")
            return res.status(401).json({ message: 'Invalid token payload' });
        }
        const user = await User.findByPk(decoded.id);
        if (!user) {
            console.log("hallo3")
            return res.status(401).json({ message: 'User not found' });
        }
        console.log("hallo4")

        req.user = user;
        next();
    } catch (error) {
        console.log("hallo5")
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
}