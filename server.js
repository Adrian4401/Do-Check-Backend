// server.js
const express = require('express');
const dotenv = require('dotenv');
const taskRoutes = require('./routes/taskRoute');
const linkRoutes = require('./routes/linkRoute');
const dbRoutes = require('./routes/databaseRoute');

dotenv.config();

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Use the task routes
app.use('/task', taskRoutes);
app.use('/link', linkRoutes);
app.use('/database', dbRoutes);
app.use('/uploads', express.static('uploads'));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});