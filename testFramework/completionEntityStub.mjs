export function makeCompletionEntity({
  content,
  modelUsed,
  tokensPrompt,
  tokensCompletion,
} = {}) {
  return {
    type: 'Entity',
    basicType: 'Error',
    basicValue: '#VALUE!',
    text: content ?? '',
    properties: {
      _entityKind: {
        type: 'String',
        basicType: 'String',
        basicValue: 'openai-excel-functions:chat-completion',
      },
      lines: (content ?? '').split('\n'),
      requestBody: {
        type: 'Entity',
        basicType: 'Error',
        basicValue: '#VALUE!',
        text: 'Entity...',
        properties: {
          messages: {
            type: 'Array',
            basicType: 'Error',
            basicValue: '#VALUE!',
            elements: [
              [
                {
                  type: 'Entity',
                  basicType: 'Error',
                  basicValue: '#VALUE!',
                  text: 'Entity...',
                  properties: {
                    content: {
                      type: 'String',
                      basicType: 'String',
                      basicValue: 'the system message',
                    },
                    role: {
                      type: 'String',
                      basicType: 'String',
                      basicValue: 'system',
                    },
                  },
                },
                {
                  type: 'Entity',
                  basicType: 'Error',
                  basicValue: '#VALUE!',
                  text: 'Entity...',
                  properties: {
                    content: {
                      type: 'String',
                      basicType: 'String',
                      basicValue: 'the user message',
                    },
                    role: {
                      type: 'String',
                      basicType: 'String',
                      basicValue: 'user',
                    },
                  },
                },
              ],
            ],
          },
          model: {
            type: 'String',
            basicType: 'String',
            basicValue: 'gpt-0',
          },
          temperature: {
            type: 'Double',
            basicType: 'Double',
            basicValue: -1,
          },
        },
      },
      response: {
        type: 'Entity',
        basicType: 'Error',
        basicValue: '#VALUE!',
        text: 'Entity...',
        properties: {
          choices: {
            type: 'Array',
            basicType: 'Error',
            basicValue: '#VALUE!',
            elements: [
              [
                {
                  type: 'Entity',
                  basicType: 'Error',
                  basicValue: '#VALUE!',
                  text: 'Entity...',
                  properties: {
                    finish_reason: {
                      type: 'String',
                      basicType: 'String',
                      basicValue: 'stop',
                    },
                    index: {
                      type: 'Double',
                      basicType: 'Double',
                      basicValue: 0,
                    },
                    message: {
                      type: 'Entity',
                      basicType: 'Error',
                      basicValue: '#VALUE!',
                      text: 'Entity...',
                      properties: {
                        content: {
                          type: 'String',
                          basicType: 'String',
                          basicValue: content ?? '',
                        },
                        role: {
                          type: 'String',
                          basicType: 'String',
                          basicValue: 'assistant',
                        },
                      },
                    },
                  },
                },
              ],
            ],
          },
          created: {
            type: 'Double',
            basicType: 'Double',
            basicValue: 0,
          },
          id: {
            type: 'String',
            basicType: 'String',
            basicValue: 'chatcmpl-00000000000000000000000000000',
          },
          model: {
            type: 'String',
            basicType: 'String',
            basicValue: modelUsed ?? 'gpt-0-0000',
          },
          object: {
            type: 'String',
            basicType: 'String',
            basicValue: 'chat.completion',
          },
          system_fingerprint: {
            type: 'String',
            basicType: 'String',
            basicValue: '',
          },
          usage: {
            type: 'Entity',
            basicType: 'Error',
            basicValue: '#VALUE!',
            text: 'Entity...',
            properties: {
              completion_tokens: {
                type: 'Double',
                basicType: 'Double',
                basicValue: tokensCompletion ?? -1,
              },
              prompt_tokens: {
                type: 'Double',
                basicType: 'Double',
                basicValue: tokensPrompt ?? -1,
              },
              total_tokens: {
                type: 'Double',
                basicType: 'Double',
                basicValue: -1,
              },
            },
          },
        },
      },
    },
  };
}
