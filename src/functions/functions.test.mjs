import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { makeCompletionEntity } from '../../testFramework/completionEntityStub.mjs';
import { cost, cotAnswer } from './functions.js';

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
  it('extracts the answer (basic case)', () => {
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
