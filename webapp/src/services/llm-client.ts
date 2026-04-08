export type LlmProvider = 'openai' | 'anthropic' | 'google';

interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  model?: string;
}

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.5-flash-lite',
};

// Stronger models for tasks that need accuracy (profile extraction)
const SMART_MODELS: Record<LlmProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
  google: 'gemini-2.5-flash',
};

const PROXY_BASE = import.meta.env.VITE_PROXY_URL || 'http://localhost:8787';

export async function callLlm(
  config: LlmConfig,
  systemPrompt: string,
  userMessage: string,
  useSmart: boolean = false,
): Promise<string> {
  const models = useSmart ? SMART_MODELS : DEFAULT_MODELS;
  const model = config.model || models[config.provider];

  switch (config.provider) {
    case 'openai':
      return callOpenAi(config.apiKey, model, systemPrompt, userMessage);
    case 'anthropic':
      return callAnthropic(config.apiKey, model, systemPrompt, userMessage);
    case 'google':
      return callGoogle(config.apiKey, model, systemPrompt, userMessage);
  }
}

async function callOpenAi(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const res = await fetch(`${PROXY_BASE}/proxy/api.openai.com/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const res = await fetch(`${PROXY_BASE}/proxy/api.anthropic.com/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

async function callGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
): Promise<string> {
  const url = `${PROXY_BASE}/proxy/generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}
