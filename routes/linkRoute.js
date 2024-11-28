const express = require('express');
const db = require('../db_connect'); // Import bazy danych
const router = express.Router();
const multer = require('multer'); // Middleware do obs³ugi przesy³ania plików

// Konfiguracja multer do przesy³ania plików
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder, gdzie bêd¹ zapisywane pliki
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unikalna nazwa pliku
    }
});
const upload = multer({ storage });

// Dodawanie za³¹cznika
router.post('/add-link', upload.single('file'), (req, res) => {
    const { Task_ID } = req.body;
    const file = req.file;

    if (!Task_ID || !file) {
        return res.status(400).json({ error: 'Task_ID and file are required' });
    }

    const insertLinkQuery = `
        INSERT INTO link (Task_ID, Name, Path, Type)
        VALUES (?, ?, ?, ?);
    `;

    db.query(
        insertLinkQuery,
        [Task_ID, file.originalname, file.path, file.mimetype],
        (err, result) => {
            if (err) {
                console.error('Error adding attachment:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Link added successfully', linkId: result.insertId });
        }
    );
});

// Pobieranie za³¹czników dla danego zadania
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

// Usuwanie za³¹cznika
router.delete('/delete-attachment/:attachmentId', (req, res) => {
    const { attachmentId } = req.params;

    const deleteAttachmentQuery = `
        DELETE FROM attachment WHERE Attachment_ID = ?;
    `;

    db.query(deleteAttachmentQuery, [attachmentId], (err, result) => {
        if (err) {
            console.error('Error deleting attachment:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        res.json({ message: 'Attachment deleted successfully' });
    });
});

module.exports = router;