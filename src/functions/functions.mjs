import ConcurrencyLimitedFetch from './ConcurrencyLimitedFetch.mjs';

const COMPLETION_ENTITY_KIND = 'openai-excel-functions:chat-completion';
const EMPTY_OR_ZERO = 0;

const fetcher = new ConcurrencyLimitedFetch();

CustomFunctions.associate('CHAT_COMPLETE', chatComplete);
export async function chatComplete(messages, params, invocation) {
  const {
    API_KEY: apiKey,
    API_BASE: apiBase = 'https://api.openai.com/',
    messages: _,
    [EMPTY_OR_ZERO]: __,
    ...userParams
  } = Object.fromEntries(params);

  if (apiKey == null || apiKey === EMPTY_OR_ZERO) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'API_KEY is required',
    );
  }

  if (messages.length === 1 && messages[0].length === 1) {
    messages = [
      ['system', 'You are a helpful assistant.'],
      ['user', messages[0][0]],
    ];
  }

  try {
    const requestBody = {
      ...userParams,
      messages: messages
        .filter(([role]) => role !== EMPTY_OR_ZERO)
        .map(([role, content]) => ({ role, content })),
    };

    const abortController = new AbortController();
    invocation.onCanceled = () => abortController.abort();

    const response = await fetcher.fetch(`${apiBase}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    if (
      !response.ok &&
      !response.headers.get('Content-Type').startsWith('application/json')
    ) {
      throw Error(`API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json.error != null) {
      throw Error(`API error: ${json.error.message}`);
    }

    return {
      type: Excel.CellValueType.entity,
      text: json.choices[0].message.content,
      properties: {
        // These are accessible using formulas. Prefix any that are only for
        // this addin's use, or only for display use, with _.

        _entityKind: COMPLETION_ENTITY_KIND,

        // For visibility of newlines without needing to use cell text wrap.
        _lines:
          json.choices.length === 1
            ? json.choices[0].message.content.split('\n')
            : json.choices.map((choice) => choice.message.content.split('\n')),

        requestBody: toEntityProperty(requestBody),
        response: toEntityProperty(json),
      },
      basicType: Excel.RangeValueType.error,
      basicValue: '#VALUE!',
    };
  } catch (e) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.notAvailable,
      e.message,
    );
  }
}

// Terminology note: our _cost_ is driven by usage and OpenAI's _prices_.
CustomFunctions.associate('COST', cost);
export function cost(completionsMatrix, pricesMatrix) {
  const allPrices = Object.fromEntries(
    pricesMatrix.map((row) => [row[0], { input: row[1], output: row[2] }]),
  );

  return completionsMatrix.map((row) =>
    row.map((cell) => {
      if (cell === EMPTY_OR_ZERO) {
        return 0;
      } else {
        validateIsCompletion(cell);
      }

      const model = cell.properties.response.properties.model.basicValue;
      const usage = cell.properties.response.properties.usage.properties;
      const modelPrices = allPrices[model];

      if (!modelPrices) {
        throw new CustomFunctions.Error(
          CustomFunctions.ErrorCode.invalidValue,
          `No prices specified for model ${model}`,
        );
      }

      return (
        (usage.prompt_tokens.basicValue / 1000) * modelPrices.input +
        (usage.completion_tokens.basicValue / 1000) * modelPrices.output
      );
    }),
  );
}

function toEntityProperty(value) {
  if (value === null) {
    // There is no concept of null in Excel's data model.
    return '';
  } else if (typeof value !== 'object') {
    return value;
  } else if (Array.isArray(value)) {
    return {
      // An array in this context is really a matrix.
      type: Excel.CellValueType.array,
      elements: [value.map((element) => toEntityProperty(element))],
    };
  } else {
    return {
      type: Excel.CellValueType.entity,
      text: 'Entity...',
      properties: mapObject(value, toEntityProperty),
    };
  }
}

function validateIsCompletion(anyTypedParameter) {
  if (
    !(
      anyTypedParameter.type === Excel.CellValueType.entity &&
      anyTypedParameter.properties._entityKind.basicValue ===
        COMPLETION_ENTITY_KIND
    )
  ) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Completion in parameter value is not a CHAT_COMPLETE() completion',
    );
  }
}

function mapObject(object, callback) {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [key, callback(value)]),
  );
}
