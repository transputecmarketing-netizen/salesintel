# Blue Cap mascot

A line-art mascot traced to SVG and rigged for animation, with hooks that let AI agents drive him.

| File | What it is |
|---|---|
| `mascot.js` | The rig and runtime. No dependencies. Draws the SVG, animates it and exposes the agent API. |
| `mascot.svg` | Static SVG of the resting pose, with every movable part in its own named group. |
| `demo.html` | Playground with expression, gesture and action controls, a talk box and an agent console. |
| `mcp-server.mjs` | Zero-dependency MCP server that relays agent tool calls to the page showing the mascot. |

## Use it in a page

```html
<div id="buddy" style="--mascot-ink:#1543e6; --mascot-paper:#ffffff"></div>
<script src="/mascot/mascot.js"></script>
<script>
  const buddy = Mascot.mount(document.getElementById("buddy"));
  buddy.express("happy");
  buddy.gesture("wave", { hold: 3 });
  buddy.say("Ready for five quick questions?", { speak: true });
</script>
```

`--mascot-paper` must match the background behind him: the hands and forearms are filled with it so they cover the lines they cross.

## What moves

He is never still. He breathes, blinks (sometimes twice), darts his eyes, sways his head, twitches an ear now and then, follows the cursor, and laughs and hops when clicked. Hair, the side lock and the cap button lag behind head movement on their own springs.

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
| Body | `#body` | breathing |
| Arms and hands | `#gestureL` `#gestureR` | forearm angle and lift, wrist, four fingers with separate curl, thumb |

Expressions: smile, neutral, happy, laugh, surprised, sad, thinking, shy, sleepy, angry.
Gestures: wave, hi5, idea, thumbsUp, think, cheer, count2, none.
Actions: blink, wink, nod, shakeHead, wiggleEars, hop, poke.

## Agent hooks

Nine MCP-shaped tools, each with a JSON schema, in `Mascot.tools`:

| Tool | Purpose |
|---|---|
| `mascot_express` | Set the face, optionally for a number of seconds |
| `mascot_gesture` | Play a hand gesture |
| `mascot_say` | Talk with lip sync, optionally with the browser voice; waits until the line ends |
| `mascot_action` | One-shot action such as nod or wink |
| `mascot_look` | Aim gaze and head, or release to the cursor |
| `mascot_set` | Set any of 37 named rig points directly, such as `mouth.open` or `hand.right.index` |
| `mascot_perform` | Run a timed sequence of the calls above |
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
