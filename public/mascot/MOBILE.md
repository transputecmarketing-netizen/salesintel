# Running the mascot on a phone with a local model

The goal: a companion people talk to on their phone, fully on-device, whose face, body and voice reflect how the user feels. This is the plan for getting there with the rig in this folder.

The library and model names below are candidates to evaluate on real devices. They are not benchmarked choices; check each one's current platform support and licence before committing.

## One conversation turn

```
user speaks ──► speech-to-text ──► local LLM ──► { reply, valence, arousal, gesture }
                                                     │
                     ┌───────────────────────────────┤
                     ▼                               ▼
          mascot_feel / mascot_gesture        text-to-speech ──► loudness + brightness
          (face, brows, posture, energy)              │              per audio frame
                                                       ▼
                                          setMouthOpen(level, brightness)
                                          (mouth shapes, head and hand beats)
```

While the user is talking, the app sets `mascot_gesture: "listen"` (lean in, head tilt). While the model thinks, `mascot_express: "thinking"`.

## 1. Host the rig in the app

The rig is one dependency-free JavaScript file. The quickest path is a WebView:

- **React Native**: `react-native-webview` with `mascot.js` and a small HTML page bundled as local assets, so it works offline.
- **Native iOS / Android**: `WKWebView` / Android `WebView` loading the same bundled page.

The page mounts the rig and calls `rig.listen()`. The native side then drives it with the same JSON-RPC messages the MCP server uses:

```js
// native → WebView
{ "jsonrpc": "2.0", "id": 7, "method": "tools/call", "params": { "name": "mascot_feel", "arguments": { "valence": -0.6, "arousal": 0.3 } } }
```

`tools/list` returns every tool's schema, so the app and the model share one vocabulary.

Performance: the rig spends about 1 ms of script time per frame on a laptop (measured), holds 60 fps, and its loop sleeps while the WebView is hidden or offscreen. Budget for a few times that on a mid-range phone and test early.

A later option, if the WebView ever becomes a bottleneck, is to port the drawing to a native canvas (Skia via `react-native-skia`, or Core Graphics / Android Canvas). The rig computes plain path strings each frame, which port directly.

## 2. The local model

What it must do each turn: write the reply, and judge the user's feeling as two numbers. Ask for JSON:

```
System: You are Blu, a warm study companion. Reply in one or two short sentences.
Then rate the USER's feeling: valence -1 (very sad) to 1 (very happy),
arousal 0 (calm) to 1 (excited). Optionally pick one gesture from:
heart, calm, listen, thumbsUp, hi5, cheer, think, explain, shrug.
Answer only as JSON: {"reply": "...", "valence": 0.0, "arousal": 0.0, "gesture": "..."}
```

The app then does what the demo's `mirror()` does: `empathize()` turns the user's feeling into the mascot's (gentle for sadness, lifted for joy), then `feel()`, the gesture, and speech.

Runtimes to evaluate:

- **llama.cpp** (GGUF models; React Native bindings such as `llama.rn`).
- **MLC LLM** (iOS and Android apps).
- **Apple Foundation Models framework** (the system on-device model, on supported iPhones and OS versions).
- **Google's on-device options**: Gemini Nano through ML Kit GenAI / AICore on supported Android devices, and the MediaPipe LLM Inference API.

Small models to evaluate (1B to 4B parameters, 4-bit quantised): Gemma 3 1B / Gemma 3n, Llama 3.2 1B and 3B, Qwen2.5 1.5B and 3B, Phi-3.5-mini. Roughly, a 1B model at 4 bits needs well under 1 GB for weights; larger models trade memory and battery for better replies and steadier JSON.

If a small model's feeling scores are unreliable, keep the reply from the LLM and score feelings with a tiny dedicated sentiment classifier, or blend both. `Mascot.readEmotion()` in this folder is only a keyword stand-in for the demo.

## 3. Voice in and out

- **Speech-to-text**: Apple's on-device speech recognition, Android `SpeechRecognizer` (on-device where available), or `whisper.cpp` for one engine on both.
- **Text-to-speech**: `AVSpeechSynthesizer` (iOS) and Android `TextToSpeech` are built in. Small neural voices that run locally, such as Piper or Kokoro, sound warmer.
- **Mood in the voice**: map the mascot's mood to rate, pitch and volume the way `say()` already does: slower and lower when sad, quicker and brighter when happy.

## 4. Lip sync and speech rhythm

As TTS audio plays, measure each 20 to 30 ms frame and send it to the rig:

- **loudness** (RMS, 0..1) → `level`
- **brightness** (spectral centroid of the voice band, 0..1) → `brightness`

```js
rig.setMouthOpen(level, brightness);   // every audio frame; setMouthOpen(null) when speech ends
```

The rig turns this into mouth shapes (bright sounds widen the mouth and show teeth, dark ones round it) and finds syllables as rises in loudness. Each syllable nods the head and beats the talking hand, more for stressed ones. Tested with a synthetic voice of 12 syllables: 13 beats detected.

On iOS, an `AVAudioEngine` tap provides the samples. On Android, `Visualizer` or an `AudioTrack` tap does. In a pure WebView build, `rig.lipSync(audioElement)` already does this measuring itself.

## 5. Privacy and safety

- Everything stays on the device: speech, text, the model and the mood. Say so in the app.
- Store conversation memory locally and let people delete it.
- A companion that responds to sadness needs a safety path. If the user's messages suggest crisis, the app should switch from mirroring to supportive guidance and point to real help (local helplines), not just a sad face.

## Build order

1. WebView host with the bundled rig, driven by fixed test messages.
2. TTS with loudness and brightness feeding `setMouthOpen`.
3. The local model returning the JSON turn, wired to `mascot_feel` and gestures.
4. Speech-to-text and the listening state.
5. Device testing for frame rate, latency per turn, memory and battery.
