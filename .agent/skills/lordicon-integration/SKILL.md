---
name: lordicon-integration
description: Guidelines and setup instructions for integrating animated Lordicon icons into Next.js/React projects.
---

# Lordicon Integration Best Practices

Lordicon provides high-quality animated icons that can be integrated into web applications using their custom element or React components.

## Setup Instructions

### 1. Install Dependencies
Recommended to use `@lordicon/element` and `lottie-web` for better control and performance with module bundlers.

```bash
npm install @lordicon/element lottie-web
```

### 2. Define Custom Element
You need to define the `lord-icon` custom element globally. This is best done in a client-side layout component or a dedicated initialization script.

```typescript
// components/LordIconInitializer.tsx
'use client';

import { useEffect } from 'react';
import { defineElement } from '@lordicon/element';
import lottie from 'lottie-web';

export default function LordIconInitializer() {
  useEffect(() => {
    defineElement(lottie.loadAnimation);
  }, []);

  return null;
}
```

### 3. Reusable React Component
Create a wrapper to make it easier to use in React with TypeScript support.

```tsx
// components/ui/LordIcon.tsx
import React from 'react';

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
```

## Best Practices

- **Use CDN for public icons**: For standard icons, use the `https://cdn.lordicon.com/...` URLs to avoid bloating your repository.
- **Trigger Management**: Use the `target` attribute (or parent hover) for complex interactions.
- **Size Consistency**: Use standard sizes (e.g., 24, 32, 48) to maintain UI consistency.
- **Dark Mode Compatibility**: Use the `colors` prop to pass theme-aware hex codes.
- **Performance**: Avoid having too many "loop" icons on a single page as it might impact CPU usage due to Lottie animations. Use `hover` or `loop-on-hover` instead.

## TypeScript Support
Add the custom element definition to your `global.d.ts` to avoid "Property 'lord-icon' does not exist" errors.

```typescript
declare namespace JSX {
  interface IntrinsicElements {
    'lord-icon': any;
  }
}
```
