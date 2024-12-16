const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db_connect');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.use(express.json());

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Request Body:', req.body);
    console.log(username + " " + password);

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const loginQuery = 'SELECT * FROM user WHERE Username LIKE ?';

    db.query(loginQuery, [username], async (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid user' });
        }
        const user = results[0];
        console.log('User: ', user);

        if (password !== user.Password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign(
            { id: user.User_ID, username: user.Username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.User_ID,
            },
        });
    });
});

module.exports = router;