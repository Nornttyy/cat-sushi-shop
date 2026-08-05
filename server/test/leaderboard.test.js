import assert from 'node:assert/strict';
import test from 'node:test';

import { MemoryRepository, createLeaderboardServer } from '../index.js';

async function startTestServer() {
  const repository = new MemoryRepository();
  await repository.initialize();
  const server = createLeaderboardServer(repository);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return {
    baseUrl,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      await repository.close();
    },
  };
}

async function json(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    response,
    body: await response.json(),
  };
}

test('the API creates players, records each order once, and returns shared ranks', async (context) => {
  const app = await startTestServer();
  context.after(app.close);
  const origin = 'http://localhost:4173';

  const firstSession = await json(app.baseUrl, '/v1/anonymous-sessions', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(firstSession.response.status, 201);
  assert.match(firstSession.body.playerId, /^[0-9a-f-]{36}$/i);
  assert.match(firstSession.body.token, /^.+\..+\..+$/);
  assert.equal(firstSession.response.headers.get('access-control-allow-origin'), origin);

  const firstToken = firstSession.body.token;
  const missingAuth = await json(app.baseUrl, '/v1/leaderboard');
  assert.equal(missingAuth.response.status, 401);

  const firstOrder = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers: {
      Origin: origin,
      Authorization: `Bearer ${firstToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventId: 'order-event-0001',
      items: [{ type: 'sushi', id: 'tamago' }, { type: 'tea' }],
    }),
  });
  assert.equal(firstOrder.response.status, 200);
  assert.equal(firstOrder.body.accepted, true);
  assert.equal(firstOrder.body.addedRevenue, 6);
  assert.equal(firstOrder.body.me.revenue, 6);
  assert.equal(firstOrder.body.me.rank, 1);

  const duplicate = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${firstToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: 'order-event-0001',
      items: [{ type: 'sushi', id: 'tamago' }, { type: 'tea' }],
    }),
  });
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.body.accepted, false);
  assert.equal(duplicate.body.addedRevenue, 0);
  assert.equal(duplicate.body.me.revenue, 6);

  const secondSession = await json(app.baseUrl, '/v1/anonymous-sessions', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const secondToken = secondSession.body.token;
  const secondOrder = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secondToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: 'order-event-0002',
      items: Array.from({ length: 4 }, () => ({ type: 'sushi', id: 'tuna' })),
    }),
  });
  assert.equal(secondOrder.response.status, 200);
  assert.equal(secondOrder.body.me.revenue, 24);
  assert.equal(secondOrder.body.me.rank, 1);

  const firstLeaderboard = await json(app.baseUrl, '/v1/leaderboard', {
    headers: { Authorization: `Bearer ${firstToken}` },
  });
  assert.equal(firstLeaderboard.response.status, 200);
  assert.equal(firstLeaderboard.body.me.revenue, 6);
  assert.equal(firstLeaderboard.body.me.rank, 2);
  assert.equal(firstLeaderboard.body.entries.length, 2);
});

test('the API accepts and scores every new gunkan and sashimi platter order', async (context) => {
  const app = await startTestServer();
  context.after(app.close);

  const session = await json(app.baseUrl, '/v1/anonymous-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const headers = {
    Authorization: `Bearer ${session.body.token}`,
    'Content-Type': 'application/json',
  };

  const gunkanAndFirstPlatters = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      eventId: 'order-event-new-dishes-01',
      items: [
        { type: 'sushi', id: 'uni' },
        { type: 'sushi', id: 'roe' },
        { type: 'sushi', id: 'platter-salmon' },
        { type: 'sushi', id: 'platter-tuna' },
      ],
    }),
  });
  assert.equal(gunkanAndFirstPlatters.response.status, 200);
  assert.equal(gunkanAndFirstPlatters.body.accepted, true);
  assert.equal(gunkanAndFirstPlatters.body.addedRevenue, 56);

  const remainingPlatters = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      eventId: 'order-event-new-dishes-02',
      items: [
        { type: 'sushi', id: 'platter-shrimp' },
        { type: 'sushi', id: 'platter-mackerel' },
        { type: 'sushi', id: 'platter-seabream' },
        { type: 'sushi', id: 'platter-mixed' },
      ],
    }),
  });
  assert.equal(remainingPlatters.response.status, 200);
  assert.equal(remainingPlatters.body.accepted, true);
  assert.equal(remainingPlatters.body.addedRevenue, 92);
  assert.equal(remainingPlatters.body.me.revenue, 148);
});

test('the API scores each drink recipe independently and keeps old tea orders compatible', async (context) => {
  const app = await startTestServer();
  context.after(app.close);

  const session = await json(app.baseUrl, '/v1/anonymous-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  const headers = {
    Authorization: `Bearer ${session.body.token}`,
    'Content-Type': 'application/json',
  };

  const drinks = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      eventId: 'order-event-drinks-001',
      items: [
        { type: 'tea' },
        { type: 'drink', id: 'yuzu-soda' },
        { type: 'drink', id: 'strawberry-soda' },
      ],
    }),
  });
  assert.equal(drinks.response.status, 200);
  assert.equal(drinks.body.accepted, true);
  assert.equal(drinks.body.addedRevenue, 14);

  const invalidDrink = await json(app.baseUrl, '/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      eventId: 'order-event-drinks-002',
      items: [{ type: 'drink', id: 'not-a-real-drink' }],
    }),
  });
  assert.equal(invalidDrink.response.status, 400);
});
