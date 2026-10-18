const express = require('express');
const { all, get, run } = require('../database');
const router = express.Router();
const statuses = ['todo', 'in_progress', 'completed'];
const priorities = ['low', 'medium', 'high'];
const taskSelect = `SELECT t.*, p.name AS project_name, u.name AS assignee_name FROM tasks t JOIN projects p ON p.id = t.project_id LEFT JOIN users u ON u.id = t.assigned_to`;

router.get('/', (req, res) => {
  const conditions = [];
  const params = [];
  if (req.query.project_id) { conditions.push('t.project_id = ?'); params.push(Number(req.query.project_id)); }
  if (req.query.assigned_to) { conditions.push('t.assigned_to = ?'); params.push(Number(req.query.assigned_to)); }
  if (req.query.status) { if (!statuses.includes(req.query.status)) return res.status(400).json({ error: 'Invalid status' }); conditions.push('t.status = ?'); params.push(req.query.status); }
  res.json(all(`${taskSelect} ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''} ORDER BY t.id DESC`, params));
});
router.get('/:id', (req, res) => {
  const task = get(`${taskSelect} WHERE t.id = ?`, [Number(req.params.id)]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});
router.post('/', (req, res) => {
  const { title, description = '', project_id, assigned_to = null, status = 'todo', priority = 'medium', due_date = null } = req.body || {};
  if (!title || !String(title).trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!Number.isInteger(Number(project_id)) || !get('SELECT id FROM projects WHERE id = ?', [Number(project_id)])) return res.status(400).json({ error: 'A valid project_id is required' });
  if (assigned_to !== null && !get('SELECT id FROM users WHERE id = ?', [Number(assigned_to)])) return res.status(400).json({ error: 'assigned_to does not match an existing user' });
  if (!statuses.includes(status)) return res.status(400).json({ error: 'status must be todo, in_progress or completed' });
  if (!priorities.includes(priority)) return res.status(400).json({ error: 'priority must be low, medium or high' });
  const result = run('INSERT INTO tasks (title, description, project_id, assigned_to, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)', [String(title).trim(), String(description), Number(project_id), assigned_to === null ? null : Number(assigned_to), status, priority, due_date || null]);
  res.status(201).json(get(`${taskSelect} WHERE t.id = ?`, [result.id]));
});
router.put('/:id', (req, res) => {
  const task = get('SELECT * FROM tasks WHERE id = ?', [Number(req.params.id)]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const value = (key, fallback) => req.body[key] === undefined ? fallback : req.body[key];
  const updated = { title: value('title', task.title), description: value('description', task.description), project_id: Number(value('project_id', task.project_id)), assigned_to: value('assigned_to', task.assigned_to), status: value('status', task.status), priority: value('priority', task.priority), due_date: value('due_date', task.due_date) };
  if (!String(updated.title).trim()) return res.status(400).json({ error: 'Task title is required' });
  if (!get('SELECT id FROM projects WHERE id = ?', [updated.project_id])) return res.status(400).json({ error: 'A valid project_id is required' });
  if (updated.assigned_to !== null && !get('SELECT id FROM users WHERE id = ?', [Number(updated.assigned_to)])) return res.status(400).json({ error: 'assigned_to does not match an existing user' });
  if (!statuses.includes(updated.status) || !priorities.includes(updated.priority)) return res.status(400).json({ error: 'Invalid status or priority' });
  run('UPDATE tasks SET title=?, description=?, project_id=?, assigned_to=?, status=?, priority=?, due_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [String(updated.title).trim(), String(updated.description), updated.project_id, updated.assigned_to === null ? null : Number(updated.assigned_to), updated.status, updated.priority, updated.due_date || null, task.id]);
  res.json(get(`${taskSelect} WHERE t.id = ?`, [task.id]));
});
router.patch('/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!statuses.includes(status)) return res.status(400).json({ error: 'status must be todo, in_progress or completed' });
  const task = get('SELECT id FROM tasks WHERE id = ?', [Number(req.params.id)]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  run('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, task.id]);
  res.json(get(`${taskSelect} WHERE t.id = ?`, [task.id]));
});
router.delete('/:id', (req, res) => {
  const task = get('SELECT id FROM tasks WHERE id = ?', [Number(req.params.id)]);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  run('DELETE FROM tasks WHERE id = ?', [task.id]);
  res.json({ message: 'Task deleted successfully' });
});
module.exports = router;
