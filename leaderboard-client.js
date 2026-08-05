(() => {
  const DEFAULT_API_BASE = 'https://seaside-sushi-leaderboard-nornttyy.onrender.com';
  const API_BASE = String(window.SEASIDE_SUSHI_LEADERBOARD_API || DEFAULT_API_BASE).replace(/\/+$/, '');
  const AUTH_KEY = 'seaside-sushi-shop.online-auth.v1';
  const ORDER_QUEUE_KEY = 'seaside-sushi-shop.online-order-queue.v1';
  const MAX_QUEUED_ORDERS = 160;
  const REQUEST_TIMEOUT_MS = 22_000;
  const SCOREABLE_SUSHI_IDS = new Set([
    'tamago',
    'salmon',
    'shrimp',
    'tuna',
    'mackerel',
    'seabream',
    'eel',
    'uni',
    'roe',
    'platter-salmon',
    'platter-tuna',
    'platter-shrimp',
    'platter-mackerel',
    'platter-seabream',
    'platter-mixed',
  ]);
  const SCOREABLE_DRINK_IDS = new Set(['tea', 'yuzu-soda', 'strawberry-soda']);
  let flushPromise = null;

  function readStoredJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStoredJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function readAuth() {
    const auth = readStoredJson(AUTH_KEY, null);
    if (!auth || typeof auth !== 'object') return null;
    if (typeof auth.token !== 'string' || typeof auth.playerId !== 'string') return null;
    return auth;
  }

  function clearAuth() {
    try {
      window.localStorage.removeItem(AUTH_KEY);
    } catch {
      // Private browsing can reject local storage operations.
    }
  }

  function readOrderQueue() {
    const queued = readStoredJson(ORDER_QUEUE_KEY, []);
    return Array.isArray(queued) ? queued.slice(0, MAX_QUEUED_ORDERS) : [];
  }

  function writeOrderQueue(queue) {
    writeStoredJson(ORDER_QUEUE_KEY, queue.slice(-MAX_QUEUED_ORDERS));
  }

  function createEventId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    const random = Math.random().toString(36).slice(2);
    return `order-${Date.now().toString(36)}-${random}`;
  }

  function normalizeOrderItems(orderItems) {
    if (!Array.isArray(orderItems)) return [];
    return orderItems
      .map((item) => {
        if (item?.type === 'tea') return { type: 'drink', id: 'tea' };
        if (item?.type === 'drink' && SCOREABLE_DRINK_IDS.has(item.id)) {
          return { type: 'drink', id: item.id };
        }
        if (item?.type === 'sushi' && SCOREABLE_SUSHI_IDS.has(item.id)) {
          return { type: 'sushi', id: item.id };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 4);
  }

  async function requestJson(path, { method = 'GET', token = '', body } = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await window.fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(payload.error || '排行榜服务暂时无法连接。');
        error.status = response.status;
        throw error;
      }
      return payload;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function createAnonymousSession() {
    const session = await requestJson('/v1/anonymous-sessions', { method: 'POST', body: {} });
    if (!session || typeof session.token !== 'string' || typeof session.playerId !== 'string') {
      throw new Error('排行榜服务返回的数据不完整。');
    }
    const auth = {
      token: session.token,
      playerId: session.playerId,
      nickname: typeof session.nickname === 'string' ? session.nickname : '海边店主',
    };
    writeStoredJson(AUTH_KEY, auth);
    return auth;
  }

  async function ensureAuth({ refresh = false } = {}) {
    if (refresh) clearAuth();
    return readAuth() ?? createAnonymousSession();
  }

  async function submitQueuedOrder(entry, auth) {
    return requestJson('/v1/orders', {
      method: 'POST',
      token: auth.token,
      body: { eventId: entry.eventId, items: entry.items },
    });
  }

  async function flushQueuedOrders() {
    if (flushPromise) return flushPromise;
    flushPromise = (async () => {
      let queue = readOrderQueue();
      if (!queue.length) return null;
      let auth = await ensureAuth();
      let latest = null;

      while (queue.length) {
        const entry = queue[0];
        try {
          latest = await submitQueuedOrder(entry, auth);
          queue.shift();
          writeOrderQueue(queue);
          window.dispatchEvent(new CustomEvent('seaside-sushi-leaderboard-update', { detail: latest }));
        } catch (error) {
          if (error?.status === 401) {
            auth = await ensureAuth({ refresh: true });
            try {
              latest = await submitQueuedOrder(entry, auth);
              queue.shift();
              writeOrderQueue(queue);
              window.dispatchEvent(new CustomEvent('seaside-sushi-leaderboard-update', { detail: latest }));
              continue;
            } catch (retryError) {
              error = retryError;
            }
          }
          if (error?.status >= 400 && error.status < 500) {
            queue.shift();
            writeOrderQueue(queue);
            continue;
          }
          throw error;
        }
      }
      return latest;
    })();

    try {
      return await flushPromise;
    } finally {
      flushPromise = null;
    }
  }

  function recordOrder(orderItems) {
    const items = normalizeOrderItems(orderItems);
    if (!items.length) return;
    const queue = readOrderQueue();
    queue.push({ eventId: createEventId(), items, createdAt: Date.now() });
    writeOrderQueue(queue);
    void flushQueuedOrders().catch(() => {});
  }

  async function getLeaderboard() {
    await flushQueuedOrders();
    let auth = await ensureAuth();
    try {
      return await requestJson('/v1/leaderboard', { token: auth.token });
    } catch (error) {
      if (error?.status !== 401) throw error;
      auth = await ensureAuth({ refresh: true });
      return requestJson('/v1/leaderboard', { token: auth.token });
    }
  }

  window.SeasideSushiLeaderboard = Object.freeze({
    apiBase: API_BASE,
    getLeaderboard,
    recordOrder,
    flushQueuedOrders,
  });

  window.addEventListener('online', () => {
    void flushQueuedOrders().catch(() => {});
  });
  window.setTimeout(() => {
    void flushQueuedOrders().catch(() => {});
  }, 0);
})();
