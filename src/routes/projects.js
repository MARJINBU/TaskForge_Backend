const express = require('express');
const { all, get, run } = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  res.json(all(`SELECT p.*, u.name AS owner_name,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS task_count
    FROM projects p LEFT JOIN users u ON u.id = p.owner_id ORDER BY p.id DESC`));
});
router.get('/:id', (req, res) => {
  const project = get(`SELECT p.*, u.name AS owner_name FROM projects p LEFT JOIN users u ON u.id = p.owner_id WHERE p.id = ?`, [Number(req.params.id)]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  project.members = all(`SELECT u.id, u.name, u.email, u.role FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?`, [project.id]);
  res.json(project);
});
router.post('/', (req, res) => {
  const { name, description = '', owner_id = null } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'Project name is required' });
  if (owner_id !== null && !get('SELECT id FROM users WHERE id = ?', [Number(owner_id)])) return res.status(400).json({ error: 'owner_id does not match an existing user' });
  const result = run('INSERT INTO projects (name, description, owner_id) VALUES (?, ?, ?)', [String(name).trim(), String(description), owner_id === null ? null : Number(owner_id)]);
  res.status(201).json(get('SELECT * FROM projects WHERE id = ?', [result.id]));
});
router.put('/:id', (req, res) => {
  const project = get('SELECT * FROM projects WHERE id = ?', [Number(req.params.id)]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  const name = req.body.name ?? project.name;
  const description = req.body.description ?? project.description;
  const ownerId = req.body.owner_id === undefined ? project.owner_id : (req.body.owner_id === null ? null : Number(req.body.owner_id));
  if (!String(name).trim()) return res.status(400).json({ error: 'Project name is required' });
  if (ownerId !== null && !get('SELECT id FROM users WHERE id = ?', [ownerId])) return res.status(400).json({ error: 'owner_id does not match an existing user' });
  run('UPDATE projects SET name = ?, description = ?, owner_id = ? WHERE id = ?', [String(name).trim(), String(description), ownerId, project.id]);
  res.json(get('SELECT * FROM projects WHERE id = ?', [project.id]));
});
router.post('/:id/members', (req, res) => {
  const projectId = Number(req.params.id);
  const userId = Number(req.body.user_id);
  if (!get('SELECT id FROM projects WHERE id = ?', [projectId])) return res.status(404).json({ error: 'Project not found' });
  if (!get('SELECT id FROM users WHERE id = ?', [userId])) return res.status(404).json({ error: 'User not found' });
  run('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)', [projectId, userId]);
  res.status(201).json(all('SELECT u.id, u.name, u.email, u.role FROM project_members pm JOIN users u ON u.id = pm.user_id WHERE pm.project_id = ?', [projectId]));
});
router.delete('/:id/members/:userId', (req, res) => {
  run('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [Number(req.params.id), Number(req.params.userId)]);
  res.json({ message: 'Project member removed if they were assigned' });
});
router.delete('/:id', (req, res) => {
  const project = get('SELECT id FROM projects WHERE id = ?', [Number(req.params.id)]);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  run('DELETE FROM projects WHERE id = ?', [project.id]);
  res.json({ message: 'Project and its tasks deleted successfully' });
});
module.exports = router;
