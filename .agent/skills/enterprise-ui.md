---
name: Enterprise UI Patterns
description: Guidelines and code snippets for creating high-end, premium SaaS-level UI/UX inspired by Vercel and Linear.
---

# Enterprise UI & Design Patterns

This skill documents the "Premium Enterprise" aesthetic preferred for this project. Focus on high contrast, sophisticated gradients, and professional spacing.

## 1. Split-Screen Auth Layout
Always use a split-screen approach for major points of entry (Login, Onboarding, Verification).

### Visual Panel (Left Side)
- **Background**: Dark Mesh Gradients (`#0a0a0a` base with blue/purple/emerald blur nodes).
- **Patterns**: Subtle Grid Overlays (1px lines, low opacity).
- **Branding**: Logo in a stark white/high-contrast container.
- **Typography**: Large, bold headings with tight tracking and descriptive sub-text in neutral-400.

### Form Panel (Right Side)
- **Background**: Pure white or deep neutral-950 for dark mode.
- **Inputs**: Sharp borders, subtle shadows, and distinct focus states (using accent colors like Indigo or Emerald).
- **CTA**: Large, bold buttons with slight scaling effects and directional icons (e.g., `ArrowRight`).

## 2. Component Aesthetics

### Typography
- Use "Geist" or similar modern sans-serif fonts.
- Use `tracking-tight` for headings.
- Maintain a clear hierarchy: Heading (3xl+), Subheading (base/lg), Labels (xs/sm bold uppercase).

### Colors & Accents
- **Admin**: Indigo / Blue (`#4f46e5`).
- **Students/Positive Status**: Emerald / Teal (`#059669`).
- **Backgrounds**: Use `backdrop-blur-xl` and `bg-white/80` for glassmorphism.

### Interactive Elements
- **Hover States**: Always provide visual feedback (opacity changes, scaling, or border glows).
- **Moving Borders**: Use for primary CTAs or featured icons to draw attention.
- **Animations**: Prefer `animate-in`, `fade-in`, `zoom-in`, and `slide-in` for new sections.

## 3. Reusable Code Templates (AuthLayout Style)

```tsx
<div className="flex min-h-screen">
  <div className="hidden lg:flex lg:w-[40%] bg-neutral-900 relative overflow-hidden">
     {/* Mesh Gradient + Grid + Branding */}
  </div>
  <div className="flex-1 flex items-center justify-center p-8">
     {/* Clean Focused Content */}
  </div>
</div>
```

Always aim for a "Tight & Clean" feel—avoid excessive padding and rounded corners that look too "bubbly". Keep elements sophisticated and sharp.
