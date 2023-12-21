import assert from 'node:assert';
import { describe, it } from 'node:test';
import ConcurrencyLimitedFetch from './ConcurrencyLimitedFetch.mjs';

describe('ConcurrencyLimitedFetch', () => {
  it('fetches immediately when none are queued or pending', (t) => {
    t.mock.method(global, 'fetch', () => Promise.resolve());
    const fetcher = new ConcurrencyLimitedFetch();

    fetcher.fetch('', makeFetchOptions());

    assert.strictEqual(fetch.mock.callCount(), 1);
  });

  it('fetches immediately when none are queued and fewer than limit are pending', (t) => {
    t.mock.method(global, 'fetch', () => Promise.resolve());
    const fetcher = new ConcurrencyLimitedFetch();

    fetcher.fetch('', makeFetchOptions());
    fetcher.fetch('', makeFetchOptions());
    fetcher.fetch('', makeFetchOptions());

    assert.strictEqual(fetch.mock.callCount(), 3);
  });

  it('queues when more than limit are pending', (t) => {
    t.mock.method(global, 'fetch', () => Promise.resolve());
    const fetcher = new ConcurrencyLimitedFetch();

    for (let i = 0; i < 15; i++) {
      fetcher.fetch('', makeFetchOptions());
    }

    assert.strictEqual(fetch.mock.callCount(), 10);
  });

  it('fetches the next queued when a pending completes', async (t) => {
    t.mock.method(global, 'fetch', () => Promise.resolve());
    const fetcher = new ConcurrencyLimitedFetch();

    for (let i = 0; i < 15; i++) {
      fetcher.fetch('', makeFetchOptions());
    }

    await flushPromises();
    assert.strictEqual(fetch.mock.callCount(), 15);
  });

  it('does not fetch when a pending completes and there is none queued', async (t) => {
    t.mock.method(global, 'fetch', () => Promise.resolve());
    const fetcher = new ConcurrencyLimitedFetch();

    fetcher.fetch('', makeFetchOptions());

    await flushPromises();
    assert.strictEqual(fetch.mock.callCount(), 1);
  });

  it('does not fetch if signal was aborted while was in queue', async (t) => {
    t.mock.method(global, 'fetch', () => Promise.resolve());
    const fetcher = new ConcurrencyLimitedFetch();

    for (let i = 0; i < 10; i++) {
      fetcher.fetch('', makeFetchOptions());
    }

    const abortController = new AbortController();
    const aborted = fetcher.fetch('', makeFetchOptions({ abortController }));
    abortController.abort();

    await assert.rejects(aborted, 'AbortError: This operation was aborted');
    assert.strictEqual(fetch.mock.callCount(), 10);
  });
});

function makeFetchOptions({ abortController } = {}) {
  return {
    signal: (abortController ?? new AbortController()).signal,
  };
}

function flushPromises() {
  return new Promise(setImmediate);
}
