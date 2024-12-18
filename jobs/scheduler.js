const cron = require('node-cron');
const express = require('express');
const dayjs = require('dayjs');
const db = require('../db_connect');

function updateDates() {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 1);
    const selectQuery = 'SELECT Task_ID, Due_date, Refresh_rate FROM task WHERE Refresh LIKE 1 AND Is_deleted LIKE 0 AND Due_date < ?';

    db.query(selectQuery, currentDate ,(err, results) => {
        if (err) {
            console.error('Error fetching dates:', err);
            return;
        }
        console.log('Fetched dates:', results);

        const updatedData = results.map(row => {
            const originalDate = dayjs(row.Due_date);
            const updatedDate = originalDate.add(row.Refresh_rate, 'day').format('YYYY-MM-DD');
            return { ID: row.Task_ID, updatedDate };
        });

        console.log('Updated data:', updatedData);

        updatedData.forEach(({ ID, updatedDate }) => {
            const updateQuery = 'UPDATE task SET Due_date = ?, Is_completed = 0 WHERE Task_ID = ?';

            db.query(updateQuery, [updatedDate, ID], (err) => {
                if (err) {
                    console.error(`Error updating date for ID ${ID}:`, err);
                } else {
                    console.log(`Date updated successfully for ID ${ID}`);
                }
            });
        });
    });
}

function startScheduledJobs() {
    updateDates();
    cron.schedule('0 0 * * *', () => {
        console.log('Running database query at midnight');
        updateDates();
    });

    console.log('Scheduled jobs initialized.');
}

module.exports = { startScheduledJobs };
