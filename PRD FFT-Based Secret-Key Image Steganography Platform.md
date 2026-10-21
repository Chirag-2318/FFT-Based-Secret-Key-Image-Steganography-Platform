# PRD: FFT-Based Secret-Key Image Steganography Platform

**Document type:** Product Requirements Document (single source of truth) **Version:** 1.0 (draft) **Scope:** Product, algorithm, cryptography, backend/API, testing, delivery. *Frontend and UI/UX design are intentionally excluded and will be specified in a separate document.*

---

## 1. Overview

### 1.1 One-line summary

A platform where a user uploads an ordinary image and a secret message, and receives back (1) a visually identical **stego image** and (2) a **secret key**. Anyone holding only the image sees nothing. Anyone holding the image **and** the key can return to the platform and recover the message.

### 1.2 Core promise

- The stego image looks the same as the original.
- The image alone reveals nothing readable, even to a determined person who has it.
- Only the exact key recovers the message.
- Recovery with the right key and an unmodified image is exact (0 bit errors).

### 1.3 What we do NOT promise

To stay honest and technically defensible:

- **Zero distortion is impossible.** Any embedding changes pixels slightly. We target changes that are not visible and are measurably small (PSNR, SSIM).
- **Hiding is not the same as encrypting.** Steganography conceals that a message exists; encryption protects what it says. We use both.
- **Lossy re-encoding can destroy the message.** Sending the stego image through apps that recompress or resize (WhatsApp, Instagram, email image previews, screenshots) may make the message unrecoverable. This is a primary product limitation, see Section 12.
- **Resistance to a dedicated steganalysis expert is not guaranteed.** We aim for casual and automated-eye invisibility, not state-level forensic resistance.

---

## 2. Problem statement

People want to pass short private information to specific people over untrusted channels, without the channel (or bystanders who see the file) learning the content or even suspecting it exists. Plain encrypted messages look suspicious and attract attention. An ordinary-looking photo does not.

## 3. Goals and non-goals

### 3.1 Goals

1. Encode a text message into an image; return stego image + key.
2. Decode a message from a stego image + key.
3. Visual imperceptibility, quantified by PSNR and SSIM.
4. Exact recovery on lossless (PNG) round trips.
5. A wrong key or a tampered image must fail cleanly and reveal nothing.
6. The platform stores nothing sensitive (no images, keys, or messages retained).
7. Reproducible, measurable experiments (a benchmarking harness is part of the product, not an afterthought).

### 3.2 Non-goals (v1)

- User accounts, login, history, or sharing features.
- Video, audio, or document steganography.
- Guaranteed survival through social-media compression.
- Chat or messaging inside the platform.
- Key escrow or key recovery. **A lost key means a lost message, by design.**
- Frontend/design decisions (covered separately).

### 3.3 Stretch goals (post-v1)

- Adaptive, texture-aware embedding (research contribution; see Section 15).
- Compression-robust mode (JPEG-aware embedding).
- Binary file payloads (not only text).
- Optional user-chosen passphrase mode in addition to generated keys.
- Batch/API access for developers.

---

## 4. Users and use cases

| Persona | Need |
| --- | --- |
| **Sender** | Hide a short message in a photo and get a key to share separately. |
| **Receiver** | Take an image and a key and read the message. |
| **Bystander / interceptor** | Has the image only. Must learn nothing. |
| **Developer/researcher (internal)** | Run experiments on capacity, quality, and robustness. |

**Primary scenario:** Alice uploads `holiday.png` and types "Meet at 6, north gate." She receives `holiday_stego.png` and a key. She posts or sends the image to ten people; sends the key privately to Bob. Bob uploads the image and key and reads the message. The other nine see a normal photo.

---

## 5. End-to-end product flow

### 5.1 Encode flow

1. User provides: cover image + secret message.
2. Platform validates the image and message (format, size, capacity).
3. Platform generates a random secret key.
4. Platform encrypts and error-protects the message, embeds it in the image's frequency domain, and rebuilds the image.
5. Platform returns: **stego image (PNG)** + **key (string)** + a quality report (PSNR, SSIM, capacity used).
6. Platform discards the image, message, and key from memory/disk after the response.

### 5.2 Decode flow

1. User provides: stego image + key.
2. Platform validates the key format and the image.
3. Platform regenerates the keyed embedding pattern, extracts bits, corrects errors, verifies authenticity, and decrypts.
4. On success, returns the message. On failure, returns a single generic failure (Section 9.4).
5. Everything is discarded after the response.

---

## 6. Functional requirements

Priority: **P0** = required for v1, **P1** = should have, **P2** = stretch.

### 6.1 Encode

| ID | Requirement | Priority |
| --- | --- | --- |
| E-1 | Accept PNG, JPEG, and BMP covers; always output **PNG**. | P0 |
| E-2 | Accept UTF-8 text messages. Define a max length based on image capacity. | P0 |
| E-3 | Preserve original image dimensions exactly. | P0 |
| E-4 | Generate a cryptographically secure random key per request. | P0 |
| E-5 | Return the key once, in a copy-friendly string format with a built-in checksum. | P0 |
| E-6 | Reject requests that exceed capacity with a clear error stating max capacity. | P0 |
| E-7 | Return PSNR, SSIM, and bits-per-pixel with every encode. | P1 |
| E-8 | Run a **self-check**: decode the produced stego image internally and confirm exact recovery before returning it. If it fails, retry with adjusted parameters or return an error. | P0 |
| E-9 | Handle grayscale and RGBA inputs (alpha channel preserved untouched). | P1 |
| E-10 | Binary file payloads. | P2 |

### 6.2 Decode

| ID | Requirement | Priority |
| --- | --- | --- |
| D-1 | Accept stego PNG + key; return the exact original message. | P0 |
| D-2 | Validate key format and checksum before any heavy processing; give a distinct "malformed key" error (this reveals nothing about the image). | P0 |
| D-3 | Wrong key, wrong image, or modified image all return the **same** generic failure. | P0 |
| D-4 | Decode must never return partial or unauthenticated plaintext. | P0 |
| D-5 | Never read or alter the image through lossy conversion, resizing, or colour management. | P0 |

### 6.3 Data handling

| ID | Requirement | Priority |
| --- | --- | --- |
| H-1 | No persistence of images, messages, or keys. Processing is in-memory and request-scoped. | P0 |
| H-2 | No logging of message content, keys, or image bytes. Logs may contain only request IDs, sizes, durations, and error codes. | P0 |
| H-3 | Keys are never sent in URLs or query strings (request body only). | P0 |
| H-4 | Enforce HTTPS in all deployed environments. | P0 |
| H-5 | Rate limiting on both endpoints to deter brute-force key guessing. | P1 |

---

## 7. Key design

### 7.1 Decision: platform-generated key

The user asked that the platform returns "an encryption key". We therefore generate a **256-bit random master key** with a CSPRNG for every encode request. This is stronger than user-chosen passphrases, which are guessable and require slow key stretching.

### 7.2 Key format (user-facing)

- 256 bits of key material + a short checksum, encoded as **Base32** (no ambiguous characters), displayed in groups, e.g. `ABCD-EFGH-IJKL-...`.
- The checksum catches typos so users get "invalid key" instead of a silent decode failure.
- Parsing must be tolerant of case, spaces, and hyphens.

### 7.3 Subkey derivation

Use **HKDF-SHA256** from the master key to derive independent subkeys with distinct context labels:

| Subkey | Purpose |
| --- | --- |
| `K_enc` | AES-256-GCM encryption key |
| `K_pos` | Seed for the keyed coefficient/position selection (CSPRNG) |
| `K_meta` | Reserved for header protection / future use |

Never reuse one key for multiple purposes.

### 7.4 Key properties and risks

- The key is the **only** way to decode. No recovery exists.
- Anyone who gets image + key can decode. Users must share the key over a different channel from the image.
- If the product later adds a user-chosen passphrase mode, derive keys with **Argon2id** (or scrypt) with a per-message salt, and warn users about passphrase strength.

---

## 8. Cryptography specification

### 8.1 Primitives

- **Encryption:** AES-256-GCM (authenticated encryption).
- **Nonce:** 96-bit, random, unique per message; stored in the payload header (nonce is not secret).
- **KDF:** HKDF-SHA256.
- **RNG:** OS CSPRNG (`secrets` / `os.urandom`). No `random` module anywhere in security-relevant code.
- **Library:** a vetted library (e.g. Python `cryptography`). No custom crypto.

### 8.2 Payload layout (before error-correction)

| Field | Size | Notes |
| --- | --- | --- |
| Version | 1 byte | Format version for future compatibility |
| Length | 2-4 bytes | Ciphertext length |
| Nonce | 12 bytes | Random |
| Ciphertext | variable | AES-GCM output |
| GCM tag | 16 bytes | Authentication |

Header fields (version, length, nonce) are passed as **associated data (AAD)** so tampering with them fails authentication.

**No magic bytes or fixed recognisable signature.** A constant marker would make stego images detectable. The only validity test is successful authentication under the correct key.

### 8.3 Error-correcting code

- **Reed-Solomon** over the full payload, with parity configurable (starting point: RS(255, 223)-style, about 12% overhead; tune experimentally).
- The header is fixed-size and protected more strongly (higher parity and/or repetition) because losing it loses everything.
- Order of operations: **encrypt first, then apply ECC** (ECC corrects bit errors in the ciphertext; GCM then verifies integrity).

### 8.4 Security properties

- Confidentiality: without `K_enc`, ciphertext is indistinguishable from random.
- Integrity: a wrong key or modified payload fails the GCM tag; the failure is never partial.
- Location secrecy: without `K_pos`, an attacker does not know which coefficients carry data.
- Statistical detectability is addressed separately in Section 10 and 13.

---

## 9. Steganography (FFT) specification

### 9.1 Design principle

**FFT decides where and how bits are embedded. Encryption protects what the message says. The key controls access.**

### 9.2 Embedding pipeline

1. **Load cover** as RGB without colour-profile or gamma alteration.
2. **Convert to YCbCr**; embed only in the **Y (luminance)** channel. Chroma stays untouched.
3. **Block split:** non-overlapping 8x8 blocks (configurable to 16x16). Pad edges by reflection if needed; keep a record of the original size.
4. **Block FFT:** 2D DFT per block.
5. **Candidate coefficients:** mid-frequency band only. Exclude DC and the highest frequencies. Candidate band is a tunable parameter.
6. **Keyed selection:** use a CSPRNG seeded by `K_pos` to choose, for every bit, a block and a coefficient pair `(u1,v1)`, `(u2,v2)`. Selected pairs must be:
   - inside the allowed band,
   - non-overlapping with pairs used for other bits,
   - of sufficient local energy (texture-aware thresholding that is itself recomputable at extraction),
   - handled with **conjugate symmetry** so the inverse FFT is real-valued.
7. **Differential QIM embedding:** define `d = |F(u1,v1)| - |F(u2,v2)|`. Quantize `d` with step `Δ` so that its quantization class encodes the bit (0 or 1). Make the smallest change that reaches the correct class.
8. **Restore symmetry**, apply **inverse FFT**, convert back to RGB, **round and clip** to 0-255, save as **PNG**.
9. **Verify** by running the full extraction (self-check, E-8). Rounding and clipping affect coefficients; the algorithm must tolerate or compensate for this (iterative re-embedding for blocks that fail is permitted).

### 9.3 Extraction pipeline

1. Load PNG with no resizing or colour conversion beyond RGB-to-YCbCr.
2. Rebuild the block grid and keyed selection from `K_pos`.
3. Block FFT; compute `d` per selected pair; decide bit by quantization class.
4. Reed-Solomon decode, then AES-GCM verify and decrypt.

### 9.4 Failure behaviour

One generic message for every decode failure: wrong key, wrong image, tampered image, or recompressed image. The system must not reveal which one. Timing differences between failure paths should be minimised.

### 9.5 Tunable parameters (experiment, do not hardcode)

- Block size (8 or 16)
- Frequency band
- Quantization step `Δ`
- Bits per block
- ECC parity level
- Energy threshold for coefficient eligibility

All parameters must live in one versioned config; the version ID goes into the payload header so decoders know what was used.

### 9.6 Capacity (planning figures)

With 8x8 blocks and 1 usable bit per block, a 512x512 image has 4,096 blocks, giving about 4,096 raw bits (512 bytes). After header (\~20 bytes), GCM tag (16 bytes), and \~12% ECC, roughly **400 bytes** of message remain. Larger images and more bits per block raise this, at a cost to imperceptibility. Exact capacity is determined empirically. Capacity should be computed and returned per image before encoding.

---

## 10. Quality and security targets

These are **experimental targets**, not guarantees.

| Metric | Target |
| --- | --- |
| PSNR (cover vs stego) | >= 40 dB |
| SSIM | >= 0.99 |
| BER on clean PNG round trip | 0 |
| Exact message recovery, clean PNG | 100% |
| Wrong-key success rate | 0% (never returns plaintext) |
| Capacity | Reported in bytes and bits-per-pixel per image |
| Encode time (1080p-class image) | Target under 5 s (to be benchmarked) |
| Decode time | Target under 3 s (to be benchmarked) |

Report PSNR and SSIM **together with** capacity and recovery rate; a high PSNR at tiny payloads is not a meaningful claim.

---

## 11. Robustness test matrix

Baseline is lossless PNG. Everything else is measured and reported, not assumed.

| Test | Expected in v1 |
| --- | --- |
| PNG save/load cycles | Must pass (P0) |
| Gaussian noise (low) | Measure; ECC should absorb mild noise |
| Mild blur | Measure |
| JPEG at quality 95 / 85 / 75 | Measure; likely partial or total loss |
| Resize / crop | Expected to fail in v1; document it |
| Screenshot | Expected to fail in v1 |
| Wrong key | Must fail cleanly |
| Modified payload bits | Must fail authentication |
| Different image, same key | Must fail cleanly |

Results go into a regression report generated by the benchmark harness on every release.

---

## 12. Known limitations (must be visible to users and stakeholders)

1. **Do not send the stego image through apps that recompress it.** Share as a file/document or via a lossless channel. This is the biggest practical limitation; the product must communicate it clearly (wording to be handled in the design phase).
2. Resize, crop, rotation, and screenshots will likely destroy the message in v1.
3. Statistical steganalysis by a specialist may detect embedding, especially at high payloads. Keep payloads small relative to capacity.
4. If image and key travel together, security collapses. The key must go through a separate channel.
5. Lost key means lost message.
6. The platform operator briefly sees the plaintext and key in memory during processing (server-side processing). A future client-side (in-browser/WASM) mode would remove that trust requirement. See open questions.

---

## 13. Threat model

| Adversary | Capability | Our defence |
| --- | --- | --- |
| Casual viewer with the image | Looks at it | Imperceptible embedding (PSNR/SSIM targets) |
| Recipient without key | Runs extraction guesses | AES-256-GCM; 256-bit key; generic failure; rate limiting |
| Key guesser | Brute force through the platform | 256-bit key space; rate limits; no oracle feedback |
| Network eavesdropper | Observes traffic | HTTPS only; no keys in URLs |
| Tamperer | Alters the image or payload | GCM authentication; no partial output |
| Steganalysis tool | Statistical detection | Low payload ratio; keyed coefficient selection; texture-aware embedding; honest non-guarantee |
| Compromised server / operator | Reads memory or logs | No persistence, no sensitive logging; documented limitation; client-side mode as future work |

**Out of scope:** nation-state forensics, coercion, endpoint compromise on user devices.

---

## 14. System architecture (non-UI)

### 14.1 Components

1. **API service**: handles requests, validation, rate limiting, request IDs.
2. **Crypto module**: key generation, HKDF, AES-GCM, key formatting/parsing.
3. **ECC module**: Reed-Solomon encode/decode.
4. **Stego engine**: colour conversion, blocking, FFT, keyed selection, QIM embed/extract, reconstruction, self-check.
5. **Quality module**: PSNR, SSIM, capacity calculation.
6. **Benchmark harness**: offline tooling to run the Section 11 matrix and produce reports.

Each module is independently testable and has no knowledge of HTTP.

### 14.2 Recommended stack

- **Language:** Python 3.11+
- **Numerics/image:** NumPy, OpenCV (or Pillow for IO; avoid any step that silently changes pixels)
- **FFT:** `numpy.fft` / `scipy.fft`
- **Crypto:** `cryptography` library
- **ECC:** `reedsolo` (or equivalent)
- **Metrics:** `scikit-image` (SSIM), own PSNR
- **API:** FastAPI
- **Testing:** pytest, property-based tests (Hypothesis) for round trips
- **Analysis (optional):** MATLAB for DSP visualisation and parameter studies

### 14.3 API contract (draft)

**POST `/api/v1/encode`** (multipart/form-data)

- Inputs: `image` (file), `message` (text)
- Success `200`: stego PNG (binary), `key` (string), metrics `{psnr, ssim, capacity_bytes, used_bytes, bpp}`
- Errors: `400` invalid image/message, `413` file too large, `422` message exceeds capacity (returns max capacity), `429` rate limited

**POST `/api/v1/decode`** (multipart/form-data)

- Inputs: `image` (PNG file), `key` (string, in body)
- Success `200`: `{message}`
- Errors: `400` malformed key (checksum failure) or invalid file, `422` generic decode failure (identical response for all causes), `429` rate limited

**GET `/api/v1/capacity`** (optional, P1)

- Input: image; returns the max message size without encoding.

Response formats for the encode result (single multipart response vs. JSON with base64 image) to be finalised with the frontend phase.

### 14.4 Limits (initial)

- Max upload size: 10 MB
- Max dimensions: 4096 x 4096
- Min dimensions: 128 x 128 (below this, capacity is too small)
- Max message length: bounded by capacity, hard cap 4 KB for v1
- Per-IP rate limits on both endpoints

---

## 15. Research contribution (differentiator)

**Adaptive, texture-aware embedding.** Instead of uniform embedding, choose blocks and coefficients by local texture and energy so that more change is placed where the eye cannot see it (busy regions) and none in flat regions (sky, walls). Goal: minimise distortion for a given payload size. The eligibility rule must be recomputable by the receiver from the stego image, so it must depend on features that survive embedding (for example, quantized low-frequency energy). Evaluate against the uniform baseline using PSNR, SSIM, and a steganalysis tool where available.

---

## 16. Testing strategy

1. **Unit tests:** key formatting/checksum, HKDF outputs, AES-GCM round trip, RS encode/decode with injected errors, keyed selection determinism, conjugate symmetry, QIM embed/extract.
2. **Property tests:** for random images, messages, and keys, `decode(encode(m)) == m`.
3. **Negative tests:** wrong key, truncated image, flipped bits, swapped images, malformed keys. All must fail cleanly.
4. **Quality tests:** PSNR/SSIM assertions on a fixed image corpus (smooth, textured, dark, bright, grayscale, small, large).
5. **Robustness benchmark:** Section 11 matrix on the corpus.
6. **Security review:** confirm no sensitive data in logs, no `random` module use, constant-ish failure timing.
7. **Visual review:** side-by-side and amplified-difference images for sanity checks.

---

## 17. Milestones

| Phase | Deliverable | Exit criteria |
| --- | --- | --- |
| **M0: Research prototype** | Notebook/script: fixed payload, keyed selection, differential QIM, AES-GCM | Exact recovery from saved PNG |
| **M1: Core library** | Modular engine (crypto, ECC, stego, metrics) | All unit/property/negative tests pass |
| **M2: Parameter tuning** | Benchmark harness and chosen parameters | PSNR >= 40 dB, SSIM >= 0.99 at agreed capacity |
| **M3: API** | Encode/decode endpoints with limits and rate limiting | Contract tests pass; no persistence verified |
| **M4: Robustness report** | Full Section 11 matrix results | Published baseline numbers |
| **M5: Frontend integration** | UI built from the separate design brief | End-to-end flow works |
| **M6: Hardening and release** | Security review, load test, docs | Release checklist signed off |
| **M7 (stretch)** | Adaptive embedding / compression-robust mode | Measured improvement over baseline |

---

## 18. Success metrics

- 100% exact recovery on clean PNG round trips across the test corpus.
- 0 occurrences of plaintext output under wrong keys.
- PSNR/SSIM targets met at the documented capacity.
- Zero sensitive data found in logs or storage during audit.
- Published robustness baseline for every Section 11 test.

---

## 19. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Rounding/clipping corrupts embedded bits | Failed decode | Self-check at encode; ECC; iterative re-embedding; margin in `Δ` |
| Users send image via compressing apps | Message lost | Clear warning; recommend file-based sharing; compression-robust mode as stretch |
| Block-edge/saturated pixels (pure white/black) cannot be modified | Capacity loss | Skip ineligible blocks via recomputable rule |
| Detectable by steganalysis | Privacy erosion | Small payload ratio; adaptive embedding; honest messaging |
| Key mishandling by users | Security collapse | Separate-channel guidance; checksum format; no accidental co-bundling in output |
| Server sees plaintext | Trust issue | No persistence; document; plan client-side mode |
| Performance on large images | Slow UX | Vectorised NumPy; size limits; benchmark early |
| Parameter drift across versions | Old images undecodable | Version ID in header; keep old decoders |

---

## 20. Open questions

1. Should v1 stay server-side, or should processing run client-side (WASM) so the server never sees plaintext or keys?
2. Should we offer an optional user-chosen passphrase mode alongside generated keys?
3. Exact v1 message cap and image-size limits (to be set after M2 benchmarks).
4. Is a text-only v1 acceptable, or are file payloads needed at launch?
5. Encode response format (single bundle vs. separate fields).
6. Is there a regulatory or abuse-prevention consideration (content scanning, terms of use) for a public hosted service?
7. Hosting environment and rate-limit infrastructure.

---

## 21. Glossary

- **Cover image:** the original image before embedding.
- **Stego image:** the image with the hidden message.
- **FFT / DFT:** transform from pixel space to spatial-frequency space.
- **Mid-frequency band:** coefficients balancing invisibility and robustness.
- **QIM:** quantization index modulation; encodes bits by quantizing a value into one of two interleaved sets.
- **Differential QIM:** QIM applied to the difference of two coefficient magnitudes.
- **Conjugate symmetry:** property that real images require; FFT coefficients at mirrored positions must be complex conjugates.
- **AES-GCM:** authenticated encryption providing confidentiality and integrity.
- **HKDF:** key derivation function for creating independent subkeys.
- **Reed-Solomon:** error-correcting code that recovers corrupted symbols.
- **PSNR / SSIM:** objective image-quality metrics.
- **BER:** bit error rate.
- **bpp:** bits per pixel (payload density).

---

*This document is the project reference. Any change to algorithm, key format, payload layout, or limits must be recorded here and version-bumped before implementation.*
