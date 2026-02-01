import React from 'react';

/**
 * LordIcon Component
 * 
 * A reusable wrapper for animated Lordicons.
 * Follows best practices from .agent/skills/lordicon-integration/SKILL.md
 */

interface LordIconProps {
    src: string;
    trigger?: 'in' | 'click' | 'hover' | 'loop' | 'loop-on-hover' | 'morph' | 'boomerang' | 'sequence';
    size?: number;
    colors?: string; // Format: "primary:#ffffff,secondary:#000000"
    stroke?: 'light' | 'regular' | 'bold';
    state?: string;
    delay?: number;
}

const LordIcon = ({
    src,
    trigger = 'hover',
    size = 32,
    colors,
    stroke,
    state,
    delay
}: LordIconProps) => {
    return (
        <lord-icon
            src={src}
            trigger={trigger}
            style={{ width: size, height: size }}
            colors={colors}
            stroke={stroke}
            state={state}
            delay={delay}
        />
    );
};

export default LordIcon;
