import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

import { useSession } from '@/context/SessionContext';

export default function AdminChatBot() {
    const { selectedSession } = useSession();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            console.log('=== FRONTEND: Sending request ===');
            console.log('Input:', userMessage);

            const response = await fetch('/api/admin/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage, session: selectedSession }),
            });

            console.log('=== FRONTEND: Response received ===');
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                // Show the actual error from the server
                const errorMsg = data.error || data.errorDetails || 'Failed to fetch response';
                const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
                const errorType = data.errorType ? `\nType: ${data.errorType}` : '';
                console.error('Server error:', errorMsg);
                console.error('Error details:', data.details);
                console.error('Error type:', data.errorType);
                throw new Error(errorMsg + errorDetails + errorType);
            }

            // Handle both string and object responses
            let botResponse: string;
            if (typeof data.response === 'string') {
                botResponse = data.response;
            } else if (typeof data.response === 'object' && data.response !== null) {
                // If response is an object, try to extract meaningful text
                botResponse = data.response.finalOutput || JSON.stringify(data.response, null, 2);
            } else {
                botResponse = 'No response from agent.';
            }

            console.log('=== FRONTEND: Bot response ===');
            console.log('Bot response:', botResponse);

            setMessages((prev) => [...prev, { role: 'assistant', content: botResponse }]);
        } catch (error: any) {
            console.error('=== FRONTEND: Chat error ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);

            // Show the actual error message instead of a generic one
            const errorMessage = error.message || 'Sorry, I encountered an error. Please check your connection and API keys.';
            setMessages((prev) => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shrink-0">
                <div className="flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Admin Assistant</h3>
                        <div className="flex items-center gap-1.5 opacity-80 text-xs">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            Online • Powered by OpenRouter
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth"
            >
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-2">
                            <Sparkles size={32} />
                        </div>
                        <p className="text-sm font-medium">No messages yet. Start a conversation!</p>
                        <p className="text-xs text-gray-400 max-w-[200px] text-center">
                            I can help you manage students, reports, and more.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                            }`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                            <Loader2 size={14} className="animate-spin" />
                        </div>
                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
