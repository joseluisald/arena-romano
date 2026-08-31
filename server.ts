import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

function getDbPool() {
  if (pool) return pool;

  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const database = process.env.MYSQL_DATABASE;
  const password = process.env.MYSQL_PASSWORD || '';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && !databaseUrl.includes('senha@localhost')) {
    pool = mysql.createPool(databaseUrl);
    return pool;
  }

  if (host && user && database) {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });
    return pool;
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check API
  app.get('/api/health', (req, res) => {
    const isDbConfigured = Boolean(
      (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE) ||
      (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('senha@localhost'))
    );

    res.json({
      status: 'ok',
      name: 'Arena Romano Backend API',
      mysql_configured: isDbConfigured,
      timestamp: new Date().toISOString(),
    });
  });

  // MySQL Connection Status / Ping API
  app.get('/api/db/status', async (req, res) => {
    try {
      const db = getDbPool();
      if (!db) {
        return res.json({
          connected: false,
          message: 'MySQL ainda não configurado no .env. Preencha MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD e MYSQL_DATABASE.',
          configured: false,
        });
      }

      const [rows] = await db.query('SELECT 1 as is_alive, NOW() as current_server_time');
      return res.json({
        connected: true,
        configured: true,
        message: 'Conexão com o banco MySQL estabelecida com sucesso!',
        database: process.env.MYSQL_DATABASE || 'default',
        result: rows,
      });
    } catch (error: any) {
      return res.status(500).json({
        connected: false,
        configured: true,
        error: error.message || 'Erro ao conectar ao banco MySQL',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arena Romano server running on http://localhost:${PORT}`);
  });
}

startServer();

