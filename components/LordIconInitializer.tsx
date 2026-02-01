'use client';

import { useEffect } from 'react';
import { defineElement } from '@lordicon/element';
import lottie from 'lottie-web';

/**
 * LordIconInitializer Component
 * 
 * Initializes the 'lord-icon' custom element globally on the client side.
 */

export default function LordIconInitializer() {
    useEffect(() => {
        // Only define once to avoid re-definition errors
        if (!customElements.get('lord-icon')) {
            defineElement();
        }
    }, []);

    return null;
}
