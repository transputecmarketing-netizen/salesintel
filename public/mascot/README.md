# Blue Cap mascot

A line-art mascot traced to SVG and rigged head to toe for animation, with hooks that let AI agents drive him.

| File | What it is |
|---|---|
| `mascot.js` | The rig and runtime. No dependencies. Draws the SVG, animates it and exposes the agent API. |
| `mascot.svg` | Static SVG of the full-body resting pose, with every movable part in its own named group. |
| `demo.html` | Playground with expression, gesture and action controls, a talk box and an agent console. |
| `mcp-server.mjs` | Zero-dependency MCP server that relays agent tool calls to the page showing the mascot. |

## Use it in a page

```html
<div id="buddy" style="--mascot-ink:#1543e6; --mascot-paper:#ffffff"></div>
<script src="/mascot/mascot.js"></script>
<script>
  const buddy = Mascot.mount(document.getElementById("buddy"), { view: "full" }); // or "bust"
  buddy.express("happy");
  buddy.gesture("wave", { hold: 3 });
  buddy.say("Ready for five quick questions?", { speak: true });
</script>
```

`--mascot-paper` must match the background behind him: skin, shirt and shoes are filled with it so they cover the lines they cross.

Options: `view` ("full" or "bust"), `follow` (track the cursor), `idle` (autonomous life), `talkGestures` (hand gestures while speaking). Motion respects `prefers-reduced-motion`.

## What moves

He is never still. He breathes, blinks (sometimes twice), darts his eyes, shifts his weight from foot to foot, fidgets his fingers, twitches an ear, follows the cursor, and laughs when clicked. Hair, the side lock and the cap button lag behind the head; forearms and hands trail the shoulders.

How the body is built:

- **Arms** are two-bone chains (shoulder, elbow, wrist). Gestures aim the wrist with inverse kinematics, elbows hang naturally, and a pose can foreshorten the arm when it points at the viewer. The sleeves ride the upper arm and sit exactly where the sketch has them at rest. The near arm slims as it swings away, because the sketch draws it foreshortened.
- **Hands** draw palm and thumb as one outline (a thick ink pass under a paper pass), so joints never show seams. Each finger keeps its own outline, curls down to a knuckle with a fold crease, and spreads. The palm can turn over.
- **Legs** are solved from planted feet, so knees bend when he bobs, sways or crouches. Jumps squash on take-off and landing, point the toes in the air and shrink the shadow.
- **Face**: the jaw drops with the mouth, teeth and tongue show when it is wide open, dimples appear on a big grin. Lip sync blends into the next sound, nods on each word, raises the brows on stressed words, and tilts the head on questions.

| Part | SVG id | Controls |
|---|---|---|
| Head | `#head` | tilt, turn (features slide for a 3/4 view), nod, hop |
| Eyes | `#eyeL` `#eyeR` | blink, wink, gaze, height, bend into happy arcs |
| Brows | `#browL` `#browR` | hidden at rest; raise, lower, tilt |
| Mouth | `#mouth` | smile curve, width, jaw open; lip sync from text or audio |
| Cheeks | `#blush` | fade in for happy and shy |
| Ears | `#earL` `#earR` | wiggle, twitch, perk |
| Hair | `#fringeL` `#fringeR` `#hairLock` | follow-through swing |
| Cap button | `#capButton` | bob |
| Neck | `#neck` | redrawn each frame to keep head and body joined |
| Torso | `#torso` `#shoulders` | breathing, lean, weight shift, shrug |
| Arms | `#armR` `#armL` | shoulder, elbow, wrist, foreshortening |
| Hands | inside each arm | four fingers with separate curl, thumb angle and length, spread, palm side |
| Legs and shoes | `#legL` `#legR` `#shoeL` `#shoeR` | knee bend from planted feet, jumps |

Expressions: smile, neutral, happy, laugh, surprised, sad, thinking, shy, sleepy, angry.
Gestures: wave, hello, hi5, idea, count2, thumbsUp, point, think, cheer, shrug, belly, explain, shy, none.
Actions: blink, wink, nod, shakeHead, wiggleEars, hop, poke, laughBurst, stretch.

## Agent hooks

Ten MCP-shaped tools, each with a JSON schema, in `Mascot.tools`:

| Tool | Purpose |
|---|---|
| `mascot_express` | Set the face, optionally for a number of seconds |
| `mascot_gesture` | Play a hand gesture |
| `mascot_say` | Talk with lip sync, optionally with the browser voice; waits until the line ends |
| `mascot_action` | One-shot action such as nod or wink |
| `mascot_look` | Aim gaze and head, or release to the cursor |
| `mascot_set` | Set any of 43 named rig points directly, such as `mouth.open`, `body.lean` or `hand.right.elbow` |
| `mascot_perform` | Run a timed sequence of the calls above |
| `mascot_view` | Switch between full body and the original bust framing |
| `mascot_get_state` | Read the expression, gesture and every point's live value |
| `mascot_list_params` | List every rig point with its range and meaning |

There are three ways to reach them.

**In the page:** `await buddy.call("mascot_say", { text: "Hi!", gesture: "wave" })`. Subscribe with `buddy.on("state" | "command" | "speechstart" | "speechend", fn)`.

**From a parent window, iframe or extension:** call `buddy.listen()`, then post JSON-RPC such as `{ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments } }`. `tools/list` returns the schemas.

**From any MCP client:** run the server, open the page it serves, and register it with your client.

```bash
node public/mascot/mcp-server.mjs
```

Then open http://localhost:4545. For Claude Code:

```bash
claude mcp add mascot -- node /absolute/path/to/public/mascot/mcp-server.mjs
```

To use your own page instead of the demo, call `Mascot.connect(buddy, "http://localhost:4545")` there. Set `MASCOT_PORT` to change the port.

Values set through `mascot_set` are held until released, or until an expression or gesture takes over those points. Speech uses the browser's speech engine. For a cloud voice, play its audio through an `<audio>` element and call `buddy.lipSync(audio)`, or feed loudness to `buddy.setMouthOpen(level)`.
