import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import crypto from 'crypto';

// ====================================================================
// TYPES & CONSTANTS
// ====================================================================
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'operador' | 'gerente';
  active: number;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SystemLogItem {
  id: number;
  method: string;
  url: string;
  status_code: number;
  duration_ms: number;
  user_identifier: string;
  client_ip: string;
  timestamp: string;
}

const PASSWORD_SALT = 'arena_romano_salt_2026';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + PASSWORD_SALT).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'admin' | 'operador' | 'gerente';
  active: boolean | number;
  avatar_url?: string;
}

// Active session token store: token -> { user, expiresAt }
const activeSessions = new Map<string, { user: SafeUser; expiresAt: number }>();

// In-memory fallback users
const inMemoryUsers: UserRecord[] = [
  {
    id: 'usr_admin_001',
    name: 'Administrador',
    email: 'admin@arenaromano.com.br',
    username: 'admin',
    password_hash: hashPassword('teste123A'),
    role: 'admin',
    active: 1,
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'usr_operador_002',
    name: 'Operador',
    email: 'operador@arenaromano.com.br',
    username: 'operador',
    password_hash: hashPassword('teste123A'),
    role: 'operador',
    active: 1,
    avatar_url: null,
    created_at: new Date().toISOString(),
  }
];

// Circular buffer for recent server logs
const recentLogs: SystemLogItem[] = [];
let logCounter = 1;

function addLog(entry: Omit<SystemLogItem, 'id'>) {
  const item: SystemLogItem = {
    id: logCounter++,
    ...entry
  };
  recentLogs.unshift(item);
  if (recentLogs.length > 150) {
    recentLogs.pop();
  }
}

// ====================================================================
// MYSQL DATABASE CONNECTION
// ====================================================================
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

// ====================================================================
// DATABASE TABLES DEFINITIONS & INITIALIZATION
// ====================================================================
const TABLE_DEFINITIONS: { name: string; query: string }[] = [
  {
    name: 'users',
    query: `
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(150) NOT NULL,
        \`username\` VARCHAR(80) NOT NULL,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('admin', 'operador', 'gerente') NOT NULL DEFAULT 'admin',
        \`active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`avatar_url\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_users_email\` (\`email\`),
        UNIQUE KEY \`uk_users_username\` (\`username\`),
        INDEX \`idx_users_role\` (\`role\`),
        INDEX \`idx_users_active\` (\`active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'products',
    query: `
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`category\` ENUM('cervejas', 'bebidas', 'churrasco', 'porcoes', 'snacks', 'diversos') NOT NULL DEFAULT 'diversos',
        \`unit_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`price_tiers\` JSON NULL,
        \`description\` VARCHAR(255) NULL,
        \`icon\` VARCHAR(50) NOT NULL DEFAULT 'Package',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_products_category\` (\`category\`),
        INDEX \`idx_products_active\` (\`active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'court_schedules',
    query: `
      CREATE TABLE IF NOT EXISTS \`court_schedules\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`time\` VARCHAR(10) NOT NULL,
        \`duration_minutes\` INT NOT NULL DEFAULT 60,
        \`default_price\` DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
        \`is_blocked\` TINYINT(1) NOT NULL DEFAULT 0,
        \`label\` VARCHAR(100) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_schedule_time\` (\`time\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'games',
    query: `
      CREATE TABLE IF NOT EXISTS \`games\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`title\` VARCHAR(150) NOT NULL,
        \`date\` DATE NOT NULL,
        \`start_time\` VARCHAR(10) NOT NULL,
        \`end_time\` VARCHAR(10) NOT NULL,
        \`duration_minutes\` INT NOT NULL DEFAULT 60,
        \`court_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`status\` ENUM('agendado', 'em_andamento', 'finalizado') NOT NULL DEFAULT 'agendado',
        \`notes\` TEXT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_games_date\` (\`date\`),
        INDEX \`idx_games_status\` (\`status\`),
        INDEX \`idx_games_date_status\` (\`date\`, \`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'game_players',
    query: `
      CREATE TABLE IF NOT EXISTS \`game_players\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`game_id\` VARCHAR(64) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`raw_tag\` VARCHAR(50) NULL,
        \`is_present\` TINYINT(1) NOT NULL DEFAULT 0,
        \`is_paid\` TINYINT(1) NOT NULL DEFAULT 0,
        \`payment_method\` ENUM('pix', 'dinheiro', 'cartao') NULL,
        \`paid_at\` TIMESTAMP NULL DEFAULT NULL,
        \`total_consumption\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_players_game_id\` (\`game_id\`),
        INDEX \`idx_players_is_paid\` (\`is_paid\`),
        CONSTRAINT \`fk_players_game\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'consumptions',
    query: `
      CREATE TABLE IF NOT EXISTS \`consumptions\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`game_id\` VARCHAR(64) NOT NULL,
        \`player_id\` VARCHAR(64) NOT NULL,
        \`product_id\` VARCHAR(64) NULL,
        \`product_name\` VARCHAR(150) NOT NULL,
        \`quantity\` INT NOT NULL DEFAULT 1,
        \`unit_price\` DECIMAL(10, 2) NULL,
        \`calculated_total_price\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`applied_breakdown\` VARCHAR(255) NULL,
        \`time_formatted\` VARCHAR(10) NOT NULL,
        \`is_custom\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_consumptions_game\` (\`game_id\`),
        INDEX \`idx_consumptions_player\` (\`player_id\`),
        INDEX \`idx_consumptions_product\` (\`product_id\`),
        CONSTRAINT \`fk_consumptions_game\` FOREIGN KEY (\`game_id\`) REFERENCES \`games\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_consumptions_player\` FOREIGN KEY (\`player_id\`) REFERENCES \`game_players\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'daily_closings',
    query: `
      CREATE TABLE IF NOT EXISTS \`daily_closings\` (
        \`id\` VARCHAR(64) NOT NULL,
        \`date\` DATE NOT NULL,
        \`games_count\` INT NOT NULL DEFAULT 0,
        \`court_revenue\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`products_revenue\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`total_revenue\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`total_paid\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`total_pending\` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        \`summary_json\` JSON NULL,
        \`closed_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_closing_date\` (\`date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  },
  {
    name: 'system_logs',
    query: `
      CREATE TABLE IF NOT EXISTS \`system_logs\` (
        \`id\` INT AUTO_INCREMENT NOT NULL,
        \`method\` VARCHAR(10) NOT NULL,
        \`url\` VARCHAR(255) NOT NULL,
        \`status_code\` INT NOT NULL,
        \`duration_ms\` INT NOT NULL,
        \`user_identifier\` VARCHAR(100) NULL,
        \`client_ip\` VARCHAR(45) NULL,
        \`timestamp\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_logs_timestamp\` (\`timestamp\`),
        INDEX \`idx_logs_status\` (\`status_code\`),
        INDEX \`idx_logs_user\` (\`user_identifier\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  }
];

/**
 * Automatically verifies database tables on startup.
 * Creates missing tables and seeds default admin user if none exists.
 */
async function initDatabaseTables() {
  console.log('[ARENA ROMANO] 🔍 Verificando banco de dados MySQL e tabelas...');

  const db = getDbPool();
  if (!db) {
    console.log('[ARENA ROMANO] ℹ️ MySQL ainda não configurado no .env. Operando em modo de memória seguro com usuários padrão.');
    return {
      connected: false,
      message: 'MySQL não configurado. Usuários em memória inicializados (admin / operador).',
      tables: [],
    };
  }

  try {
    // 1. Check connection
    await db.query('SELECT 1');
    console.log('[ARENA ROMANO] 🟢 Conexão com o banco de dados MySQL estabelecida!');

    const verifiedTables: string[] = [];

    // 2. Iterate through table definitions and create if not exist
    for (const table of TABLE_DEFINITIONS) {
      try {
        await db.query(table.query);
        verifiedTables.push(table.name);
        console.log(`[ARENA ROMANO - DB] Tabela '${table.name}' verificada/criada com sucesso.`);
      } catch (tableErr: any) {
        console.error(`[ARENA ROMANO - DB] Erro ao verificar/criar tabela '${table.name}':`, tableErr.message);
      }
    }

    // 3. Migration: Insere ou atualiza os usuários 'admin' e 'operador' com a senha 'teste123A'
    try {
      const adminPass = hashPassword('teste123A');
      const opPass = hashPassword('teste123A');

      await db.query(
        `INSERT INTO \`users\` (id, name, email, username, password_hash, role, active)
         VALUES ('usr_admin_default', 'Administrador', 'admin@arenaromano.com.br', 'admin', ?, 'admin', 1)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', active = 1`,
        [adminPass]
      );

      await db.query(
        `INSERT INTO \`users\` (id, name, email, username, password_hash, role, active)
         VALUES ('usr_operador_default', 'Operador', 'operador@arenaromano.com.br', 'operador', ?, 'operador', 1)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'operador', active = 1`,
        [opPass]
      );

      console.log('[ARENA ROMANO - DB] ✅ Usuários admin e operador inseridos/atualizados com senha teste123A.');
    } catch (userSeedErr: any) {
      console.warn('[ARENA ROMANO - DB] Aviso ao verificar/atualizar usuários padrão:', userSeedErr.message);
    }

    return {
      connected: true,
      message: 'Todas as tabelas do MySQL foram verificadas e criadas com sucesso!',
      tables: verifiedTables,
    };
  } catch (err: any) {
    console.error('[ARENA ROMANO] ⚠️ Falha ao inicializar tabelas no MySQL:', err.message);
    return {
      connected: false,
      error: err.message,
      message: 'Não foi possível conectar ao MySQL no momento. Usuários em memória disponíveis.',
      tables: [],
    };
  }
}

// ====================================================================
// SERVER STARTUP & MIDDLEWARE PIPELINE
// ====================================================================
async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ------------------------------------------------------------------
  // 1. MIDDLEWARE: REQUEST LOGGER ("pro tudo ser logado")
  // Intercepta todas as requisições HTTP, mede tempo de resposta,
  // exibe no console e guarda histórico para auditoria
  // ------------------------------------------------------------------
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    
    // Listen to response finish to capture final status code & duration
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const status = res.statusCode;
      const user = (req as any).user ? (req as any).user.username : 'visitante';
      const timestamp = new Date().toISOString();
      const url = req.originalUrl || req.url;
      const method = req.method;

      // Console format
      const statusColor = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
      console.log(`[HTTP LOG ${statusColor}] ${method} ${url} | ${status} | ${duration}ms | User: ${user} | IP: ${clientIp}`);

      // Add to in-memory log buffer
      addLog({
        method,
        url,
        status_code: status,
        duration_ms: duration,
        user_identifier: user,
        client_ip: String(clientIp),
        timestamp,
      });

      // Asynchronously record into MySQL system_logs if pool is ready
      const db = getDbPool();
      if (db) {
        db.query(
          `INSERT INTO \`system_logs\` (method, url, status_code, duration_ms, user_identifier, client_ip)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [method, url.substring(0, 255), status, duration, user.substring(0, 100), String(clientIp).substring(0, 45)]
        ).catch(() => {
          // Ignore async log errors silently so application never breaks
        });
      }
    });

    next();
  });

  // ------------------------------------------------------------------
  // 2. MIDDLEWARE: AUTHENTICATION ("pro tudo ser logado / protegido")
  // Valida token de sessão via header Authorization: Bearer <token>
  // ------------------------------------------------------------------
  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : (req.headers['x-auth-token'] as string);

    if (token) {
      const session = activeSessions.get(token);
      if (session) {
        if (session.expiresAt > Date.now()) {
          (req as any).user = session.user;
          (req as any).token = token;
        } else {
          activeSessions.delete(token);
        }
      }
    }
    next();
  };

  // Enforce authentication on protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({
        ok: false,
        error: 'Acesso não autorizado. Por favor faça login para acessar esta funcionalidade.',
      });
    }
    next();
  };

  app.use(authMiddleware);

  // ==================================================================
  // API ROUTES
  // ==================================================================

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
      active_sessions: activeSessions.size,
      timestamp: new Date().toISOString(),
    });
  });

  // MySQL Connection & Tables Status API
  app.get('/api/db/status', async (req, res) => {
    try {
      const db = getDbPool();
      if (!db) {
        return res.json({
          connected: false,
          configured: false,
          message: 'MySQL ainda não configurado no .env. Operando em modo de memória local.',
          database: 'local_memory',
        });
      }

      const [rows] = await db.query('SELECT 1 as is_alive, NOW() as current_server_time');
      
      // Get tables list
      const [tableRows] = await db.query('SHOW TABLES') as any;
      const tables = tableRows.map((r: any) => Object.values(r)[0]);

      return res.json({
        connected: true,
        configured: true,
        message: 'Conexão com o banco MySQL ativa e funcionando!',
        database: process.env.MYSQL_DATABASE || 'arena_romano',
        tables,
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

  // Manual Trigger to re-check and create tables on demand
  app.post('/api/db/init', async (req, res) => {
    try {
      const result = await initDatabaseTables();
      res.json({
        ok: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err.message,
      });
    }
  });

  // ------------------------------------------------------------------
  // AUTHENTICATION ROUTES (LOGIN / CADASTRO / SESSÃO)
  // ------------------------------------------------------------------

  // POST /api/auth/login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail || !password) {
        return res.status(400).json({
          ok: false,
          error: 'Informe o usuário/e-mail e a senha.',
        });
      }

      let matchedUser: UserRecord | null = null;
      const db = getDbPool();

      // Check MySQL first if connected
      if (db) {
        try {
          const [rows] = await db.query(
            'SELECT * FROM `users` WHERE (`username` = ? OR `email` = ?) AND `active` = 1 LIMIT 1',
            [usernameOrEmail.trim(), usernameOrEmail.trim()]
          ) as any;

          if (rows && rows.length > 0) {
            matchedUser = rows[0] as UserRecord;
          }
        } catch (dbErr: any) {
          console.warn('[AUTH] Falha ao consultar MySQL, tentando usuários em memória:', dbErr.message);
        }
      }

      // Fallback to in-memory users if not found in DB
      if (!matchedUser) {
        const queryTerm = usernameOrEmail.trim().toLowerCase();
        matchedUser = inMemoryUsers.find(
          u => (u.username.toLowerCase() === queryTerm || u.email.toLowerCase() === queryTerm) && u.active === 1
        ) || null;
      }

      if (!matchedUser) {
        return res.status(401).json({
          ok: false,
          error: 'Usuário ou senha inválidos.',
        });
      }

      // Verify password
      const isValid = verifyPassword(password, matchedUser.password_hash);
      if (!isValid) {
        return res.status(401).json({
          ok: false,
          error: 'Usuário ou senha inválidos.',
        });
      }

      // Generate session token (valid for 7 days)
      const token = generateToken();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const safeUser = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        username: matchedUser.username,
        role: matchedUser.role,
        active: matchedUser.active === 1,
        avatar_url: matchedUser.avatar_url,
      };

      activeSessions.set(token, {
        user: safeUser,
        expiresAt,
      });

      return res.json({
        ok: true,
        message: 'Login realizado com sucesso!',
        token,
        user: safeUser,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Erro interno ao processar login.',
      });
    }
  });

  // POST /api/auth/register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, username, email, password, role = 'operador' } = req.body;

      if (!name || !username || !email || !password) {
        return res.status(400).json({
          ok: false,
          error: 'Preencha todos os campos obrigatórios (nome, usuário, e-mail e senha).',
        });
      }

      const cleanUsername = username.trim().toLowerCase();
      const cleanEmail = email.trim().toLowerCase();
      const passwordHash = hashPassword(password);
      const newId = 'usr_' + crypto.randomBytes(6).toString('hex');

      const db = getDbPool();

      if (db) {
        // Check uniqueness in MySQL
        const [existing] = await db.query(
          'SELECT id FROM `users` WHERE `username` = ? OR `email` = ?',
          [cleanUsername, cleanEmail]
        ) as any;

        if (existing && existing.length > 0) {
          return res.status(409).json({
            ok: false,
            error: 'Este nome de usuário ou e-mail já está cadastrado.',
          });
        }

        await db.query(
          `INSERT INTO \`users\` (id, name, email, username, password_hash, role, active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [newId, name.trim(), cleanEmail, cleanUsername, passwordHash, role]
        );
      }

      // Also register in memory list for instantaneous availability
      const newUserRecord: UserRecord = {
        id: newId,
        name: name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        password_hash: passwordHash,
        role: role as any,
        active: 1,
        created_at: new Date().toISOString(),
      };
      inMemoryUsers.push(newUserRecord);

      // Create session token
      const token = generateToken();
      const safeUser = {
        id: newId,
        name: name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        role: role as any,
        active: true,
      };

      activeSessions.set(token, {
        user: safeUser,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        ok: true,
        message: 'Usuário cadastrado com sucesso!',
        token,
        user: safeUser,
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err.message || 'Erro ao cadastrar usuário.',
      });
    }
  });

  // GET /api/auth/me (Get logged-in user profile)
  app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({
      ok: true,
      user: (req as any).user,
    });
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', (req, res) => {
    const token = (req as any).token;
    if (token) {
      activeSessions.delete(token);
    }
    res.json({
      ok: true,
      message: 'Sessão encerrada com sucesso.',
    });
  });

  // GET /api/auth/users (List all users - admin or operator)
  app.get('/api/auth/users', requireAuth, async (req, res) => {
    try {
      const db = getDbPool();
      if (db) {
        const [rows] = await db.query(
          'SELECT id, name, email, username, role, active, created_at FROM `users` ORDER BY created_at DESC'
        ) as any;
        return res.json({ ok: true, users: rows });
      }

      const usersList = inMemoryUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: u.role,
        active: u.active === 1,
        created_at: u.created_at,
      }));
      return res.json({ ok: true, users: usersList });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ------------------------------------------------------------------
  // SYSTEM LOGS AUDIT API (Recorded by logger middleware)
  // ------------------------------------------------------------------
  app.get('/api/logs', async (req, res) => {
    try {
      const db = getDbPool();
      if (db) {
        try {
          const [rows] = await db.query(
            'SELECT * FROM `system_logs` ORDER BY `timestamp` DESC LIMIT 100'
          ) as any;
          if (rows && rows.length > 0) {
            return res.json({ ok: true, logs: rows, source: 'mysql' });
          }
        } catch {
          // Fallback to memory
        }
      }

      return res.json({ ok: true, logs: recentLogs, source: 'memory' });
    } catch (err: any) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  });

  // ------------------------------------------------------------------
  // VITE DEV MIDDLEWARE & PRODUCTION STATIC ASSETS
  // ------------------------------------------------------------------
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

  // ------------------------------------------------------------------
  // START SERVER & RUN DATABASE TABLE VERIFICATION ON BOOT
  // ------------------------------------------------------------------
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`====================================================`);
    console.log(`🏟️  Arena Romano Server running on http://localhost:${PORT}`);
    console.log(`🛡️  Logger Middleware & Auth Middleware ativos`);
    console.log(`====================================================`);

    // Run table verification and creation on server startup!
    await initDatabaseTables();
  });
}

startServer();
