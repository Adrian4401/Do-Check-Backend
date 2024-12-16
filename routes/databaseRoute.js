const express = require('express');
const db = require('../db_connect');
const router = express.Router();

//Deleting tasks
router.put('/delete-everything', (req, res) => {

    const deleteLinkQuery = 'UPDATE link SET Is_deleted = 1';
    const deleteTaskQuery = 'UPDATE task SET Is_deleted = 1';

    db.query(deleteLinkQuery, (err, results) => {
        if (err) {
            console.error('Error deleting links:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        db.query(deleteTaskQuery, (err, results) => {
            if (err) {
                console.error('Error deleting tasks:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            return res.json({ messege: 'Database cleared successfully' });
        });
    });
});

module.exports = router;