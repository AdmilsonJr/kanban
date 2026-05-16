const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { readJSON, writeJSON } = require('../utils/fileStorage');

const usersFile = path.join(__dirname, '../data/users.json');

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const users = await readJSON(usersFile);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = {
      id: uuidv4(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await writeJSON(usersFile, users);

    const token = jwt.sign(
      { userId: newUser.id, name: newUser.name, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ data: { token, user: { id: newUser.id, name: newUser.name, email: newUser.email } } });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }

    const users = await readJSON(usersFile);
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email } } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
