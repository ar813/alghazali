import { Agent, run, setDefaultOpenAIClient, setOpenAIAPI, setTracingDisabled } from '@openai/agents';
import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

// This tells Next.js that this route is dynamic and should not be statically generated
export const dynamic = 'force-dynamic'

// Create OpenAI client configured to use Mistral API
const mistralClient = new OpenAI({
    apiKey: process.env.MISTRAL_API_KEY || '',
    baseURL: process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1',
});

// Set the custom client as the default for all agents
setDefaultOpenAIClient(mistralClient);

// IMPORTANT: Use Chat Completions API instead of Responses API (Mistral doesn't support Responses API)
setOpenAIAPI('chat_completions');

// Disable tracing since we're not using OpenAI
setTracingDisabled(true);

// Create the school assistant agent
const schoolAgent = new Agent({
    name: 'Al Ghazali Assistant',
    instructions: `You are Al Ghazali High School's official AI assistant.
    Answer in a mix of Urdu and English (Roman Urdu).
    Keep answers very concise and professional.
    You help users with school information, admissions, fees, and general queries.`,
    model: 'mistral-small-latest',
});

export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const { message } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Run the agent with the user's message
        const result = await run(schoolAgent, message);

        // Return the agent's response
        return NextResponse.json({
            success: true,
            response: result.finalOutput,
        });

    } catch (error) {
        // More detailed error information
        let errorDetails = 'Unknown error';
        if (error instanceof Error) {
            errorDetails = error.message;
            console.error('Agent Error:', error.message);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }

        return NextResponse.json(
            {
                error: 'Failed to process chat request',
                details: errorDetails,
            },
            { status: 500 }
        );
    }
}
