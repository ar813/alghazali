import { setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from '@openai/agents';
import OpenAI from 'openai';

const apiKey = process.env.MISTRAL_API_KEY || process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
const baseURL = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';

if (!apiKey) {
    console.warn('MISTRAL_API_KEY is missing in env variables.');
}

export const initAgentSDK = () => {
    const client = new OpenAI({
        apiKey: apiKey || '',
        baseURL: baseURL,
        dangerouslyAllowBrowser: true,
    });

    setDefaultOpenAIClient(client);

    // IMPORTANT: Use Chat Completions API instead of Responses API (Mistral doesn't support Responses API)
    setOpenAIAPI('chat_completions');

    // Disable tracing since we're not using OpenAI
    setTracingDisabled(true);
};
