require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');
const usersRouter = require('./routes/users');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => res.json({
  name: 'TaskForge API', version: '1.0.0', status: 'running',
  endpoints: ['/api/health', '/api/users', '/api/projects', '/api/tasks']
}));
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'connected' }));
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
initDatabase().then(() => {
  app.listen(port, () => console.log(`TaskForge API running at http://localhost:${port}`));
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
