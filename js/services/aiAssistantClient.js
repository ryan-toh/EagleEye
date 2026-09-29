/**
 * Generic contract for an AI provider.
 *
 * Implementations return the assistant's answer as text. They own the
 * provider-specific URL, payload, response envelope, and authentication.
 */
export class AiClient {
  async isAvailable() {
    return true;
  }

  async answer(_question, _options = {}) {
    void _question;
    void _options;
    throw new Error('AiClient.answer must be implemented.');
  }
}

/** Adapter for EagleEye's existing decision-tree endpoint. */
export class EagleEyeBackendAiClient extends AiClient {
  constructor({
    baseUrl,
    defaultHeaders = {},
    fetchImpl = globalThis.fetch,
  } = {}) {
    super();
    this.baseUrl = (baseUrl || 'http://localhost:8000').replace(/\/$/, '');
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    this.fetchImpl =
      fetchImpl === globalThis.fetch
        ? globalThis.fetch.bind(globalThis)
        : fetchImpl;
  }

  async isAvailable() {
    try {
      const [healthResponse, aiStatusResponse] = await Promise.all([
        this.fetchImpl(`${this.baseUrl}/health`),
        this.fetchImpl(`${this.baseUrl}/ai/status`),
      ]);
      const [health, aiStatus] = await Promise.all([
        healthResponse.json().catch(() => ({})),
        aiStatusResponse.json().catch(() => ({})),
      ]);
      return (
        healthResponse.ok &&
        health.status === 'ok' &&
        aiStatusResponse.ok &&
        aiStatus.available === true
      );
    } catch {
      return false;
    }
  }

  async answer(question, { answer, headers = {} } = {}) {
    const response = await this.fetchImpl(
      `${this.baseUrl}/decision-trees/generate`,
      {
        method: 'POST',
        headers: { ...this.defaultHeaders, ...headers },
        body: JSON.stringify({ question, answer }),
      },
    );
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        payload.detail || 'The AI service could not generate a draft.',
      );
    }
    if (!payload.decision_tree) {
      throw new Error('The AI service returned an incomplete decision tree.');
    }

    return JSON.stringify(payload.decision_tree);
  }
}

const providerFactories = new Map();

export function registerAiProvider(name, factory) {
  if (!name || typeof factory !== 'function') {
    throw new Error('An AI provider needs a name and factory function.');
  }
  providerFactories.set(name, factory);
}

export function createAiClient({ provider } = {}) {
  const providerName = provider || 'backend';
  const factory = providerFactories.get(providerName);

  if (!factory) throw new Error(`Unknown AI provider: ${providerName}.`);
  return factory();
}

registerAiProvider('backend', () => new EagleEyeBackendAiClient());
