const bcrypt = require('bcrypt');
const DataService = require('../services/dataService');
const config = require('../config');

const usersService = new DataService(config.paths.usersFile);

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const users = usersService.findAll();
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    res.json({ success: true, username: user.username });
  } catch (error) {
    next(error);
  }
}

function logout(req, res) {
  req.session.destroy();
  res.json({ success: true });
}

function getStatus(req, res) {
  if (req.session && req.session.userId) {
    res.json({ authenticated: true, username: req.session.username });
  } else {
    res.json({ authenticated: false });
  }
}

module.exports = {
  login,
  logout,
  getStatus
};



