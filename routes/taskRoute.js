const express = require('express');
const db = require('../db_connect');
const upload = require('../middlewares/multerConfig');
const mysql = require('mysql2/promise');
const router = express.Router();

router.use(express.urlencoded({ extended: true }));
router.use(express.json());

//Adding tasks
router.post('/add-task', (req, res) => {
    const { User_ID, Title, Descript, Due_date, Refresh, Refresh_rate } = req.body;
    console.log('Body:', req.body);

    // Check required fields
    if (!User_ID || !Title || !Due_date)
        return res.status(402).json({ error: 'User_ID, Title, and Due_date are required' });
    
    // Validation
    const dueDate = new Date(Due_date);
    if (isNaN(dueDate.getTime())) {
        return res.status(401).json({ error: 'Invalid date format for Due_date. Use YYYY-MM-DD.' });
    }

    // SQL query
    const insertTaskQuery = `
        INSERT INTO task (User_ID, Title, Descript, Due_date, Refresh, Refresh_rate)
        VALUES (?, ?, ?, ?, ?, ?);
    `;

    db.query(
        insertTaskQuery,
        [User_ID, Title, Descript, Due_date, Refresh || false, Refresh_rate || null],
        (err, result) => {
            if (err) {
                console.error('Error adding task:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Task added successfully', taskId: result.insertId });
        }
    );
});

//Updating tasks (with files)
router.put('/update-task/', (req, res) => {
    const { Task_ID, Title, Descript, Due_date, Refresh, Refresh_rate } = req.body;

    if (!Task_ID) {
        return res.status(401).json({ error: 'Task_ID is required to update the task.' });
    }

    if (!Title && !Descript && !Due_date && Refresh === undefined && !Refresh_rate) {
        return res.status(402).json({ error: 'At least one field is required to update' });
    }

    // Build the dynamic SQL query based on provided fields
    let updateFields = [];
    let values = [];

    if (Title) {
        updateFields.push('Title = ?');
        values.push(Title);
    }
    if (Descript) {
        updateFields.push('Descript = ?');
        values.push(Descript);
    }
    if (Due_date) {
        updateFields.push('Due_date = ?');
        values.push(Due_date);
    }
    if (Refresh !== undefined) { // Check explicitly for undefined to allow setting false
        updateFields.push('Refresh = ?');
        values.push(Refresh);
    }
    if (Refresh_rate) {
        updateFields.push('Refresh_rate = ?');
        values.push(Refresh_rate);
    }

    // Convert the array of fields to a single string for the query
    const updateTaskQuery = `UPDATE task SET ${updateFields.join(', ')} WHERE Task_ID = ?`;
    values.push(Task_ID); // Add the task ID to the end of the values array

    // Execute the query
    db.query(updateTaskQuery, values, (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            // No rows were affected, so the task ID might not exist
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task updated successfully' });
    });
});

//Updating tasks (with files)
router.put('/update-task-experiment/', upload.array('file'), async (req, res) => {
    const { Task_ID, Title, Descript, Due_date, Refresh, Refresh_rate } = req.body;
    const files = req.files;

    if (!Task_ID) {
        return res.status(401).json({ error: 'Task_ID is required to update the task.' });
    }
    
    if (!Title && !Descript && !Due_date && Refresh === undefined && !Refresh_rate) {
        return res.status(402).json({ error: 'At least one field is required to update' });
    }

    // Build the dynamic SQL query based on provided fields
    let updateFields = [];
    let values = [];

    if (Title) {
        updateFields.push('Title = ?');
        values.push(Title);
    }
    if (Descript) {
        updateFields.push('Descript = ?');
        values.push(Descript);
    }
    if (Due_date) {
        updateFields.push('Due_date = ?');
        values.push(Due_date);
    }
    if (Refresh !== undefined) { // Check explicitly for undefined to allow setting false
        updateFields.push('Refresh = ?');
        values.push(Refresh);
    }
    if (Refresh_rate) {
        updateFields.push('Refresh_rate = ?');
        values.push(Refresh_rate);
    }

    // Convert the array of fields to a single string for the query
    const updateTaskQuery = `UPDATE task SET ${updateFields.join(', ')} WHERE Task_ID = ?`;
    values.push(Task_ID); // Add the task ID to the end of the values array

    // Create query for adding links
    let insertLinkQuery = '';
    let fileValues = [];
    if (files && files.length > 0) {
        insertLinkQuery = `
      INSERT INTO link (Task_ID, Name, Path, Type)
      VALUES ?;
    `;
        fileValues = files.map(file => [
            Task_ID,
            file.originalname,
            file.path,
            file.mimetype,
        ]);
    }

    // Begin transaction adn execute queries
    //try {
        //await db.beginTransaction();

        db.query(updateTaskQuery, values);

        if (insertLinkQuery && fileValues.length > 0) {
            db.query(insertLinkQuery, [fileValues]);
        }

        //await connection.commit();
        //res.status(200).json({ message: 'Task updated successfully.' });
    //} catch (err) {
        //await db.rollback();
        //res.status(500).json({ error: 'Failed to update task.' });
    //}
    
    // Execute the query
    /* db.query(updateTaskQuery, values, (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            // No rows were affected, so the task ID might not exist
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task updated successfully' });
    }); */
});

//Select tasks
router.get('/select-task', (req, res) => {
    const Task_Id = req.query.Task_ID;
    console.log(Task_Id);

    if (!Task_Id) 
        return res.status(400).json({ error: 'Task ID is required to select' });

    // Query to select a specific task by Task_Id
    // 
    // SELECT Title, Due_date, Descript FROM task WHERE Task_ID = ?;
    const selectTaskQuery = `
        SELECT Title, Due_date, Descript, Name, Path, Type 
        FROM task 
        INNER JOIN link 
        ON task.Task_ID = link.Task_ID 
        WHERE task.Task_ID = ?;
    `;
    const queryParams = [Task_Id];

    // Execute the query
    db.query(selectTaskQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching task(s):', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: Task_Id ? 'Task not found' : 'No tasks available' });
        }

        res.json(results);
    });
});

// Select non complete tasks
router.get('/select-current-tasks/', (req, res) => {
    const currentDate = new Date();
    let selectTaskQuery;
    let queryParams = [];

    selectTaskQuery = 'SELECT Task_ID, Title, Due_date FROM `task` WHERE Is_completed NOT LIKE 1 AND Is_deleted LIKE 0 AND Due_date >= ?';
    queryParams = [currentDate];

    db.query(selectTaskQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching task(s):', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: Task_Id ? 'Task not found' : 'No tasks available' });
        }

        res.json(results);
    });
});

// Select completed tasks
router.get('/select-completed-tasks/', (req, res) => {
    let selectTaskQuery;
    let queryParams = [];

    selectTaskQuery = 'SELECT Task_ID, Title, Due_date FROM `task` WHERE Is_completed LIKE 1';

    db.query(selectTaskQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching task(s):', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            // return res.status(404).json({ message: Task_Id ? 'Task not found' : 'No tasks available' });
            return res.status(404).json({ message: 'No tasks available' });
        }

        res.json(results);
    });
});

// Select failed tasks
router.get('/select-failed-tasks/', (req, res) => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    let selectTaskQuery;
    let queryParams = [];

    selectTaskQuery = 'SELECT Task_ID, Title, Due_date FROM `task` WHERE Is_completed NOT LIKE 1 AND Due_date < ?';
    queryParams = [currentDate];

    db.query(selectTaskQuery, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching task(s):', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
            // return res.status(404).json({ message: Task_Id ? 'Task not found' : 'No tasks available' });
            return res.status(404).json({ message: 'No tasks available' });
        }

        res.json(results);
    });
});

// Mark task as completed
router.put('/complete-task/', (req, res) => {
    const Task_Id = req.body.Task_ID;
    console.log(Task_Id);

    if (!Task_Id)
        return res.status(400).json({ error: 'Task ID is required to update' });

    const updateTaskQuery = 'UPDATE task SET Is_completed = 1 WHERE Task_ID = ?';

    db.query(updateTaskQuery, [Task_Id], (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task updated successfully' });
    });
});

//Deleting tasks
router.put('/delete-task', (req, res) => {
    const Task_Id = req.body.Task_ID;
    console.log(Task_Id);

    // Check required fields
    if (!Task_Id)
        return res.status(400).json({ error: 'Task_ID is required' });

    // SQL query
    const deleteTaskQuery =
        'UPDATE task SET Is_deleted = 1 WHERE Task_ID LIKE ?';

    db.query(deleteTaskQuery, [Task_Id], (err, result) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Task not found' });
            }
            res.json({ message: 'Task deleted successfully' });
        }
    );
});

module.exports = router;