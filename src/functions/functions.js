CustomFunctions.associate('CHAT_COMPLETE', async (messages, params) => {
  const {
    API_KEY: apiKey,
    API_BASE: apiBase = 'https://api.openai.com/',
    messages: _,
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
