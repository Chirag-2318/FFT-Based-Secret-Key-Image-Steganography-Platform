# STANDING RULES for Veil Frontend

These rules apply to all future work in this repository:

- **Frontend Only:** We build only the frontend. Never create a backend.
- **Design Law:** `docs/design.md` is law for visuals and copy. Never hard-code hex colors, radii, or font names inside components; use the design tokens only.
- **Anti-Slop Rules:** Anti-slop rules from `docs/design.md` section 1.3 are hard rules: no gradients (except the hero grain dissolve), no glow, no glassmorphism, no emoji, no identical-card grids, no fabricated stats or testimonials, no entrance animations on sections, no hover-lift on cards.
- **Vocabulary:** Use "Hide", "Reveal", "Key". Never use encode, decode, encrypt, password, or token in user-facing text. Never write "military-grade", "unbreakable", "invisible", "100% undetectable".
- **Zero Persistence & Privacy:** Never persist images, messages or keys: no `localStorage`, `sessionStorage`, cookies, `IndexedDB`. Never log them to the console. Never put a key in a URL.
- **Lossless Handling:** Never pass the stego image through canvas or any re-encoding. The bytes returned by the API are the bytes the user downloads.
- **Externalized Content:** All user-facing strings go in `src/content/*.ts`, not inline in JSX.
- **Accessibility Floor:** Every interactive element needs visible keyboard focus (2px forest outline, offset 3px), a 44px minimum touch target, and respect for `prefers-reduced-motion`.
- **Quality Gate:** After every task, run `lint`, `typecheck` and `build`, fix all errors, and summarize what you did and any decisions you made.
