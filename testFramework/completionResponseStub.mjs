export function makeCompletionResponse({ content } = {}) {
  return {
    id: 'chatcmpl-00000000000000000000000000000',
    object: 'chat.completion',
    created: 0,
    model: 'gpt-0-0000',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: content ?? '',
        },
        logprobs: null,
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: -1, completion_tokens: -1, total_tokens: -1 },
    system_fingerprint: null,
  };
}
