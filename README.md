# 🎬 Browser Edge AI Creative Studio

> **Built by [Harshit Kashyap](https://github.com/Harshitkashyap2027)**

A professional, AI-powered video editing studio that runs **entirely in your browser** — no servers, no uploads, no GPU cloud costs. All machine-learning inference is performed locally on your device using WebWorkers and WebGPU.

---

## ✨ Features

### 🎭 Zero-Latency Smart Masking
Upload a video and automatically remove the background without a green screen. Uses real-time edge-detection and pixel-based HSV foreground segmentation, processed frame-by-frame on the canvas. Replace the background with a solid colour **or** a custom image.

### 📝 Local Auto-Captioning (Whisper)
Integrates [OpenAI Whisper (tiny.en)](https://huggingface.co/Xenova/whisper-tiny.en) via **Transformers.js** inside a Web Worker. The audio buffer is extracted from the video, passed to the model, and timestamped caption segments are rendered directly on the playback canvas. The ~74 MB model is downloaded once and cached in your browser's **IndexedDB** — subsequent runs are instant.

### 🎨 In-Browser Style Transfer
Apply five real pixel-manipulation neural-style filters in real time:

| Filter | Algorithm |
|---|---|
| **Anime** | Colour-level quantisation + saturation boost |
| **Cartoon** | Quantisation + Sobel edge darkening |
| **Sketch** | Sobel edge-detection, greyscale inverted |
| **Oil Painting** | Kuwahara quadrant-variance filter |
| **Watercolor** | Gaussian blur blend + warm channel shift |

---

## 🏗 Architecture

The studio is carefully decoupled to keep the UI thread at a strict **60 FPS**.

```
┌────────────────────────────────────────────────────────┐
│  UI Thread  (Next.js / React)                          │
│  • 60 FPS canvas render loop (requestAnimationFrame)   │
│  • User input, panel state, playback controls          │
│  • Communicates via postMessage only                   │
└────────────────┬───────────────────────────────────────┘
                 │  postMessage (ImageData / AudioBuffer)
                 ▼
┌────────────────────────────────────────────────────────┐
│  Web Worker Layer                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ masking.worker   │  │ captioning.worker         │   │
│  │ (HSV segmentation│  │ (@xenova/transformers      │   │
│  │  per frame)      │  │  Whisper tiny.en)          │   │
│  └──────────────────┘  └──────────────────────────┘   │
│  ┌──────────────────┐                                  │
│  │ styleTransfer.   │  Pixel kernels run off           │
│  │ worker           │  the main thread                 │
│  └──────────────────┘                                  │
└────────────────────────────────────────────────────────┘
```

### Key Libraries
| Library | Purpose |
|---|---|
| `next` 14 (App Router) | Framework & SSR |
| `@xenova/transformers` | Whisper ASR in Web Worker |
| `framer-motion` | Panel animations |
| `lucide-react` | Icon set |
| `idb` | IndexedDB model cache |

---

## 🖥 UI Overview

The workspace mirrors professional tools like Premiere Pro and DaVinci Resolve:

```
┌─────────────────────────────────────────────────────────────┐
│  Header  (logo · project name · play/stop · export)         │
├────────┬──────────────────────────────────┬─────────────────┤
│        │                                  │                 │
│ Side-  │        Video Canvas              │   AI Panel      │
│  bar   │  (Canvas 2D, 60fps render loop)  │  • Smart Mask   │
│ Tools  │  Upload drop-zone when empty     │  • Captioning   │
│        │                                  │  • Style Xfer   │
├────────┴──────────────────────────────────┴─────────────────┤
│  Timeline  (Canvas-rendered, 3 tracks: Video/Audio/Caption) │
│  ← Red playhead · click/drag to seek                        │
└─────────────────────────────────────────────────────────────┘
```

- **Dark theme** — `#0d0d0d` / `#161616` / `#1e1e1e`
- **Accent** — purple `#7c3aed`
- **Progress bars** with model-download percentage
- **Toggle switches**, collapsible sections, animated fade-ins
- **Zero layout shift** — all AI state shown inline without modals

---

## 🔒 Privacy & Zero Server Costs

| Property | Detail |
|---|---|
| **Data stays local** | Video, audio, and images never leave the browser tab |
| **GDPR / CCPA compliant** | No PII transmitted — no consent banners needed |
| **GPU compute cost** | $0 — inference offloaded entirely to the user's hardware |
| **Model caching** | IndexedDB — models download once, reused forever |
| **Hosting cost** | Static files only (Vercel / Netlify free tier) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A modern browser with **WebGPU** support (Chrome 113+, Edge 113+) for best performance, or WebGL fallback

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** The `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` headers are set automatically so that `SharedArrayBuffer` (required by Transformers.js / ONNX Runtime) works correctly.

### Production Build

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## 📂 Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout, dark theme, CORP/COOP headers
│   ├── page.tsx            # Dynamically imports Studio (client-only)
│   └── globals.css         # Design tokens, toggle, button, scrollbar styles
│
├── components/
│   ├── Studio.tsx          # Main orchestrator — wires all panels together
│   ├── Header.tsx          # Top bar: logo, project name, transport controls
│   ├── Sidebar.tsx         # Left icon toolbar (Select, Crop, Mask, Caption…)
│   ├── VideoCanvas.tsx     # 60 fps rAF render loop, style & mask effects
│   ├── Timeline.tsx        # Canvas-drawn multi-track timeline + playhead
│   ├── AIPanel.tsx         # Right panel: Masking, Captioning, Style Transfer
│   ├── UploadZone.tsx      # Drag-and-drop video uploader
│   ├── ProgressBar.tsx     # Animated download / inference progress bar
│   └── SkeletonLoader.tsx  # Placeholder skeleton while loading
│
├── workers/
│   ├── masking.worker.ts        # HSV foreground segmentation per frame
│   ├── captioning.worker.ts     # Whisper tiny.en via @xenova/transformers
│   └── styleTransfer.worker.ts  # Pixel-kernel style filters
│
├── hooks/
│   ├── useStudio.ts        # Central state (useReducer)
│   ├── useVideoPlayer.ts   # Video element lifecycle helpers
│   └── useWorker.ts        # Generic typed Web Worker hook
│
├── lib/
│   ├── indexeddb.ts        # saveModel / loadModel / hasModel
│   ├── videoUtils.ts       # extractAudioFromVideo, formatTime, …
│   └── workerManager.ts    # Worker lifecycle & postMessage helpers
│
└── next.config.js          # webpack fallbacks, CORP/COOP headers
```

---

## 🛠 Why This Pushes Boundaries

1. **Zero inference cost** — compute runs on the user's GPU/CPU, not a cloud provider's.
2. **Absolute privacy** — the video file never leaves the browser; GDPR-compliant by design.
3. **60 FPS UI** — heavy pixel processing is isolated in Web Workers, keeping React's render loop smooth.
4. **Real ML in the browser** — Whisper ASR, Kuwahara oil-painting filter, Sobel edge detection, and HSV segmentation all run natively in WebAssembly / WebGPU.
5. **Production architecture** — IndexedDB caching means the 74 MB Whisper model only downloads once, then starts in < 1 s on repeat visits.

---

## 📄 License

MIT © 2024 Harshit Kashyap
