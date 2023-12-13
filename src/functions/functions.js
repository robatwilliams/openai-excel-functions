CustomFunctions.associate("CHAT_COMPLETE", async (messages, params) => {
  const { 
    API_KEY: apiKey, 
    API_BASE: apiBase = "https://api.openai.com/",
    messages: _, 
    ...userParams 
  } = Object.fromEntries(params);
  if (apiKey == null) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, "API_KEY is required");
  }
  if (messages.length === 1 && messages[0].length === 1) {
    messages = [
      ["system", "You are a helpful assistant."], 
      ["user", messages[0][0]]
    ];
  }
  try {
    const response = await fetch(`${apiBase}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...userParams,
        messages: messages.map(([role, content]) => ({ role, content }))
      }),
    });

    const json = await response.json();

    if (json.error != null) {
      throw Error(`API error: ${json.error.message}`);
    }

    if (!response.ok) {
      throw Error(`API error: ${response.status} ${response.statusText}`);
    }

    return json.choices[0].message.content;
  }
  catch (e) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.notAvailable, e.message);
  }
});
