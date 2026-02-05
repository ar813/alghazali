"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumGreeting } from "./premium/PremiumGreeting";
import { PremiumMultimodalInput } from "./premium/PremiumMultimodalInput";
import { PremiumSuggestedActions } from "./premium/PremiumSuggestedActions";
import { useScrollToBottom } from "./premium/hooks/use-scroll-to-bottom";
import { BotIcon, UserIcon } from "./premium/icons";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function AgentChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { containerRef, endRef, scrollToBottom } = useScrollToBottom();

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSend = useCallback(async (messageContent?: string) => {
        const content = (messageContent || input).trim();
        if (!content || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: content
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: content }),
                signal: abortControllerRef.current.signal,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.details || data.error || 'Unknown error');
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.response || "Maaf kijiyega, main samajh nahi paaya. Phir se koshish karein."
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                // Request was cancelled
                return;
            }
            console.error("Agent Run Error:", error);
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `System error: ${errorMessage}`
            }]);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [input, isLoading]);

    const handleStop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoading(false);
        }
    }, []);

    const handleSuggestionClick = useCallback((suggestion: string) => {
        handleSend(suggestion);
    }, [handleSend]);

    const showGreeting = messages.length === 0;

    return (
        <div className="flex h-[calc(100vh-200px)] min-h-[600px] w-full flex-col">
            {/* Messages Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto p-4"
            >
                <div className="mx-auto flex max-w-3xl flex-col gap-6">
                    <AnimatePresence mode="wait">
                        {showGreeting ? (
                            <motion.div
                                key="greeting"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <PremiumGreeting />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="messages"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col gap-4"
                            >
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex items-start gap-3",
                                            msg.role === "user" ? "flex-row-reverse" : ""
                                        )}
                                    >
                                        {/* Avatar */}
                                        <div className={cn(
                                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}>
                                            {msg.role === "user" ? (
                                                <UserIcon size={16} />
                                            ) : (
                                                <BotIcon size={16} />
                                            )}
                                        </div>

                                        {/* Message Bubble */}
                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                {msg.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Thinking Indicator */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <BotIcon size={16} />
                                        </div>
                                        <div className="rounded-2xl bg-muted px-4 py-3 shadow-sm">
                                            <div className="flex items-center gap-1.5">
                                                <motion.span
                                                    className="h-2 w-2 rounded-full bg-muted-foreground/50"
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                                />
                                                <motion.span
                                                    className="h-2 w-2 rounded-full bg-muted-foreground/50"
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                                />
                                                <motion.span
                                                    className="h-2 w-2 rounded-full bg-muted-foreground/50"
                                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={endRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
                <div className="mx-auto flex max-w-3xl flex-col gap-4">
                    {/* Suggested Actions - Show only when no messages */}
                    {showGreeting && (
                        <PremiumSuggestedActions onSuggestionClick={handleSuggestionClick} />
                    )}

                    {/* Input */}
                    <PremiumMultimodalInput
                        input={input}
                        setInput={setInput}
                        onSubmit={() => handleSend()}
                        onStop={handleStop}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}
