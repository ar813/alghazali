"use client";

import { motion } from "framer-motion";
import { memo } from "react";
import { Suggestion } from "./suggestion";

type SuggestedActionsProps = {
    onSuggestionClick: (suggestion: string) => void;
};

const suggestedActions = [
    "Imam Al-Ghazali ke bare mein bataiye",
    "Ahya Uloom ud Din ka khulasa dein",
    "Kimiya e Saadat kya hai?",
    "Ibadaat ka maqsad samjhaiye",
];

function PurePremiumSuggestedActions({ onSuggestionClick }: SuggestedActionsProps) {
    return (
        <div
            className="grid w-full gap-2 sm:grid-cols-2"
            data-testid="suggested-actions"
        >
            {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    initial={{ opacity: 0, y: 20 }}
                    key={suggestedAction}
                    transition={{ delay: 0.05 * index }}
                >
                    <Suggestion
                        className="h-auto w-full whitespace-normal p-3 text-left"
                        onClick={(suggestion) => {
                            onSuggestionClick(suggestion);
                        }}
                        suggestion={suggestedAction}
                    >
                        {suggestedAction}
                    </Suggestion>
                </motion.div>
            ))}
        </div>
    );
}

export const PremiumSuggestedActions = memo(
    PurePremiumSuggestedActions,
    (prevProps, nextProps) => {
        if (prevProps.onSuggestionClick !== nextProps.onSuggestionClick) {
            return false;
        }
        return true;
    }
);
