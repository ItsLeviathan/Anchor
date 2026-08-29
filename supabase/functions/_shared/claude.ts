// Supabase Edge Functions run on Deno. Per Supabase's current guidance,
// external deps are imported with the npm: specifier (never bare
// specifiers), and Web-standard fetch is preferred over an SDK here.

export interface ToolUseResult<T> {
  input: T;
  inputTokens: number;
  outputTokens: number;
}

interface AnthropicContentBlock {
  type: string;
  input?: unknown;
  name?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  usage: { input_tokens: number; output_tokens: number };
}

interface CallClaudeParams {
  system: string;
  userText: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Calls Claude with a single tool forced via tool_choice, so the response
 * is always structured JSON matching `inputSchema` - no parsing prose out
 * of a text response, no risk of the model wrapping JSON in commentary.
 */
export async function callClaudeWithTool<T>(params: CallClaudeParams): Promise<ToolUseResult<T>> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured for this Edge Function');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: params.system,
      messages: [{ role: 'user', content: params.userText }],
      tools: [
        {
          name: params.toolName,
          description: params.toolDescription,
          input_schema: params.inputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: params.toolName },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  const toolUseBlock = data.content.find((block) => block.type === 'tool_use' && block.name === params.toolName);

  if (!toolUseBlock) {
    throw new Error('Claude did not return the expected structured tool call');
  }

  return {
    input: toolUseBlock.input as T,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
  };
}
