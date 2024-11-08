// routes/taskRoute.js
const express = require('express');
const db = require('../db_connect'); // Import the database connection
const router = express.Router();

//Adding tasks
router.post('/add-task', (req, res) => {
    const { User_ID, Task_title, Task_desc, Task_due_date, Task_refresh, Task_refresh_rate } = req.query;

    // Check required fields
    if (!User_ID || !Task_title || !Task_due_date)
        return res.status(400).json({ error: 'User_ID, Task_title, and Task_due_date are required' });

    // Validation
    const dueDate = new Date(Task_due_date);
    if (isNaN(dueDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format for Task_due_date. Use YYYY-MM-DD.' });
    }

    // SQL query
    const insertTaskQuery = `
        INSERT INTO task (User_ID, Task_title, Task_desc, Task_due_date, Task_refresh, Task_refresh_rate)
        VALUES (?, ?, ?, ?, ?, ?);
    `;

    db.query(
        insertTaskQuery,
        [User_ID, Task_title, Task_desc, Task_due_date, Task_refresh || false, Task_refresh_rate || null],
        (err, result) => {
            if (err) {
                console.error('Error adding task:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Task added successfully', taskId: result.insertId });
        }
    );
});

//Deleting tasks
router.delete('/delete-task', (req, res) => {
    const { Task_ID } = req.query;

    // Check required fields
    if (!Task_ID)
        return res.status(400).json({ error: 'Task_ID is required' });

    // SQL query
    const deleteTaskQuery =
        'DELETE FROM task WHERE Task_ID LIKE ?;';
 
    db.query(
        deleteTaskQuery,
        [Task_ID],
        (err, result) => {
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

//Updating tasks
router.put('/update-task/', (req, res) => {
    //const { id } = req.params; // Get the task ID from the URL parameters
    const { Task_ID ,Task_title, Task_desc, Task_due_date, Task_refresh, Task_refresh_rate } = req.query;

    // Ensure at least one field to update is provided
    if (!Task_title && !Task_desc && !Task_due_date && Task_refresh === undefined && !Task_refresh_rate) {
        return res.status(400).json({ error: 'At least one field is required to update' });
    }

    // Build the dynamic SQL query based on provided fields
    let updateFields = [];
    let values = [];

    if (Task_title) {
        updateFields.push('Task_title = ?');
        values.push(Task_title);
    }
    if (Task_desc) {
        updateFields.push('Task_desc = ?');
        values.push(Task_desc);
    }
    if (Task_due_date) {
        updateFields.push('Task_due_date = ?');
        values.push(Task_due_date);
    }
    if (Task_refresh !== undefined) { // Check explicitly for undefined to allow setting false
        updateFields.push('Task_refresh = ?');
        values.push(Task_refresh);
    }
    if (Task_refresh_rate) {
        updateFields.push('Task_refresh_rate = ?');
        values.push(Task_refresh_rate);
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

//Select tasks
router.get('/select-task', (req, res) => {
    const { Task_Id } = req.query; // Get Task_Id from query parameters

    let selectTaskQuery;
    let queryParams = [];

    // Check if Task_Id is provided
    if (Task_Id) {
        // Query to select a specific task by Task_Id
        selectTaskQuery = 'SELECT * FROM task WHERE Task_Id = ?';
        queryParams = [Task_Id];
    } else {
        // Query to select all tasks
        selectTaskQuery = 'SELECT * FROM task';
    }

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

module.exports = router;