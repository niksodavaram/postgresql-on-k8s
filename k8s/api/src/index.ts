import express from 'express';
import { Pool } from 'pg';
import client from 'prom-client';

// Initialize Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

// Custom metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
});

const dbQueryDurationSeconds = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
});

const activeConnections = new client.Gauge({
  name: 'api_active_connections',
  help: 'Number of active connections',
});

const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'devdb',
  user: process.env.PGUSER || 'devuser',
  password: process.env.PGPASSWORD || 'devpass'
});

// Middleware to track request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.path, res.statusCode.toString())
      .observe(duration / 1000); // Convert to seconds
  });
  next();
});

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database test endpoint
app.get('/db-test', async (req, res) => {
  const queryTimer = dbQueryDurationSeconds.startTimer({ query_type: 'timestamp' });
  try {
    const result = await pool.query('SELECT NOW()');
    queryTimer();
    res.json({ time: result.rows[0].now });
  } catch (error) {
    queryTimer();
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Get all tables
app.get('/api/tables', async (req, res) => {
  const queryTimer = dbQueryDurationSeconds.startTimer({ query_type: 'tables_list' });
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    queryTimer();
    res.json({ tables: result.rows });
  } catch (error) {
    queryTimer();
    res.status(500).json({ error: 'Failed to get tables' });
  }
});

// Get table statistics
app.get('/api/table-stats', async (req, res) => {
  const queryTimer = dbQueryDurationSeconds.startTimer({ query_type: 'table_stats' });
  try {
    const result = await pool.query(`
      SELECT 
        relname as table_name,
        n_live_tup as row_count,
        pg_size_pretty(pg_total_relation_size(C.oid)) as total_size
      FROM pg_class C
      LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
      WHERE nspname NOT IN ('pg_catalog', 'information_schema')
      AND C.relkind = 'r'
    `);
    queryTimer();
    res.json({ statistics: result.rows });
  } catch (error) {
    queryTimer();
    res.status(500).json({ error: 'Failed to get table statistics' });
  }
});

// Database connection pool statistics
app.get('/api/pool-stats', (req, res) => {
  res.json({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Update active connections metric
setInterval(() => {
  activeConnections.set(pool.totalCount);
}, 5000);

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});