# Veil — Frontend

Veil is an FFT-based secret-key image steganography web application. It enables users to hide secret messages within ordinary images using frequency-domain steganography and cryptographically derived keys, and reveal hidden messages using the image and key.

> **Specifications:** See `docs/PRD.md` for product requirements, cryptographic parameters, algorithm design, and API limits. See `docs/design.md` for design tokens, typography, visual hierarchy, motion specifications, and copy rules.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

```bash
npm install
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Default variables:

- `VITE_API_BASE_URL`: `/api/v1` (Proxied in development to `http://localhost:8000`)
- `VITE_USE_MOCK`: `true` (Enables mock backend implementation for local UI development)

### Running the Development Server

```bash
npm run dev
```

---

## Data Layer & API Architecture

The frontend data layer (`src/lib/api`) supports both full local development/testing without a backend and seamless connection to the production API service.

### Environment Switching

- `VITE_USE_MOCK=true`: Routes all calls to `src/lib/mock/mockApi.ts` with realistic delays, in-memory session matching, and deterministic test scenarios.
- `VITE_USE_MOCK=false`: Routes calls to `src/lib/api/client.ts` targeting `VITE_API_BASE_URL` (default: `/api/v1`).

### Mock Backend Features

- **Realistic Network Delays**:
  - Encode: 1.5 to 3.5 seconds
  - Decode: 0.8 to 1.6 seconds
  - Capacity: 300 milliseconds
- **PRD Capacity Modeling**: Computes maximum capacity from cover dimensions using $\lfloor(w \times h) / 8 / 64 \times 0.85\rfloor - 36$, clamped to 4096 bytes ($512\times 512 \approx 400$ bytes).
- **In-Memory Session Store**: Tracks generated keys during the session so the exact corresponding key can reveal the hidden message. Data is never persisted to storage and is cleared on page reload.

### Magic Test Keys & Error Simulation

Use these magic inputs to test edge cases and error states without a backend:

#### Reveal Mode Magic Keys:
| Key Prefix | Simulated Error | Expected UI Behavior |
| ---------- | --------------- | -------------------- |
| `AAAA-AAAA...` | `400 malformed_key` | Inline error: "That key doesn't look right. Check for a typo." |
| `BBBB-BBBB...` | `429 rate_limited` | Banner: "That's a lot of tries. Wait a minute and try again." with active 8-second countdown |
| `CCCC-CCCC...` | `500 server` | Banner: "Something went wrong on our side. Your files weren't saved. Try again." with retry button |
| `DDDD-DDDD...` | `offline` | Banner: "You're offline." |
| Any other unknown key | `422 decode_failed` | Generic failure screen: "Nothing to reveal." |

#### Hide Mode Dev Query Parameters:
In development builds (`npm run dev`), test errors on `/app` or `/_kit` via URL query params:
- `?mock=rate_limit`: Forces a 429 Rate Limit error with 8-second countdown.
- `?mock=server`: Forces a 500 Server error with retry button.
- `?mock=slow`: Delays encoding by 12 seconds to test the "Large photos take a little longer" slow notice (triggers at 6s).

---

---

## Connecting to the Real Backend (FastAPI)

To switch from the local mock implementation to the real FastAPI backend:

1. **Configure Environment Variables**:
   In `.env`:
   ```env
   VITE_API_BASE_URL=/api/v1
   VITE_USE_MOCK=false
   ```
   Setting `VITE_USE_MOCK=false` directs the frontend data layer (`src/lib/api`) to use `realClient` in `src/lib/api/client.ts`. To re-enable the mock client for offline demos or automated tests, set `VITE_USE_MOCK=true`.

2. **Start the FastAPI Backend**:
   Ensure your FastAPI backend is running locally on port 8000 (e.g. `uvicorn main:app --port 8000 --reload`).

3. **Vite Reverse Proxy**:
   The Vite dev server (`vite.config.ts`) includes a reverse proxy that automatically routes `/api` requests to `http://localhost:8000`:
   ```ts
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8000',
         changeOrigin: true,
       },
     },
   }
   ```
   If the backend runs on a different port or host, adjust the `target` URL in `vite.config.ts` or set `VITE_API_BASE_URL` to an absolute URL with appropriate backend CORS settings.

4. **Security, Privacy & CORS Compliance**:
   - **Zero Credentials Mode**: All client `fetch` calls strictly set `credentials: 'omit'`. No cookies, session tokens, or Authorization headers are ever transmitted or stored.
   - **Zero Client Persistence**: Stego images, secret keys, and hidden messages are never cached, stored in `localStorage`/`sessionStorage`/`IndexedDB`, or logged to browser devtools.
   - **Lossless Handling**: Stego image responses are received directly as binary Blobs (or converted from Base64 via raw byte arrays) without passing through HTML Canvas, preventing browser compression artifacts.

---

## Confirmed API Contract

All endpoints are prefixed by `VITE_API_BASE_URL` (default: `/api/v1`).

### 1. Hide / Encode Endpoint: `POST /api/v1/encode`

- **Request**: `multipart/form-data`
  - `image`: Cover image file (`image/png`, `image/jpeg`, `image/bmp`)
  - `message`: Plaintext secret string to hide
- **Response Format (Multi-Strategy Detection)**:
  `src/lib/api/client.ts` automatically adapts to any of the following standard FastAPI response formats based on `Content-Type`:
  1. **JSON Payload (Default)**:
     ```json
     {
       "image_base64": "<base64_encoded_png>",
       "key": "AAAA-BBBB-CCCC-DDDD-...",
       "metrics": {
         "psnr": 45.2,
         "ssim": 0.992,
         "capacity_bytes": 400,
         "used_bytes": 120,
         "bpp": 0.05
       }
     }
     ```
     *(Supports common naming aliases: `image_base64`, `imageBase64`, `stego_image`, `stegoImage`, `image`, `file`).*
  2. **Multipart Mixed**: `multipart/mixed` containing an `image/png` binary part and an `application/json` metadata part.
  3. **Direct Binary Stream**: `image/png` or `application/octet-stream` response with metadata headers:
     - `x-key`: Secret key string
     - `x-psnr`: PSNR metric float
     - `x-ssim`: SSIM metric float
     - `x-capacity-bytes`: Total capacity in bytes
     - `x-used-bytes`: Bytes used by message and framing
     - `x-bpp`: Bits per pixel float
- **Error Codes**:
  - `400`: Invalid image format (`invalid_input` -> "That file isn't a PNG, JPG or BMP image.")
  - `413`: File exceeds 10 MB limit (`too_large` -> "That file is too large. The limit is 10 MB.")
  - `422`: Payload exceeds cover capacity (`over_capacity` -> "Message exceeds image capacity.")
  - `429`: Rate limit exceeded (`rate_limited` -> "That's a lot of tries. Wait a minute and try again.")
  - `5xx`: Internal server error (`server` -> "Something went wrong on our side. Your files weren't saved. Try again.")

### 2. Reveal / Decode Endpoint: `POST /api/v1/decode`

- **Request**: `multipart/form-data`
  - `image`: Stego image file (`image/png`)
  - `key`: Base32 secret key string (placed strictly in request body, never in URL or headers)
- **Response**: `application/json`
  ```json
  {
    "message": "Secret message revealed from the image"
  }
  ```
  *(Supports aliases: `message`, `text`, `secret_message`, `secretMessage`).*
- **Error Codes**:
  - `400`: Malformed key syntax (`malformed_key` -> "That key doesn't look right. Check for a typo.")
  - `422` or any unhandled failure: Generic calm failure screen per PRD D-2/D-3 (`decode_failed` -> "Nothing to reveal. The key may be wrong, or the image may have been resized, compressed or edited.") to avoid cryptographic Oracle attacks.
  - `429`: Rate limit exceeded with optional `Retry-After` header.
  - `5xx`: Server error.

### 3. Capacity Probe Endpoint: `POST /api/v1/capacity` (Fallback: `GET`)

- **Request**: `multipart/form-data`
  - `image`: Cover image file
- **Response**: `application/json`
  ```json
  {
    "capacity_bytes": 400
  }
  ```
  *(Supports aliases: `capacity_bytes`, `capacityBytes`, `capacity`, `max_bytes`, `maxBytes`).*
- **HTTP Method Handshake**:
  Although PRD 14.3 drafts `GET /capacity`, HTTP specs disallow request bodies on GET requests. The client defaults to `POST` with multipart, and automatically falls back to `GET` if the backend returns `405 Method Not Allowed`.

---

## Sample Images for Before/After Proof Section

Per `docs/design.md` Section 5.4 and 13:
1. **Source Photo**: Must be a warm, natural-light photo with medium texture that is **licensed or self-shot (never AI-generated)**.
2. **Encoder**: The stego counterpart must be produced using the real backend FFT encoder once available (ensuring exact mathematical fidelity and honest PSNR/SSIM numbers).
3. **Location**: Place the pair in `public/samples/`:
   - `public/samples/sample-original.png`
   - `public/samples/sample-stego.png`
4. **Configuration**: Update `src/content/proof.ts` by exporting `PROOF = { originalSrc: '/samples/sample-original.png', hiddenSrc: '/samples/sample-stego.png', psnr: 46.2, ssim: 0.994, bytesHidden: 182 }`. When `PROOF` is null, development mode shows a pending notice and production builds hide the section cleanly.

---

## Scripts

| Command             | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Starts Vite dev server with proxy to `http://localhost:8000` |
| `npm run build`     | Typechecks and compiles production bundle to `dist/`         |
| `npm run preview`   | Previews production build locally                            |
| `npm run lint`      | Runs ESLint checks                                           |
| `npm run format`    | Formats code with Prettier                                   |
| `npm run test`      | Runs unit tests using Vitest and jsdom                       |
| `npm run typecheck` | Runs TypeScript type checking without emitting files         |

---

## Folder Structure

```
├── docs/
│   ├── PRD.md                       # Product requirements, algorithms & API contract
│   └── design.md                    # Visual specifications, tokens, copy & motion rules
├── public/
│   └── samples/                     # Sample images for testing & demonstration
├── src/
│   ├── app/                         # Router and root providers
│   ├── components/
│   │   ├── landing/                 # Landing page sections & interactive demos
│   │   ├── layout/                  # Navigation, footer, announcement bar, FAB
│   │   ├── platform/                # Platform card & mode components
│   │   └── ui/                      # Base primitive components (buttons, toggles, badges)
│   ├── content/                     # Centralized copy strings and text content
│   ├── features/
│   │   ├── hide/                    # Hide flow components and state logic
│   │   └── reveal/                  # Reveal flow components and state logic
│   ├── hooks/                       # Custom React hooks
│   ├── lib/
│   │   ├── mock/                    # Mock backend implementation
│   │   └── ...                      # API client, key utils, file validation, formatting
│   ├── pages/                       # Route pages (Landing, Platform, NotFound)
│   ├── styles/                      # Global styles, Tailwind setup & design tokens
│   ├── App.tsx                      # Root App component
│   └── main.tsx                     # Application entry point
├── AGENTS.md                        # Standing rules for automated assistants
└── vite.config.ts                   # Vite configuration with proxy, aliases & test setup
```

---

## Standing Rules

All frontend development strictly adheres to the standing rules defined in `AGENTS.md` and `.agent/rules/frontend-rules.md`, enforcing design token discipline, anti-slop guidelines, strict steganography vocabulary, zero client-side persistence, and accessibility standards.

---

## Frontend Acceptance Checklist

Copied from `docs/design.md` Section 14, tracking the implementation and verification status of every criterion:

### Look
- [x] **Reference aesthetic match**: Palette, Figtree/EB Garamond type pairing, floating nav, 2px-bordered lavender buttons, sand panels, and curved dark footer adhere to the reference design system. *(Verified — token and component audit completed)*
- [x] **Headline pattern**: Every headline strictly uses an upright serif line followed by a full serif italic line with no single-word accents. *(Verified — enforced centrally via `Headline` component)*
- [x] **Anti-slop enforcement**: Zero gradients (outside hero dissolve), zero glow, zero glassmorphism blur, no stock padlocks/shields, no emoji, and no identical-card grids. *(Verified — audited across entire codebase)*
- [x] **No fabricated claims**: No fake metrics, testimonials, or certifications; honest limits stated plainly. *(Verified — audited in landing and limits content)*
- [x] **Squint test**: Generous whitespace and one clear focal point per screen. *(Verified — 1160px max width and spacious section padding)*

### Behavior
- [x] **Hide flow**: Empty to PNG download works end-to-end; key card is prominently separated, copy status updates, and leave guard prevents accidental loss. *(Verified in mock mode; full production fidelity requires backend)*
- [x] **Reveal flow**: Empty to TypewriterText result works; malformed key inline error and generic calm failure block are distinct per PRD D-2/D-3. *(Verified in mock mode; full production fidelity requires backend)*
- [x] **Mode URL reflection**: `?mode=hide` and `?mode=reveal` are mirrored in the URL and survive page reloads without storing sensitive data. *(Verified in PlatformPage)*
- [x] **Capacity meter**: Capacities calculated via API; over-capacity disables submit and displays exact guidance. *(Verified in useHideFlow and CapacityMeter)*
- [ ] **Lossless PNG round-trip**: True cryptographic bit-level FFT round-trip through Reveal. *(Needs the backend FFT encoder/decoder service)*

### Quality
- [x] **Keyboard navigation & focus**: 2px solid forest outline offset 3px on all interactive elements; tab order is logical and skip link is present. *(Verified across primitives and forms)*
- [x] **Reduced motion**: `prefers-reduced-motion` cleanly disables the hero ring, ribbon dissolve, typewriter animation, pixel-grid pulses, and transitions. *(Verified in CSS and components)*
- [x] **360px responsive design**: Single-column layouts, 20px mobile card padding, wrapped mono keys, and zero horizontal scroll. *(Verified across all viewports)*
- [x] **Zero persistence & privacy**: Zero data in localStorage, sessionStorage, cookies, IndexedDB, console logs, or URLs; object URLs deterministically revoked. *(Verified in flows and memory tracker)*
- [x] **Accessibility standards**: WCAG 2.2 AA compliant markup, proper semantic headings, ARIA live regions for status announcements, and form labels. *(Verified — accessibility floor implemented)*

---

## Open Design & Implementation Items

1. **Product Name and Logo**: "Veil" is currently a placeholder name. Finalize brand identity and wordmark before production deployment.
2. **Real Proof Sample Photos & Benchmark Numbers**: Provide genuine licensed/self-shot natural-light image pairs and authentic backend PSNR/SSIM metrics for `src/content/proof.ts`.
3. **Color Sampling from Reference**: Re-sample exact hex values from reference screenshots if further optical tuning is requested.
4. **Backend Contract Confirmations**: Confirm multipart vs binary response payloads for `/api/v1/encode`, verify capacity endpoint method (`POST`), and establish the exact checksum algorithm for secret keys.

