const COMPLETION_ENTITY_KIND = 'openai-excel-formulas:chat-completion';
const EMPTY_OR_ZERO = 0;

CustomFunctions.associate('CHAT_COMPLETE', chatComplete);
async function chatComplete(messages, params) {
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

    const response = await fetch(`${apiBase}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
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
function cost(completionsMatrix, pricesMatrix) {
  const completions = completionsMatrix
    .flat()
    .filter((value) => value !== EMPTY_OR_ZERO);
  completions.forEach(validateIsCompletion);
  const allPrices = Object.fromEntries(
    pricesMatrix.map((row) => [row[0], { input: row[1], output: row[2] }]),
  );

  return completions.reduce((accumulator, completion) => {
    const model = completion.properties.response.properties.model.basicValue;
    const usage = completion.properties.response.properties.usage.properties;
    const modelPrices = allPrices[model];

    if (!modelPrices) {
      throw new CustomFunctions.Error(
        CustomFunctions.ErrorCode.invalidValue,
        `No prices specified for model ${model}`,
      );
    }

    return (
      accumulator +
      (usage.prompt_tokens.basicValue / 1000) * modelPrices.input +
      (usage.completion_tokens.basicValue / 1000) * modelPrices.output
    );
  }, 0);
}

CustomFunctions.associate('COT_ANSWER', cotAnswer);
function cotAnswer(completion, separator) {
  validateIsCompletion(completion);

  if (separator === null) {
    // This default value must be kept in sync with documentation in the function metadata.
    separator = '<!-- END CoT -->';
  }

  const choiceIndex = 0;
  const choiceEntity =
    completion.properties.response.properties.choices.elements[0][choiceIndex];
  const choiceContent =
    choiceEntity.properties.message.properties.content.basicValue;
  const halves = choiceContent.split(separator, 2);

  if (halves.length !== 2) {
    throw new CustomFunctions.Error(
      CustomFunctions.ErrorCode.invalidValue,
      'Completion does not split into two by the separator',
    );
  }

  const answer = halves[1];

  // Models have a strong tendency to put a newline after the separator, and
  // it's difficult to prompt GPT 3.5T to consistently do anything different.
  return answer[0] === '\n' ? answer.substring(1) : answer;
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

// For unit testing.
if (typeof module === 'object') {
  module.exports = {
    chatComplete,
    cost,
    cotAnswer,
  };
}
