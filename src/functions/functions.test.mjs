import assert from 'node:assert';
import { describe, it, mock } from 'node:test';
import { makeCompletionEntity } from '../../testFramework/completionEntityStub.mjs';
import { cotAnswer } from './functions.js';

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
