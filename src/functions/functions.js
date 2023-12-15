CustomFunctions.associate('CHAT_COMPLETE', async (messages, params) => {
  const {
    API_KEY: apiKey,
    API_BASE: apiBase = 'https://api.openai.com/',
    messages: _,
    0: __, // Empty key cell in range
    ...userParams
  } = Object.fromEntries(params);

  if (apiKey == null || apiKey === 0) {
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
    const response = await fetch(`${apiBase}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...userParams,
        messages: messages.map(([role, content]) => ({ role, content })),
      }),
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
        // For visibility of newlines without needing to use cell text wrap.
        _lines:
          json.choices.length === 1
            ? json.choices[0].message.content.split('\n')
            : json.choices.map((choice) => choice.message.content.split('\n')),

        response: toEntityCellValueProperties(json),
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
});

// Terminology note: our _cost_ is driven by usage and OpenAI's _prices_.
CustomFunctions.associate('COST', (completionsMatrix, pricesMatrix) => {
  const completions = completionsMatrix.flat().filter(
    (value) => value !== 0, // Empty value in range
  );
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
        `No pricing specified for model ${model}`,
      );
    }

    return (
      accumulator +
      (usage.prompt_tokens.basicValue / 1000) * modelPrices.input +
      (usage.completion_tokens.basicValue / 1000) * modelPrices.output
    );
  }, 0);
});

CustomFunctions.associate('COT_ANSWER', (completion, separator) => {
  if (separator === null) {
    // This default value must be kept in sync with documentation in the function metadata.
    separator = '<!-- END CoT -->';
  }

  const halves = completion.text.split(separator, 2);

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
});

function toEntityCellValueProperties(value) {
  if (value === null) {
    return '';
  } else if (typeof value !== 'object') {
    return value;
  } else if (Array.isArray(value)) {
    return value.map((element) => toEntityCellValueProperties(element));
  } else {
    return {
      type: Excel.CellValueType.entity,
      text: 'Entity...',
      properties: mapObject(value, toEntityCellValueProperties),
    };
  }
}

function mapObject(object, callback) {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [key, callback(value)]),
  );
}
