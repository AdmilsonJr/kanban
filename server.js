require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const loggerMiddleware = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(loggerMiddleware);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auto-initialize data files if they don't exist
async function initDataFiles() {
  const dataDir = path.join(__dirname, 'data');
  const usersFile = path.join(dataDir, 'users.json');
  const tasksFile = path.join(dataDir, 'tasks.json');

  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }

  const initFile = async (filePath) => {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, '[]', 'utf8');
    }
  };

  await Promise.all([initFile(usersFile), initFile(tasksFile)]);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);

// Error Handling middleware must be last
app.use(errorHandler);

// Start Server
initDataFiles().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize data files:', err);
});
