import crypto from 'node:crypto';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Pool } from 'pg';

const PORT = Number(process.env.PORT) || 8787;
const MAX_BODY_BYTES = 12 * 1024;
const MAX_LIST_SIZE = 50;
const SESSION_LIFETIME_SECONDS = 365 * 24 * 60 * 60;
const ORDER_RATE_LIMIT = 80;
const ORDER_RATE_WINDOW_MS = 5 * 60 * 1000;
const SESSION_RATE_LIMIT = 12;
const SESSION_RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_RATE_LIMIT_BUCKETS = 10_000;
const DEFAULT_ALLOWED_ORIGINS = [
  'https://nornttyy.github.io',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:8766',
  'http://127.0.0.1:8766',
];
const ORDER_CATALOG = Object.freeze({
  sushi: Object.freeze({
    tamago: 3,
    salmon: 4,
    shrimp: 5,
    tuna: 6,
    mackerel: 7,
    seabream: 10,
    eel: 14,
    uni: 12,
    roe: 10,
    'platter-salmon': 14,
    'platter-tuna': 20,
    'platter-shrimp': 17,
    'platter-mackerel': 23,
    'platter-seabream': 32,
    'platter-mixed': 20,
  }),
  drinks: Object.freeze({
    tea: 3,
    'yuzu-soda': 5,
    'strawberry-soda': 6,
  }),
});

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const requestWindows = new Map();

function text(value, maximumLength) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maximumLength);
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function originIsAllowed(request) {
  const origin = request.headers.origin;
  return !origin || allowedOrigins.has(origin);
}

function addCorsHeaders(request, response) {
  const origin = request.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
}

function sendJson(request, response, status, payload) {
  addCorsHeaders(request, response);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function getRequestIp(request) {
  const forwarded = text(request.headers['x-forwarded-for'], 300);
  const forwardedAddresses = forwarded.split(',').map((address) => address.trim()).filter(Boolean);
  // Render appends the client address when passing X-Forwarded-For through;
  // taking the final value avoids trusting a spoofed first value from a client.
  return forwardedAddresses.at(-1) || request.socket.remoteAddress || 'unknown';
}

function isRateLimited(scope, subject, limit, windowMs) {
  clearExpiredRateWindows();
  const key = `${scope}:${subject}`;
  const now = Date.now();
  const bucket = requestWindows.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    if (!bucket && requestWindows.size >= MAX_RATE_LIMIT_BUCKETS) {
      const oldestKey = requestWindows.keys().next().value;
      if (oldestKey) requestWindows.delete(oldestKey);
    }
    requestWindows.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

function clearExpiredRateWindows() {
  const expiry = Date.now() - Math.max(SESSION_RATE_WINDOW_MS, ORDER_RATE_WINDOW_MS);
  for (const [key, bucket] of requestWindows) {
    if (bucket.startedAt < expiry) requestWindows.delete(key);
  }
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function readAuthSecret() {
  const secret = text(process.env.AUTH_SECRET, 512);
  if (secret) return secret;
  if (isProduction()) throw new Error('AUTH_SECRET is required in production.');
  return 'seaside-sushi-leaderboard-development-secret';
}

const authSecret = readAuthSecret();

function sign(value) {
  return crypto.createHmac('sha256', authSecret).update(value).digest('base64url');
}

function createToken(playerId) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS;
  const payload = `${playerId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function readPlayerIdFromToken(request) {
  const header = text(request.headers.authorization, 4096);
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  const [playerId, expiresAtText, signature, ...extra] = token.split('.');
  if (extra.length || !/^[0-9a-f-]{36}$/i.test(playerId || '') || !/^\d{1,12}$/.test(expiresAtText || '')) return null;
  const expiresAt = Number(expiresAtText);
  const payload = `${playerId}.${expiresAtText}`;
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  if (!signature || !timingSafeEqual(signature, sign(payload))) return null;
  return playerId;
}

function createNickname() {
  return `海风店主 ${crypto.randomInt(1000, 10_000)}`;
}

function normalizeOrderEvent(body) {
  const eventId = text(body?.eventId, 96);
  const sourceItems = Array.isArray(body?.items) ? body.items : [];
  if (!/^[A-Za-z0-9._:-]{12,96}$/.test(eventId) || !sourceItems.length || sourceItems.length > 4) return null;

  const items = [];
  let revenue = 0;
  for (const item of sourceItems) {
    if (!item || typeof item !== 'object') return null;
    if (item.type === 'tea') {
      items.push({ type: 'drink', id: 'tea' });
      revenue += ORDER_CATALOG.drinks.tea;
      continue;
    }
    if (item.type === 'drink' && Object.hasOwn(ORDER_CATALOG.drinks, item.id)) {
      items.push({ type: 'drink', id: item.id });
      revenue += ORDER_CATALOG.drinks[item.id];
      continue;
    }
    if (item.type === 'sushi' && Object.hasOwn(ORDER_CATALOG.sushi, item.id)) {
      items.push({ type: 'sushi', id: item.id });
      revenue += ORDER_CATALOG.sushi[item.id];
      continue;
    }
    return null;
  }
  return { eventId, items, revenue };
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('请求内容过大。'), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!chunks.length) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('请求数据格式不正确。'), { status: 400 }));
      }
    });
    request.on('error', reject);
  });
}

function toPublicPlayer(row) {
  return {
    playerId: String(row.playerId),
    nickname: text(row.nickname, 24) || '海边店主',
    revenue: Math.max(0, Math.floor(Number(row.revenue) || 0)),
    rank: Math.max(1, Math.floor(Number(row.rank) || 1)),
  };
}

export class MemoryRepository {
  constructor() {
    this.players = new Map();
    this.events = new Set();
  }

  async initialize() {}

  async createPlayer(playerId, nickname) {
    const player = { playerId, nickname, revenue: 0, updatedAt: Date.now() };
    this.players.set(playerId, player);
    return player;
  }

  async hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  async recordOrder(playerId, event) {
    const player = this.players.get(playerId);
    if (!player) return null;
    const eventKey = `${playerId}:${event.eventId}`;
    const accepted = !this.events.has(eventKey);
    if (accepted) {
      this.events.add(eventKey);
      player.revenue += event.revenue;
      player.updatedAt = Date.now();
    }
    return { accepted, player: { ...player }, addedRevenue: accepted ? event.revenue : 0 };
  }

  async leaderboard(playerId) {
    const ranked = [...this.players.values()]
      .sort((left, right) => right.revenue - left.revenue || left.updatedAt - right.updatedAt || left.playerId.localeCompare(right.playerId))
      .map((player, index) => ({ ...player, rank: index + 1 }));
    return {
      entries: ranked.slice(0, MAX_LIST_SIZE).map(toPublicPlayer),
      me: toPublicPlayer(ranked.find((player) => player.playerId === playerId) ?? { playerId, nickname: '海边店主', revenue: 0, rank: ranked.length + 1 }),
    };
  }

  async close() {}
}

class PostgresRepository {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString, max: 6, idleTimeoutMillis: 20_000 });
  }

  async initialize() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS leaderboard_players (
        player_id UUID PRIMARY KEY,
        nickname VARCHAR(24) NOT NULL,
        revenue BIGINT NOT NULL DEFAULT 0 CHECK (revenue >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS leaderboard_order_events (
        player_id UUID NOT NULL REFERENCES leaderboard_players(player_id) ON DELETE CASCADE,
        event_id VARCHAR(96) NOT NULL,
        item_count SMALLINT NOT NULL CHECK (item_count BETWEEN 1 AND 4),
        revenue INTEGER NOT NULL CHECK (revenue BETWEEN 1 AND 30),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (player_id, event_id)
      );
      CREATE INDEX IF NOT EXISTS leaderboard_players_rank_idx
        ON leaderboard_players (revenue DESC, updated_at ASC);
    `);
  }

  async createPlayer(playerId, nickname) {
    const result = await this.pool.query(`
      INSERT INTO leaderboard_players (player_id, nickname)
      VALUES ($1, $2)
      RETURNING player_id AS "playerId", nickname, revenue, 1 AS rank
    `, [playerId, nickname]);
    return result.rows[0];
  }

  async hasPlayer(playerId) {
    const result = await this.pool.query('SELECT 1 FROM leaderboard_players WHERE player_id = $1', [playerId]);
    return result.rowCount > 0;
  }

  async recordOrder(playerId, event) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(`
        INSERT INTO leaderboard_order_events (player_id, event_id, item_count, revenue)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (player_id, event_id) DO NOTHING
        RETURNING revenue
      `, [playerId, event.eventId, event.items.length, event.revenue]);
      const accepted = inserted.rowCount > 0;
      const playerResult = await client.query(`
        UPDATE leaderboard_players
        SET revenue = revenue + $2, updated_at = NOW()
        WHERE player_id = $1 AND $3::boolean
        RETURNING player_id AS "playerId", nickname, revenue, 1 AS rank
      `, [playerId, event.revenue, accepted]);
      if (!accepted) {
        const current = await client.query(`
          SELECT player_id AS "playerId", nickname, revenue, 1 AS rank
          FROM leaderboard_players
          WHERE player_id = $1
        `, [playerId]);
        if (!current.rowCount) {
          await client.query('ROLLBACK');
          return null;
        }
        await client.query('COMMIT');
        return { accepted: false, player: current.rows[0], addedRevenue: 0 };
      }
      if (!playerResult.rowCount) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query('COMMIT');
      return { accepted: true, player: playerResult.rows[0], addedRevenue: event.revenue };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  async leaderboard(playerId) {
    const result = await this.pool.query(`
      WITH ranked AS (
        SELECT
          player_id AS "playerId",
          nickname,
          revenue,
          ROW_NUMBER() OVER (ORDER BY revenue DESC, updated_at ASC, player_id ASC) AS rank
        FROM leaderboard_players
      )
      SELECT "playerId", nickname, revenue, rank
      FROM ranked
      WHERE rank <= $1 OR "playerId" = $2
      ORDER BY rank ASC
    `, [MAX_LIST_SIZE, playerId]);
    const rows = result.rows.map(toPublicPlayer);
    const me = rows.find((player) => player.playerId === playerId);
    if (!me) return null;
    return {
      entries: rows.filter((player) => player.rank <= MAX_LIST_SIZE),
      me,
    };
  }

  async close() {
    await this.pool.end();
  }
}

function createRepository() {
  if (process.env.LEADERBOARD_MEMORY === '1') return new MemoryRepository();
  const connectionString = text(process.env.DATABASE_URL, 4_096);
  if (!connectionString) throw new Error('DATABASE_URL is required. Set LEADERBOARD_MEMORY=1 only for local tests.');
  return new PostgresRepository(connectionString);
}

export function createLeaderboardServer(repository) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const isApiRequest = url.pathname.startsWith('/v1/');

    if (request.method === 'OPTIONS') {
      if (!originIsAllowed(request)) {
        sendJson(request, response, 403, { error: '来源不被允许。' });
        return;
      }
      addCorsHeaders(request, response);
      response.writeHead(204);
      response.end();
      return;
    }

    if (isApiRequest && !originIsAllowed(request)) {
      sendJson(request, response, 403, { error: '来源不被允许。' });
      return;
    }

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        sendJson(request, response, 200, { ok: true, leaderboard: true });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/anonymous-sessions') {
        if (isRateLimited('session', getRequestIp(request), SESSION_RATE_LIMIT, SESSION_RATE_WINDOW_MS)) {
          sendJson(request, response, 429, { error: '创建店主身份过于频繁，请稍后再试。' });
          return;
        }
        await readJson(request);
        const playerId = crypto.randomUUID();
        const nickname = createNickname();
        await repository.createPlayer(playerId, nickname);
        sendJson(request, response, 201, { playerId, nickname, token: createToken(playerId) });
        return;
      }

      const playerId = readPlayerIdFromToken(request);
      if (!playerId) {
        sendJson(request, response, 401, { error: '店主身份已过期，请重新连接。' });
        return;
      }
      if (!(await repository.hasPlayer(playerId))) {
        sendJson(request, response, 401, { error: '店主身份不存在，请重新连接。' });
        return;
      }

      if (request.method === 'GET' && url.pathname === '/v1/leaderboard') {
        const leaderboard = await repository.leaderboard(playerId);
        if (!leaderboard) {
          sendJson(request, response, 404, { error: '找不到店主数据。' });
          return;
        }
        sendJson(request, response, 200, leaderboard);
        return;
      }

      if (request.method === 'POST' && url.pathname === '/v1/orders') {
        if (isRateLimited('order', playerId, ORDER_RATE_LIMIT, ORDER_RATE_WINDOW_MS)) {
          sendJson(request, response, 429, { error: '订单结算过于频繁，请稍后再试。' });
          return;
        }
        const event = normalizeOrderEvent(await readJson(request));
        if (!event) {
          sendJson(request, response, 400, { error: '订单数据不正确。' });
          return;
        }
        const recorded = await repository.recordOrder(playerId, event);
        if (!recorded) {
          sendJson(request, response, 401, { error: '店主身份不存在，请重新连接。' });
          return;
        }
        const leaderboard = await repository.leaderboard(playerId);
        sendJson(request, response, 200, {
          accepted: recorded.accepted,
          addedRevenue: recorded.addedRevenue,
          ...leaderboard,
        });
        return;
      }

      sendJson(request, response, 404, { error: '接口不存在。' });
    } catch (error) {
      const status = Number(error?.status) || 500;
      if (status >= 500) console.error(error);
      sendJson(request, response, status, { error: status >= 500 ? '排行榜服务暂时不可用。' : error.message || '请求失败。' });
    }
  });
}

export async function startServer() {
  const repository = createRepository();
  await repository.initialize();
  const server = createLeaderboardServer(repository);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Seaside Sushi leaderboard listening on ${PORT}`);
  });
  const stop = async () => {
    await new Promise((resolve) => server.close(resolve));
    await repository.close();
  };
  process.once('SIGINT', () => void stop().then(() => process.exit(0)));
  process.once('SIGTERM', () => void stop().then(() => process.exit(0)));
  return { server, repository };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (invokedPath && fileURLToPath(import.meta.url) === invokedPath) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
