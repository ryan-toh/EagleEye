import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createAiClient,
  EagleEyeBackendAiClient,
  registerAiProvider,
} from '../js/services/aiAssistantClient.js';

test('existing backend adapter satisfies the generic answer contract', async () => {
  const expectedTree = { topic: { name: 'Claims' } };
  const client = new EagleEyeBackendAiClient({
    baseUrl: 'https://api.example.test/',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({ decision_tree: expectedTree }),
    }),
  });

  assert.deepEqual(
    JSON.parse(
      await client.answer('Can I claim?', { answer: 'Check policy.' }),
    ),
    expectedTree,
  );
});

test('backend availability requires a healthy backend and an enabled AI service', async () => {
  const responses = [
    { ok: true, json: async () => ({ status: 'ok' }) },
    { ok: true, json: async () => ({ available: true }) },
  ];
  const client = new EagleEyeBackendAiClient({
    fetchImpl: async () => responses.shift(),
  });

  assert.equal(await client.isAvailable(), true);

  const unhealthyClient = new EagleEyeBackendAiClient({
    fetchImpl: async (url) =>
      url.endsWith('/health')
        ? { ok: true, json: async () => ({ status: 'unhealthy' }) }
        : { ok: true, json: async () => ({ available: true }) },
  });
  assert.equal(await unhealthyClient.isAvailable(), false);
});

test('provider registry lets a different implementation satisfy the same contract', async () => {
  registerAiProvider('test-provider', () => ({
    answer: async () => 'Test answer',
  }));

  const client = createAiClient({ provider: 'test-provider' });
  assert.equal(await client.answer('Question'), 'Test answer');
});
