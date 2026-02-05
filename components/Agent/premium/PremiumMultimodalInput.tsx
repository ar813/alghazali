"use client";

import { memo, useCallback, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, StopIcon } from "./icons";
import { cn } from "@/lib/utils";

interface PremiumMultimodalInputProps {
    input: string;
    setInput: (value: string) => void;
    onSubmit: () => void;
    onStop?: () => void;
    isLoading: boolean;
    className?: string;
    placeholder?: string;
}

function PurePremiumMultimodalInput({
    input,
    setInput,
    onSubmit,
    onStop,
    isLoading,
    className,
    placeholder = "Apna sawaal likhein...",
}: PremiumMultimodalInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            textareaRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Handle keyboard submit
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                    onSubmit();
                }
            }
        },
        [input, isLoading, onSubmit]
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (input.trim() && !isLoading) {
                onSubmit();
            }
        },
        [input, isLoading, onSubmit]
    );

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                "relative flex w-full flex-col gap-2 rounded-xl border border-border bg-background p-3 shadow-sm transition-all duration-200 focus-within:border-primary/50 hover:border-muted-foreground/50",
                className
            )}
        >
            <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-2 text-base outline-none ring-0 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
                rows={1}
                data-testid="multimodal-input"
            />
            <div className="flex items-center justify-end">
                {isLoading ? (
                    <Button
                        type="button"
                        onClick={onStop}
                        className="size-8 rounded-full bg-destructive text-destructive-foreground transition-colors duration-200 hover:bg-destructive/90"
                        data-testid="stop-button"
                    >
                        <StopIcon size={14} />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={!input.trim()}
                        className="size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                        data-testid="send-button"
                    >
                        <ArrowUpIcon size={14} />
                    </Button>
                )}
            </div>
        </form>
    );
}

export const PremiumMultimodalInput = memo(
    PurePremiumMultimodalInput,
    (prevProps, nextProps) => {
        if (prevProps.input !== nextProps.input) return false;
        if (prevProps.isLoading !== nextProps.isLoading) return false;
        return true;
    }
);
