'use client';

import { useEffect } from 'react';

/**
 * LordIconInitializer Component
 * 
 * Initializes the 'lord-icon' custom element globally on the client side.
 * Uses dynamic imports to avoid SSR "document is not defined" errors.
 */

export default function LordIconInitializer() {
    useEffect(() => {
        const init = async () => {
            // Only define once
            if (!customElements.get('lord-icon')) {
                const { defineElement } = await import('@lordicon/element');
                const lottie = (await import('lottie-web')).default;

                // defineElement needs the lottie instance to properly render animations
                (defineElement as any)(lottie.loadAnimation);
            }
        };
        init();
    }, []);

    return null;
}


