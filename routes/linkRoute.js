const express = require('express');
const db = require('../db_connect');
const upload = require('../middlewares/multerConfig');
const router = express.Router();

// Adding link
router.post('/add-link', upload.array('file'), (req, res) => {
    const { Task_ID } = req.body;
    const files = req.files;

    if (!Task_ID || !files || files.length === 0) {
        return res.status(400).json({ error: 'Task_ID and file are required' });
    }

    const insertLinkQuery = `
        INSERT INTO link (Task_ID, Name, Path, Type)
        VALUES ?;
    `;

    const values = files.map(file => [
        Task_ID,
        file.originalname,
        file.path,
        file.mimetype
    ]);

    db.query(insertLinkQuery, [values], (err, result) => {
        if (err) {
            console.error('Error adding links:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Links added successfully', linkCount: files.length });
    });
});

// Selecting links for a task
router.get('/select-by-task/:taskId', (req, res) => {
    const { taskId } = req.params;

    const selectLinksQuery = `
        SELECT Link_ID, Name, Path, Type
        FROM link
        WHERE Task_ID = ?;
    `;

    db.query(selectLinksQuery, [taskId], (err, results) => {
        if (err) {
            console.error('Error fetching links:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

module.exports = router;