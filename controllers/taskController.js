const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileStorage');

const tasksFile = path.join(__dirname, '../data/tasks.json');

async function getTasks(req, res, next) {
  try {
    const tasks = await readJSON(tasksFile);
    const userTasks = tasks.filter(t => t.userId === req.user.userId);
    res.json({ data: userTasks });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description, status, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'O título da tarefa é obrigatório' });
    }

    const tasks = await readJSON(tasksFile);
    const newTask = {
      id: uuidv4(),
      userId: req.user.userId,
      title,
      description: description || '',
      status: status || 'todo',
      completed: false,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    tasks.push(newTask);
    await writeJSON(tasksFile, tasks);

    res.json({ data: newTask });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const tasks = await readJSON(tasksFile);
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    if (tasks[taskIndex].userId !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const allowedFields = ['title', 'description', 'dueDate'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        tasks[taskIndex][field] = updates[field];
      }
    });

    await writeJSON(tasksFile, tasks);
    res.json({ data: tasks[taskIndex] });
  } catch (err) {
    next(err);
  }
}

async function toggleComplete(req, res, next) {
  try {
    const { id } = req.params;
    const { completed } = req.body;
    
    if (completed === undefined) {
      return res.status(400).json({ error: 'O campo completed é obrigatório' });
    }

    const tasks = await readJSON(tasksFile);
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    if (tasks[taskIndex].userId !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    tasks[taskIndex].completed = completed;
    tasks[taskIndex].completedAt = completed ? new Date().toISOString() : null;

    await writeJSON(tasksFile, tasks);
    res.json({ data: tasks[taskIndex] });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['todo', 'doing', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const tasks = await readJSON(tasksFile);
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    if (tasks[taskIndex].userId !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    tasks[taskIndex].status = status;

    await writeJSON(tasksFile, tasks);
    res.json({ data: tasks[taskIndex] });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    
    const tasks = await readJSON(tasksFile);
    const taskIndex = tasks.findIndex(t => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    
    if (tasks[taskIndex].userId !== req.user.userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    tasks.splice(taskIndex, 1);
    await writeJSON(tasksFile, tasks);
    
    res.json({ data: { success: true } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTasks,
  createTask,
  updateTask,
  toggleComplete,
  updateStatus,
  deleteTask
};
