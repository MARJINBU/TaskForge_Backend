const express = require('express');
const { all, get, run } = require('../database');
const router = express.Router();

router.get('/', (req, res) => res.json(all('SELECT * FROM users ORDER BY id DESC')));
router.get('/:id', (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', [Number(req.params.id)]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
router.post('/', (req, res) => {
  const { name, email, role = 'member' } = req.body || {};
  if (!name || !String(name).trim() || !email || !String(email).trim()) return res.status(400).json({ error: 'name and email are required' });
  if (!['admin', 'member'].includes(role)) return res.status(400).json({ error: 'role must be admin or member' });
  try {
    const result = run('INSERT INTO users (name, email, role) VALUES (?, ?, ?)', [String(name).trim(), String(email).trim().toLowerCase(), role]);
    res.status(201).json(get('SELECT * FROM users WHERE id = ?', [result.id]));
  } catch (err) {
    if (/UNIQUE/i.test(err.message)) return res.status(409).json({ error: 'A user with this email already exists' });
    throw err;
  }
});
router.put('/:id', (req, res) => {
  const existing = get('SELECT * FROM users WHERE id = ?', [Number(req.params.id)]);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const name = req.body.name ?? existing.name;
  const email = req.body.email ?? existing.email;
  const role = req.body.role ?? existing.role;
  if (!String(name).trim() || !String(email).trim() || !['admin', 'member'].includes(role)) return res.status(400).json({ error: 'Valid name, email and role are required' });
  try {
    run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [String(name).trim(), String(email).trim().toLowerCase(), role, existing.id]);
    res.json(get('SELECT * FROM users WHERE id = ?', [existing.id]));
  } catch (err) {
    if (/UNIQUE/i.test(err.message)) return res.status(409).json({ error: 'A user with this email already exists' });
    throw err;
  }
});
router.delete('/:id', (req, res) => {
  const existing = get('SELECT id FROM users WHERE id = ?', [Number(req.params.id)]);
  if (!existing) return res.status(404).json({ error: 'User not found' });
  run('DELETE FROM users WHERE id = ?', [existing.id]);
  res.json({ message: 'User deleted successfully' });
});
module.exports = router;
