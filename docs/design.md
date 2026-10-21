# design.md: Frontend Design Spec

**Project:** FFT-Based Secret-Key Image Steganography Platform (product name is a placeholder: **Veil**. Replace everywhere once decided.)
**Companion document:** the PRD. The PRD owns behaviour, algorithms, API and limits. This file owns how the product looks, reads and moves. If they conflict on behaviour, the PRD wins. If they conflict on appearance or copy, this file wins.
**Visual reference:** wisprflow.ai (Dictation page). The four reference screenshots define the target feel.

> **Note on the reference.** Colors below were estimated from screenshots. Before building, sample the real values from the reference with a color picker and update the tokens in Section 3 once. Everything else in this file refers to tokens, never raw hex. We replicate the _design language_ (palette logic, type pairing, shape language, spacing, restraint). We do not copy their logo, brand mark, product copy or imagery. Our own name, mark and words go in their place.

---

## 1. Design intent

### 1.1 The feeling

Calm, warm, precise. It should feel like a well-made stationery brand that happens to contain serious cryptography. Quiet confidence, lots of space, one memorable moment per screen. Nothing shouts.

### 1.2 The one big idea

Wispr's signature is **text flowing along curved paths around the hero** and a **waveform pill** that anchors the page. Our equivalent, rooted in what our product actually does:

> **A secret sentence dissolves into an image.** In the hero, a line of text drifts along a loose circular path, and as it travels it fades into soft grain and disappears into a photograph. On the platform page the same motion plays for real, once, when a message is hidden.

This is the single "crazy" moment of the site. Everything else stays quiet so this lands.

### 1.3 Anti-slop rules (the most important section)

The client's top requirement: **it must not look like AI-generated design.** These are hard rules for everyone building and reviewing.

**Never:**

- Purple/blue gradients, gradient washes, glow effects, glassmorphism blur cards, neon.
- A grid of identical rounded cards with identical soft shadows.
- Emoji as icons or decoration. Stock "shield + lock + padlock" imagery. Matrix-style green code rain. Hacker aesthetics.
- Tracked-out ALL-CAPS eyebrow above every heading. (One small caps label is allowed in the hero only, as in the reference. Nowhere else.)
- Numbered "01 / 02 / 03" markers unless the content is truly a sequence (the three-step flow is one; use it once).
- Fade-and-slide-up entrance animation on every section. Hover lift on every card.
- Stat blocks ("99.9% secure", "10k users") or fake testimonials. We have no such numbers. Do not invent any.
- Em-dash-heavy marketing copy, "Unlock the power of", "Seamless", "Revolutionary", "Elevate", "Effortless".
- Tinted near-black used as a lazy default. Black in this system is the specific warm charcoal in the tokens.
- Dummy lorem ipsum or placeholder names like "John Doe".

**Always:**

- One idea per section. Generous whitespace. Large type, short sentences.
- Real, specific copy written for this product (Section 9).
- Restraint: if an element does not help someone understand or use the product, remove it.

---

## 2. Site map

No accounts. No login. No dashboard. Three routes total.

| Route  | Purpose                                                                              |
| ------ | ------------------------------------------------------------------------------------ |
| `/`    | Landing page. Explains the idea in seconds, sells trust, sends people into the tool. |
| `/app` | The platform. One page with two modes: **Hide** (encode) and **Reveal** (decode).    |
| `*`    | 404. Minimal, on-brand, one button home.                                             |

Optional anchors on `/` (sections, not pages): `#how`, `#privacy`, `#limits`.

There is **no pricing page, no blog, no docs site, no settings page** in v1.

---

## 3. Design tokens

Use CSS variables (or Tailwind theme extension). All values below are starting estimates from the reference. Re-sample and adjust once.

### 3.1 Color

| Token             | Hex (est.) | Role                                                                                            |
| ----------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `--cream`         | `#FFFFEA`  | Page background. A pale, slightly yellow cream, lighter and more luminous than typical "beige". |
| `--paper`         | `#FFFFFF`  | Floating nav, inputs, modals, result cards.                                                     |
| `--sand`          | `#E4E3D0`  | Large feature panels (like the "Your voice stays yours" block). Muted olive-beige.              |
| `--sand-soft`     | `#F4F3E2`  | Faint decorative curved shapes behind content. Barely visible.                                  |
| `--forest`        | `#034D45`  | Announcement bar, trust badges, success states, key accents. Deep green.                        |
| `--ink`           | `#1A1A1A`  | Primary text and the dark footer/section. Warm charcoal, not pure black.                        |
| `--ink-soft`      | `#6B6A5E`  | Secondary text, captions, placeholder, the light curved text in the hero.                       |
| `--lavender`      | `#E9D5FF`  | Primary button fill, floating action button. Soft lilac.                                        |
| `--lavender-deep` | `#D4B8F7`  | Primary button hover/pressed.                                                                   |
| `--ember`         | `#F26B45`  | The single active-state marker (scroll indicator, active step). Tiny doses only.                |
| `--line`          | `#D9D8C4`  | Hairline borders on cream.                                                                      |
| `--error`         | `#B3261E`  | Error text and borders only. Never a filled red block.                                          |

**Color rules**

- Cream dominates. Forest and ink are used for weight. Lavender is the only "friendly" color and appears only on actions.
- `--ember` appears at most once per viewport and never as a fill larger than a thin bar or small dot.
- No gradients anywhere, with one exception: the soft fade-to-grain inside the hero animation (a motion effect, not a background).
- All text must meet WCAG AA contrast on its background. `--ink-soft` on `--cream` is for secondary text only, never for essential instructions.

### 3.2 Typography

Two families, clearly different, as in the reference.

| Role                 | Family                                                         | Notes                                                                                     |
| -------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Display / headings   | **EB Garamond** (fallback: Cormorant Garamond, Georgia, serif) | Light, elegant, high contrast. Weight 400-500. **Italic is a core part of the identity.** |
| UI / body            | **Figtree** (fallback: Inter, system-ui, sans-serif)           | Clean geometric sans. Weights 400, 500, 600.                                              |
| Key / monospace data | **JetBrains Mono** or IBM Plex Mono                            | Used only for the secret key, never for decoration.                                       |

Both are free (Google Fonts). Self-host with `font-display: swap`. Preload the display font used in the hero.

**Type scale (desktop)**

| Style   | Size / line-height                          | Family                                | Use                                 |
| ------- | ------------------------------------------- | ------------------------------------- | ----------------------------------- |
| Hero    | 112px / 0.95 (clamp down to 56px on mobile) | Serif, tight letter-spacing (-0.02em) | Landing hero only                   |
| H1      | 72px / 1.0                                  | Serif                                 | Platform page title, section heroes |
| H2      | 48px / 1.05                                 | Serif                                 | Section headings                    |
| H3      | 32px / 1.15                                 | Serif                                 | Panel headings, big labels          |
| Lead    | 22px / 1.5                                  | Sans 400                              | Sub-headline under hero             |
| Body    | 18px / 1.6                                  | Sans 400                              | Paragraphs (max 62ch width)         |
| UI      | 16px / 1.4                                  | Sans 500                              | Buttons, nav, inputs                |
| Caption | 14px / 1.4                                  | Sans 400                              | Helper text, metrics labels         |

**Headline pattern (from the reference):** a headline is two lines. Line one is serif upright. Line two is the **same serif in italic**, and is a complete phrase, not a single highlighted word. Example: "Hide words" / _in plain sight._ The whole second line is italic. Do not italicize just one word.

**Rules**

- Sentence case everywhere. No all-caps except the single hero label.
- Never use bold on serif headlines. Hierarchy comes from size and italic.
- Body line length under 70 characters.

### 3.3 Shape, spacing, elevation

**Radius (graduated on purpose, never one radius everywhere)**

| Token         | Value            | Use                                                             |
| ------------- | ---------------- | --------------------------------------------------------------- |
| `--r-pill`    | 999px            | Segmented toggle, waveform pill, chips                          |
| `--r-btn`     | 14px             | Buttons, inputs                                                 |
| `--r-card`    | 24px             | Result cards, dropzone                                          |
| `--r-panel`   | 40px             | Large sand feature panels                                       |
| `--r-section` | 48px top corners | The dark footer section's top edge curves up like the reference |

**Borders:** Buttons and the nav container use a **2px solid ink border**, a defining trait of the reference (lavender fill + dark outline). Cards use 1px `--line` borders instead.

**Shadows:** essentially none. Depth comes from color blocks (cream, sand, paper) and borders. The only shadow allowed is a very faint `0 1px 0 rgba(26,26,26,0.04)` under the floating nav.

**Spacing scale (px):** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160. Section vertical padding is 128px desktop, 72px mobile. Content max-width 1160px, centered. Hero text block max-width 720px.

---

## 4. Global components

### 4.1 Announcement bar

Full-width, `--forest` background, `--cream` text, 14px/500, centered, with one inline text link ending in a small chevron. Dismissible via small close button. Sample: "Nothing you upload is stored. Read how it works" linking to `#privacy`. Not sticky.

### 4.2 Floating nav (signature element)

A **white (`--paper`) rounded rectangle container** centered at the top, max-width ~1140px, 1px `--line` border, radius 20px, sitting 16px below the top and staying fixed while scrolling (it overlays content, as in the reference).

Inside, left to right:

- **Logo:** simple wordmark in sans 600 with a small custom glyph (e.g., three vertical bars of different heights becoming a block of pixels). Do not copy the reference's bars icon.
- **Segmented toggle pill** (`--sand` track, white active segment, pill radius): **Hide | Reveal**. On `/` this links into `/app` with the mode preselected. On `/app` it actually switches mode.
- Right-aligned text links: **How it works**, **Privacy**, **Limits** (anchor links on `/`; on `/app` they go to `/#how` etc.).
- Far right: **primary button** "Open the tool" (on `/app` this button is hidden).

Mobile: container shrinks to logo + toggle + a menu button; links move into a full-width sheet.

### 4.3 Buttons

| Type          | Style                                                                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primary**   | `--lavender` fill, 2px `--ink` border, `--ink` text 16/500, radius 14px, height 52px (nav: 44px), horizontal padding 24px. Hover: `--lavender-deep`. Pressed: translateY(1px). Disabled: `--sand` fill, `--ink-soft` text, border 1px `--line`. |
| **Secondary** | `--paper` fill, 2px ink border, same dimensions.                                                                                                                                                                                                |
| **Text link** | Ink, 500, underline on hover, trailing chevron icon only for "learn more" style links.                                                                                                                                                          |

No gradients, no glow, no icon-only primary buttons.

### 4.4 Floating action button (bottom-left)

A **56px circle, `--lavender` fill**, fixed at bottom-left (24px from edges) like the reference's fingerprint button. Ours holds a **key icon** and opens a small popover "Have a key? Reveal a message" that routes to `/app` in Reveal mode. On `/app` it becomes "How to share safely" (opens the sharing guidance modal, Section 7.4). Keep it subtle; no pulsing.

### 4.5 Segmented toggle (reusable)

`--sand` pill track, 4px inner padding, active segment `--paper` with 1px `--line`. Switch animation: the white segment slides (200ms, ease-out). Used for Hide/Reveal and for compare modes.

### 4.6 Sand feature panel

`--sand` background, 40px radius, 56px padding, no border, no shadow. Used for the privacy block and key reminder blocks. Content in a 3-column layout like the reference: big serif heading (two lines, second italic) on the left, paragraph and link in the middle, graphic on the right.

### 4.7 Dark footer section

`--ink` background, with a **large top-corner radius (48px+) that makes the section look like a curved sheet rising over the cream page** (visible at the bottom of reference screenshot 4). Cream text. Contains the closing call to action and minimal footer links.

### 4.8 Scroll-spy side index (landing only)

Left-edge vertical list in serif 20px with a 3px vertical bar. The active item's bar is `--ember`, its text is `--ink`; inactive items are `--ink-soft` with a `--line` bar. Used in the "How it works" section (three items, because there are truly three steps). Behavior: scrolling advances the active item and swaps the media panel (Section 5.3).

### 4.9 Toasts and inline messages

Small `--paper` pill with 1px border, appearing bottom-center for 3 seconds: "Key copied", "Downloaded". Errors are inline beside the problem, not toasts.

---

## 5. Page 1: Landing (`/`)

Goal: in under 10 seconds the visitor understands the idea, trusts it, and clicks into the tool. No scrolling needed to understand; scrolling is to build confidence.

### 5.1 Hero

Layout: centered column on `--cream`. From top: announcement bar, floating nav, generous space, then:

1. Small caps label (the only one on the site): `HIDE MESSAGES IN IMAGES`, 14px, letter-spacing 0.12em, `--ink-soft`.
2. **Headline** (hero size, centered): "Hide words" / _in plain sight._
3. Lead: "Put a secret message inside any photo. Only someone with your key can read it." (max 2 lines, centered, 22px.)
4. Primary button: **Open the tool** (links to `/app`).
5. Small caption under button: "No account. Nothing is stored." in `--ink-soft`.

**Hero signature animation (the memorable moment):**

- Around the hero text, a **loose circular path** (like reference screenshots 1 and 2) carries a ring of light-gray (`--ink-soft` at ~45%) text in 18px sans. The ring slowly rotates (one turn per ~90s, linear). The ring's text is a plausible secret message in several short fragments, for example: "meet at the north gate at six, come alone, bring the blue folder". Fragments are drawn on an SVG `textPath`.
- On the right side, a long ribbon of text sweeps in from the edge in **dark ink on a tilted band**, ending in a **waveform-style pill** (as in reference 2). In our version, the pill is a **small pixel-grid glyph** (a 6x4 grid of tiny squares, some lit) that pulses gently. The text on the ribbon travels left toward the pill and **dissolves into grain as it touches it**, then the pill holds for a moment, then the ribbon repeats with a new message. One loop is ~8 seconds.
- A faint photograph is **not** shown in the hero. The "disappearing into an image" idea is told through the grain dissolve at the pill. Keep it abstract.
- Reduced motion: show a static frame (ring text fixed, ribbon fully visible, pill still).

Performance: the animation is SVG + CSS transforms only, GPU-friendly, no canvas libraries. It must hit 60fps on a mid-range phone, otherwise degrade to the static frame.

### 5.2 Availability line

Under the hero: `Works in any browser. Your files never leave your control.` (14px, `--ink-soft`). Replaces the reference's "Available on Mac, Windows..." line. Do not claim platforms we do not support.

### 5.3 How it works (scroll-spy section)

Three items, because the product really is three steps, so a numbered/sequenced treatment is justified here. Left side: the scroll-spy index (4.8) with these labels in serif: **Choose a photo**, **Share the image**, **Share the key separately**. Center: a tall rounded media panel (radius 24px, 500x580px) showing an illustration/animation per step. Right: serif H3 plus a short paragraph.

| Step                     | Panel content                                                                                                                     | Text                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Choose a photo           | A photo with a text box overlaid (like the reference's compose box). Typing a message into the box, then it flies into the photo. | "Pick any image and type your message. Veil hides it in the picture and gives you a key."     |
| Share the image          | A messaging-like thread showing a photo posted to several people; only one avatar has a small key icon.                           | "Send the image to anyone. To everyone else it is just a photo."                              |
| Share the key separately | Key card moving along a different path than the photo.                                                                            | "Give the key to your friend another way. With the image and the key, they can read it here." |

The panel visuals use **real product UI components** (the actual dropzone, key card), not stock imagery or 3D renders.

Transitions: the media panel crossfades (300ms). No parallax.

### 5.4 Before/after proof

Full-width section on cream. Heading (H2): "Look closely." / _You can't tell._
A **comparison slider** component (Section 7.5) between an original photo and the hidden-message version, with a toggle chip "Show the difference" that reveals the pixel difference amplified 50x as a faint noise map (to honestly show that something changed, and how little). Below it, three small honest figures drawn from real measurements of the shipped build (PSNR, SSIM, bytes hidden). **These are populated only from actual benchmark output, never invented.** If numbers are not yet available, hide this strip.

### 5.5 Privacy panel (`#privacy`)

Sand panel in the reference's three-column layout:

- Left (serif, two lines): "Your message" / _stays yours._
- Middle paragraph: "Images, messages and keys are processed in memory and deleted the moment you get your result. We don't keep them, and we can't recover a lost key."
- Link: "Read what we do and don't promise" (jumps to `#limits`).
- Right: **three circular outlined badges** (forest 1.5px stroke, like the reference's HIPAA/SOC badges) but with true claims only: **AES-256**, **No storage**, **Open method**. Do not show compliance certificates we do not hold. Do not copy HIPAA/SOC/ISO badges.

### 5.6 Limits, said plainly (`#limits`)

A short, honest section. This builds trust and prevents support problems. Heading (H2): "What to know" / _before you share._
Two-column list of four short statements, no icons:

1. Send the image as a **file or document**. Apps that shrink or recompress photos (WhatsApp, Instagram, screenshots) can destroy the message.
2. Lose the key and the message is gone. There is no recovery.
3. The key and the image should travel separately.
4. Hiding keeps a message unseen; strong encryption keeps it unreadable. Veil does both, but no tool can promise it is undetectable to an expert.

### 5.7 Closing section (dark)

The `--ink` curved section (4.7). Centered cream serif H2: "Try it with a photo" / _and a sentence._ Primary button (lavender, stays lavender on dark): **Open the tool**. Footer links below: How it works, Privacy, Limits. Copyright line. Nothing else.

---

## 6. Page 2: Platform (`/app`)

**Principle:** one page, one card, zero navigation maze. The same layout serves both modes. The tool should feel as calm as the landing page, like writing a note.

### 6.1 Page frame

- Same announcement bar (optional) and floating nav. The segmented toggle is live (Hide | Reveal), its state mirrored in the URL (`/app?mode=hide` or `reveal`) so links work.
- Below nav: centered H1 in serif, mode-specific:
  - Hide: "Hide a message" / _in a photo._
  - Reveal: "Reveal a message" / _with a key._
- Below: one-sentence lead (Lead style), mode-specific (copy in Section 9).
- Main card: `--paper`, 1px `--line` border, 24px radius, 40px padding, max-width 760px, centered, stacked vertically. No sidebar.
- Faint `--sand-soft` curved shapes sit behind the card at large screens (decorative, like reference 3).

### 6.2 Hide mode: states

The mode is a single flow with four visual states in one card. Steps are shown as a quiet stacked sequence inside the card, never as a wizard with "Next" screens.

**State A: Empty**

1. **Dropzone** (24px radius, 2px dashed `--line` border, `--cream` fill, 280px high). Center text: "Drop a photo here" / "or choose a file" (link). Caption: "PNG, JPG or BMP. Up to 10 MB." Accepts click, drag, and paste.
2. **Message field** (textarea) below, disabled until an image is added, placeholder "Type the message you want to hide."
3. Primary button **Hide message**, disabled until both fields are valid.

**State B: Image loaded**

- The dropzone becomes an **image preview** (cover-fit, 24px radius) with a small "Change photo" text button.
- A **capacity meter** appears under the message field: a thin 6px pill bar, `--forest` fill, with caption "182 of 412 bytes used". It updates live as the user types. When over capacity, the bar turns `--error` and the caption becomes "Too long by 36 bytes. Shorten it or choose a larger photo." The primary button stays disabled.
- Image requirements shown inline in `--ink-soft` if violated (too small, too big, unsupported type) with exact guidance, e.g., "This photo is 96 x 96. Use one at least 128 x 128."

**State C: Hiding (processing)**

- The primary button becomes a **progress pill** (same shape as the waveform pill in the hero) with a looping pixel-grid animation and text "Hiding your message".
- **Signature moment:** the typed message text lifts from the textarea, travels along a curved path over the image preview, and dissolves into grain into the photo (1.2s, ease-in-out). This plays once, tied to the real request: it starts on submit and the final dissolve lands when the response arrives. If the response is faster than the animation, finish the animation; if slower, loop a gentle shimmer on the pill.
- The page must not freeze: if the request takes more than 6 seconds, show "Large photos take a little longer".

**State D: Result**
The card content smoothly reorganizes (height transition 300ms) into the result:

1. **Comparison slider** (7.5): Original vs Hidden version, with the "Show the difference" chip.
2. **Key card** (7.2): the most important element. Large, impossible to miss, separated from the image.
3. **Download button** (primary): "Download image" (PNG). Secondary: "Hide another".
4. **Metrics row** (caption size, three inline items): "Quality 46.2 dB", "Similarity 0.994", "Used 182 of 412 bytes". Tooltips explain in plain words: "Higher means less change to the photo." Values come straight from the API.
5. **Sharing guidance** inline note (sand, small): "Send this image as a file, not a photo. The key goes in a different message." with a "Why?" link opening the sharing modal (7.4).

Leaving guard: if the user tries to leave, close the tab, or press "Hide another" before copying/downloading, show a confirm dialog: "You haven't saved your key. Without it, this message can't be read." Buttons: "Go back" (primary) / "Leave anyway" (text). Show the guard only until the key has been copied or the key-saved checkbox is ticked.

### 6.3 Reveal mode: states

**State A: Empty**

1. Dropzone as in Hide mode, text "Drop the image you received".
2. **Key field**: a single-line input, mono font, placeholder `XXXX-XXXX-XXXX-XXXX-...`, with a paste button inside the right edge. Auto-formats as the user types (hyphen groups, uppercase), tolerant of spaces and lowercase. Live validation:
   - Valid checksum: small `--forest` check mark.
   - Malformed: inline error "That key doesn't look right. Check for a typo." (this is a distinct error by design, per PRD D-2).
3. Primary button **Reveal message**, disabled until an image is chosen and the key is syntactically valid.

**State B: Revealing (processing)**
Same progress pill with "Looking for your message". No fake percent progress.

**State C: Success**

- The message appears in a `--paper` card inset with a **typewriter-style reveal** (text types out character by character over ~1.2s, then settles; instant if reduced motion). Serif 28px for short messages, auto-shrinking to 18px sans for long ones.
- Buttons: **Copy message** (primary), **Reveal another** (secondary).
- Caption: "This message was decrypted in your session and is not stored."

**State D: Failure (generic by design)**
One message for every failure cause, as the PRD requires: heading (serif H3): "Nothing to reveal." Body: "The key may be wrong, or the image may have been resized, compressed or edited since the message was hidden. Check both and try again." Buttons: "Try again" (primary), "Read the sharing tips" (text link to the sharing modal). Do not reveal which cause it was. No red full-bleed alert; use `--error` text for the heading's small icon and border only.

### 6.4 Empty and edge states

- **Rate limited (429):** "That's a lot of tries. Wait a minute and try again." with a visible countdown.
- **Server error:** "Something went wrong on our side. Your files weren't saved. Try again." One retry button.
- **Offline:** inline banner at the top of the card, `--sand`, "You're offline."
- **File too big / wrong type:** error under the dropzone, not a toast.

---

## 7. Page-specific components

### 7.1 Dropzone

- Idle: dashed border. Drag-over: border becomes solid 2px `--forest`, fill `--sand-soft`, text "Drop to add".
- On add: instant preview, filename + dimensions + size as a caption.
- Keyboard accessible (focusable, Enter/Space opens file dialog). Supports paste from clipboard.

### 7.2 Key card (most important UI element)

- A `--sand` rounded (24px) block under the comparison slider, visually separated (32px gap) so it does not read as part of the image.
- Heading (serif H3): "Your key" / _keep it safe._
- The key in **mono 22px**, in **groups of four with hyphens**, wrapped to 2-3 lines, with generous letter-spacing, inside a white 14px-radius field with a 1px border. Selectable with one click.
- Buttons: **Copy key** (secondary; on success text changes to "Copied" for 2 seconds), **Download as text** (text link).
- A single checkbox row below: "I've saved my key." Ticking it removes the leave-guard.
- Warning line in `--ink-soft`, 14px: "We don't store this key. If you lose it, the message can't be recovered."
- The key is never placed in the URL, never logged, never persisted in localStorage or cookies.

### 7.3 Capacity meter

Spec in 6.2 B. Role: `progressbar` with accessible text. Updates debounced 150ms. Capacity comes from the API (`/capacity`) after the image loads; show a skeleton line until then.

### 7.4 Sharing modal

Opened from "Why?" links and the FAB. Centered `--paper` dialog, 24px radius, max-width 520px, scrim `rgba(26,26,26,0.4)`, closes on Esc and click-outside. Content (serif H3 "Share it the safe way"), three short bullet-free paragraphs:

- "Send the image as a file or document, not as a photo."
- "Send the key in a different message or channel."
- "Don't resize, screenshot or filter the image."
  Close button text: "Got it".

### 7.5 Comparison slider

- Two stacked images with a vertical draggable handle (a 44px white circle with a 2px ink border and a small double-arrow glyph). Keyboard: left/right arrow keys move the handle.
- Labels bottom corners: "Original" and "With message" in small `--paper` pills.
- Chip below: **Show the difference** toggles a difference map (amplified 50x, shown in grayscale), with caption "Differences amplified 50x so you can see them."
- Image rendering must preserve the full-resolution output; do not re-encode on the client.

### 7.6 Progress pill

The hero's waveform-style pill, reused: 56px high, pill radius, 2px ink border, white fill, containing a looping pixel-grid animation (6 x 4 squares changing opacity in a pseudo-random wave) and a text label.

---

## 8. Motion system

**Philosophy:** motion explains what is happening. Not decoration. Only two attention-grabbing moves exist, both on purpose: the hero ribbon and the hide-message dissolve. Everything else is functional.

| Interaction                             | Spec                                                                  |
| --------------------------------------- | --------------------------------------------------------------------- |
| Hover on buttons                        | Background color change only, 120ms                                   |
| Press                                   | 1px downward translate, 80ms                                          |
| Mode toggle                             | Sliding active segment, 200ms ease-out; card content crossfades 180ms |
| Card height changes                     | 300ms ease-in-out                                                     |
| Modal open                              | Opacity + scale from 0.98, 180ms                                      |
| Slider handle                           | Direct manipulation, no easing                                        |
| Toasts                                  | Fade in/out 150ms                                                     |
| Section entrances                       | **None**, with one exception: the "How it works" panel crossfade      |
| Page transitions between `/` and `/app` | A quick 200ms cross-fade only                                         |

**Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for entrances, `ease-in-out` for state changes.
**Reduced motion:** `prefers-reduced-motion: reduce` disables the ring rotation, ribbon, dissolve, typewriter and pill animation; transitions become instant or simple opacity fades. This is required, not optional.

---

## 9. Voice and copy

**Voice:** plain, warm, confident, specific. Short sentences. Active verbs. Sentence case. No jargon on the surface (users hide a message with a key; they do not "encode with AES-GCM"). Technical detail appears only in an optional "How it works" expandable section for curious users (see 9.4).

**Consistent vocabulary** (same word everywhere, never synonyms):

- **Hide** a message (not encode, embed, encrypt).
- **Reveal** a message (not decode, extract, decrypt).
- **Key** (not password, secret, token).
- **Photo / image:** use "photo" in marketing, "image" in functional UI. Pick one per context and hold it.
- Button names stay stable through a flow: "Hide message" produces "Message hidden", "Reveal message" produces "Message revealed".

### 9.1 Landing copy (draft)

- Hero: "Hide words in plain sight."
- Lead: "Put a secret message inside any photo. Only someone with your key can read it."
- CTA: "Open the tool"
- Privacy panel heading: "Your message stays yours."
- Closing: "Try it with a photo and a sentence."

### 9.2 Platform microcopy (draft)

| Where                | Copy                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Hide lead            | "Choose a photo, type your message, and get back a photo that looks the same, plus a key."           |
| Reveal lead          | "Add the image you received and the key you were given."                                             |
| Textarea placeholder | "Type the message you want to hide."                                                                 |
| Button               | "Hide message" / "Reveal message"                                                                    |
| Success (hide)       | "Message hidden."                                                                                    |
| Key warning          | "We don't store this key. If you lose it, the message can't be recovered."                           |
| Over capacity        | "Too long by 36 bytes. Shorten it or choose a larger photo."                                         |
| Malformed key        | "That key doesn't look right. Check for a typo."                                                     |
| Generic failure      | "Nothing to reveal. The key may be wrong, or the image may have been resized, compressed or edited." |
| Image too small      | "This photo is 96 x 96. Use one at least 128 x 128."                                                 |
| File too big         | "That file is 14 MB. The limit is 10 MB."                                                            |

Errors never apologize and never blame; they state what happened and what to do.

### 9.3 Things we never say

"Military-grade", "unbreakable", "100% undetectable", "invisible", "zero distortion", "impossible to crack." The PRD forbids these claims, and so does the interface.

### 9.4 "How it works" detail (optional expandable on `/`)

A small text link under the how-it-works section: "See how it works in detail". Expands inline into short, plain paragraphs: a hidden message is encrypted with your key, then tucked into tiny frequency patterns of the photo's brightness that the eye doesn't notice; the key decides where. Keep to ~120 words. No equations in UI.

---

## 10. Responsive behavior

| Breakpoint    | Rules                                                                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| >= 1280px     | Full layout as specified.                                                                                                                                                                                                                                                                                                                           |
| 768 to 1279px | Content max-width 92%; hero type clamps to 80px; the three-column privacy panel becomes two columns, badges below.                                                                                                                                                                                                                                  |
| < 768px       | Single column. Hero 56px. Nav collapses (logo, toggle, menu). FAB stays. Hero ribbon becomes a smaller, slower loop; ring text hidden if it hurts legibility. Card padding 20px. Buttons become full-width. Slider and key card remain full width. Scroll-spy index becomes a simple stacked list with all three steps visible, no sticky behavior. |

Touch targets are at least 44px. No hover-only functionality. Test at 360px width.

---

## 11. Accessibility (quality floor)

- WCAG 2.2 AA minimum. Visible keyboard focus: a 2px `--forest` outline offset 3px on every interactive element (do not remove outlines).
- All images have meaningful alt text. Result images: "Your image with the message hidden" (never imply the message is visible).
- The key field and key card are screen-reader friendly: the key is announced character-grouped, and the copy button announces "Key copied".
- Progress and result states announce via `aria-live="polite"`. Errors via `role="alert"`.
- The comparison slider is operable by keyboard and has an accessible name and value text.
- Never convey state by color alone (always pair with text or an icon).
- Respect `prefers-reduced-motion` and `prefers-color-scheme`... but note: **dark mode is not in v1**. The site is cream-only; do not build a dark theme now.

---

## 12. Front-end technical guidance

**Stack suggestion** (builder may adjust, but keep the visuals identical):

- React + Vite (or Next.js if SEO for the landing page is wanted), TypeScript.
- Tailwind CSS with the tokens in Section 3 mapped into the theme, or plain CSS variables. Never hard-code hex in components.
- Routing: React Router (`/`, `/app`, 404).
- Animation: CSS + SVG for the hero and pill; a small library (Framer Motion) is acceptable only for the modal, mode crossfade and dissolve choreography.
- Icons: a single consistent line-icon set (Lucide), 1.5px stroke, used sparingly. No emoji.

**API integration** (see PRD Section 14.3):

- `POST /api/v1/encode` with multipart (`image`, `message`). Handle response format per final backend decision.
- `POST /api/v1/decode` with multipart (`image`, `key`). The key goes in the request body only, never in the URL.
- `GET /api/v1/capacity` (optional) for the live capacity meter.
- Map status codes to UI states exactly as listed in 6.4 and PRD errors: 400 invalid file or malformed key, 413 file too large, 422 over capacity (encode) or generic failure (decode), 429 rate limited.

**Client-side rules**

- Do not persist images, messages or keys (no localStorage, sessionStorage, cookies, IndexedDB, service worker caches).
- Do not log sensitive values to the console or analytics. Use no third-party analytics that sees inputs. If analytics are added, use privacy-friendly, cookieless page-view counting only, and never capture form values.
- Revoke object URLs after use. Clear state on "Hide another" / "Reveal another".
- Validate files client-side (type, size, dimensions) for fast feedback, but treat the server as authoritative.
- The downloaded file name: `<original-name>-veil.png`. Preserve exact bytes returned by the API. Never process through canvas (canvas re-encoding can alter pixels and destroy the hidden message).

**Performance targets:** Landing LCP under 2.0s on a mid-range phone on 4G; hero animation at 60fps or degraded to static; JS bundle for `/` under 150 KB gzipped; fonts subset to Latin.

---

## 13. Asset list for the builder

- Logo wordmark and glyph (original, SVG).
- Favicon: the pixel-grid glyph on `--lavender`.
- Open Graph image: cream background, hero headline in serif, pill glyph.
- Four illustrations for "How it works" panels (built from real UI components).
- One sample photograph pair (original + hidden) for the proof section: a warm, natural-light photo with medium texture, **licensed or self-shot, not AI-generated**. Generate the hidden version with the real encoder so the slider is truthful.
- Fonts: EB Garamond (400, 400 italic, 500), Figtree (400, 500, 600), JetBrains Mono (400).

---

## 14. Acceptance checklist (use before shipping)

**Look**

- [ ] Side by side with the reference, the palette, type pairing, floating nav, 2px-bordered lavender buttons, sand panels and curved dark footer clearly belong to the same family.
- [ ] Every headline uses serif upright line + full serif italic line. No single-word accents.
- [ ] No gradients, no stock imagery, no emoji, no identical-card grids.
- [ ] No fabricated numbers, certifications or testimonials.
- [ ] Squint test: one focal point per screen.

**Behavior**

- [ ] Hide flow works from empty to download with the key shown once and the leave-guard working.
- [ ] Reveal flow works, malformed key and generic failure states are distinct and correct.
- [ ] Mode toggle state is reflected in the URL and survives refresh (without persisting any user data).
- [ ] Capacity meter matches API capacity; over-capacity disables the button.
- [ ] Downloaded PNG round-trips through Reveal with zero loss.

**Quality**

- [ ] Keyboard-only walkthrough of both flows succeeds. Focus is visible.
- [ ] Reduced motion fully respected.
- [ ] 360px width layout has no horizontal scroll.
- [ ] No sensitive data in console, network URLs, storage or analytics.
- [ ] Lighthouse accessibility score 95+.

---

## 15. Open design questions

1. **Product name and logo.** "Veil" is a placeholder. Needed before the OG image and wordmark are final.
2. **Landing hero ring text.** Confirm that the sample fragments are acceptable as the visible "secret" text in the hero.
3. **Proof strip numbers.** Show PSNR/SSIM on the landing page only after real benchmarks exist (PRD M2).
4. **Server vs client processing.** If processing moves into the browser (PRD open question 1), the privacy panel copy and the "No storage" badge wording must be revisited.
5. **Mobile ring text.** Decide after testing whether the hero ring stays on small screens.
