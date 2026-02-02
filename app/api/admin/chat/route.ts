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

// Create the admin assistant agent
const adminAgent = new Agent({
    name: 'Admin Assistant',
    instructions: `You are a helpful AI assistant for the Al Ghazali School admin portal. 
    You help with administrative tasks, answer questions about school management, 
    and provide guidance on using the admin dashboard features.
    Be professional, clear, and concise in your responses.`,
    model: 'mistral-small-latest',
});

export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const { message, session } = await req.json();

        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Inject session context into the message
        const sessionContext = session ? `\n[Context: Current Academic Session is ${session}]` : '';
        const userMessage = message + sessionContext;

        // Run the agent with the user's message
        const result = await run(adminAgent, userMessage);

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
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
        }

        return NextResponse.json(
            {
                error: 'Failed to process chat request',
                details: errorDetails,
                errorType: error?.constructor?.name || 'UnknownError'
            },
            { status: 500 }
        );
    }
}
