import assert from 'node:assert';
import { describe, it } from 'node:test';
import { makeCompletionEntity } from '../../testFramework/completionEntityStub.mjs';
import { chatComplete, cost, cotAnswer } from './functions.js';
import { makeCompletionResponse } from '../../testFramework/completionResponseStub.mjs';

describe('CHAT_COMPLETE', () => {
  it('makes a completion for given messages', async (t) => {
    const mockResponseBody = makeCompletionResponse({ content: 'Hello' });
    t.mock.method(global, 'fetch', () => mockResponseOk(mockResponseBody));

    const completion = await chatComplete(
      [['user', 'Say hello']],
      [['API_KEY', 'someapikey']],
    );

    const requestBody = JSON.parse(fetch.mock.calls[0].arguments[1].body);
    assert.deepStrictEqual(requestBody.messages, [
      { role: 'user', content: 'Say hello' },
    ]);

    assert.strictEqual(completion.text, 'Hello');
  });

  it('assembles messages structure for a single-cell prompt', async (t) => {
    t.mock.method(global, 'fetch', () =>
      mockResponseOk(makeCompletionResponse()),
    );

    await chatComplete([['Say hello']], [['API_KEY', 'someapikey']]);

    const requestBody = JSON.parse(fetch.mock.calls[0].arguments[1].body);
    assert.deepStrictEqual(requestBody.messages[1], {
      role: 'user',
      content: 'Say hello',
    });
  });

  it('does not propagate empty cells in the messages range to the API', async (t) => {
    t.mock.method(global, 'fetch', () =>
      mockResponseOk(makeCompletionResponse()),
    );

    await chatComplete(
      [
        ['user', 'Say hello'],
        [0, 0],
      ],
      [['API_KEY', 'someapikey']],
    );

    const requestBody = JSON.parse(fetch.mock.calls[0].arguments[1].body);
    assert.strictEqual(requestBody.messages.length, 1);
  });

  it('propagates only the user parameters to the API in the body', async (t) => {
    t.mock.method(global, 'fetch', () =>
      mockResponseOk(makeCompletionResponse()),
    );

    await chatComplete(
      [['Say hello']],
      [
        ['API_KEY', 'someapikey'],
        ['temperature', 0.3],
      ],
    );

    const requestBody = JSON.parse(fetch.mock.calls[0].arguments[1].body);
    assert.strictEqual(requestBody.temperature, 0.3);
    assert(!('API_KEY' in requestBody));
  });

  it('does not propagate empty cells in the params range to the API', async (t) => {
    const mockResponseBody = {
      id: 'chatcmpl-8X6b8XW77Md4oc06Yd3tc18lFzqT9',
      object: 'chat.completion',
      created: 0,
      model: 'gpt-3.5-turbo-0613',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Hello' },
          logprobs: null,
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 78, completion_tokens: 23, total_tokens: 101 },
      system_fingerprint: null,
    };
    t.mock.method(global, 'fetch', () => mockResponseOk(mockResponseBody));

    await chatComplete(
      [['user', 'Say hello']],
      [
        ['API_KEY', 'someapikey'],
        [0, 0],
      ],
    );

    const requestBody = JSON.parse(fetch.mock.calls[0].arguments[1].body);
    assert(!('0' in requestBody));
  });

  it('throws an error when no API key is provided - key absent', () => {
    assert.rejects(() => chatComplete([['Say hello']], []), {
      code: '#VALUE!',
      message: 'API_KEY is required',
    });
  });

  it('throws an error when no API key is provided - value cell empty', () => {
    assert.rejects(() => chatComplete([['Say hello']], [['API_KEY', 0]]), {
      code: '#VALUE!',
      message: 'API_KEY is required',
    });
  });

  it('throws an error for an API error with a provided message', (t) => {
    const errorResponseBody = {
      error: {
        message: "0 is less than the minimum of 1 - 'n'",
        type: 'invalid_request_error',
        param: null,
        code: null,
      },
    };
    t.mock.method(
      global,
      'fetch',
      async () =>
        new Response(JSON.stringify(errorResponseBody), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
    );

    assert.rejects(
      () => chatComplete([['Say hello']], [['API_KEY', 'someapikey']]),
      {
        code: '#N/A',
        message: "API error: 0 is less than the minimum of 1 - 'n'",
      },
    );
  });

  it('throws an error for an API error not providing a message', (t) => {
    const errorResponseBody = {
      error: {
        message: "0 is less than the minimum of 1 - 'n'",
        type: 'invalid_request_error',
        param: null,
        code: null,
      },
    };
    t.mock.method(
      global,
      'fetch',
      async () =>
        new Response('', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'text/plain' },
        }),
    );

    assert.rejects(
      () => chatComplete([['Say hello']], [['API_KEY', 'someapikey']]),
      {
        code: '#N/A',
        message: 'API error: 502 Bad Gateway',
      },
    );
  });
});

describe('COST', () => {
  it('calculates the cost of a single completion', () => {
    const completion = makeCompletionEntity({
      modelUsed: 'gpt-4-0613',
      tokensPrompt: 2000,
      tokensCompletion: 3000,
    });
    const prices = [['gpt-4-0613', 0.03, 0.06]];

    assert.strictEqual(cost([[completion]], prices), 0.24);
  });

  it('calculates the cost for a range of completions including empty cells', () => {
    const completion = makeCompletionEntity({
      modelUsed: 'gpt-4-0613',
      tokensPrompt: 1000,
      tokensCompletion: 1000,
    });
    const completions = [
      [completion, completion],
      [completion, 0],
      [0, 0],
    ];
    const prices = [['gpt-4-0613', 0.03, 0.06]];

    assert.strictEqual(cost(completions, prices), 0.27);
  });

  it('throws an error when no prices are specified for the model used', () => {
    const completion = makeCompletionEntity({
      modelUsed: 'gpt-3.5-turbo-1106',
    });
    const prices = [['gpt-4-0613', 0.03, 0.06]];

    assert.throws(() => cost([[completion]], prices), {
      code: '#VALUE!',
      message: 'No prices specified for model gpt-3.5-turbo-1106',
    });
  });
});

describe('COT_ANSWER', () => {
  it('extracts the answer', () => {
    const completion = makeCompletionEntity({
      content:
        'The color of the door has been explicitly stated in the provided statement.\n\n<!-- END CoT -->\nBlue',
    });

    assert.strictEqual(cotAnswer(completion, null), 'Blue');
  });

  it('uses a custom separator when given', () => {
    const completion = makeCompletionEntity({
      content:
        'The color of the door has been explicitly stated in the provided statement.\n\n*** BEGIN ANSWER ***\nBlue',
    });

    assert.strictEqual(cotAnswer(completion, '*** BEGIN ANSWER ***'), 'Blue');
  });

  it('throws an error when the separator is not found', () => {
    const completion = makeCompletionEntity({ content: 'Blue' });

    assert.throws(() => cotAnswer(completion), {
      code: '#VALUE!',
      message: 'Completion does not split into two by the separator',
    });
  });

  it('extracts the answer intact when it immediately follows the separator', () => {
    const completion = makeCompletionEntity({
      content:
        'The color of the door has been explicitly stated in the provided statement.\n\n<!-- END CoT -->Blue',
    });

    assert.strictEqual(cotAnswer(completion, null), 'Blue');
  });
});

async function mockResponseOk(body) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
