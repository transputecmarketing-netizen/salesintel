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

## Motion engine: Hairline's craft rules

The motion follows the rules behind [Hairline](https://hairline.lucasmarkes.com) (MIT, Lucas Marques):

- **Two clocks.** Anything that follows a moving target (gaze, head, posture) is a spring at Hairline's constants, k 100 and c 18: just under critical damping, so it settles without wobble. It is integrated in 240 Hz sub-steps so it is equally smooth at any frame rate. Every discrete change (a gesture, an expression) is a tween on the 700 ms lift curve `cubic-bezier(.32,.72,0,1)`, always starting from wherever the value is now, so nothing jumps.
- **Stagger by distance.** A gesture spreads down the arm (shoulder, elbow, wrist, then the fingers one by one, 35 to 45 ms apart). An expression spreads out from the mouth to the eyes, brows and cheeks.
- **Bright outside, dim inside.** Silhouettes are full weight; inner details (creases, folds, the palm line, laces, blush) are lighter and thinner.
- **Two line weights.** `line: "bold"` is the brand drawing; `line: "hairline"` redraws the same rig in fine, non-scaling lines with solids as outlines.
- **The loop sleeps** while the figure is offscreen or the tab is hidden.
- **Same options as Hairline**: `intensity` (how strongly he answers the cursor), `theme` ("auto", "light", "dark"), `label`, `onRead` (a short caption such as `rest`, `wave` or `talking` whenever it changes) and `play` (a self-running tour until a pointer arrives). Change them later with `rig.update({...})`.

Where a character differs from Hairline's objects: a figure of a tray should settle dead still, but a person should not. So the head, posture and hand keep a little overshoot, the wrist and fingers ride springs that start after the arm and settle with a small bounce, the arms swing like pendulums when the body shifts, breathing is visible in the chest, shoulders and head, and an idle mind picks one small action every few seconds: a glance away, finding you again with a smile, a curious tilt, pressed lips, a lifted brow, a weight shift, a look at his own hand, and now and then a stretch. With someone present he keeps to quiet, attentive ones.

How the motion is made to feel human rather than mechanical:

- **Joints break in sequence.** The shoulder leads, the elbow follows, the wrist and fingers arrive last and overshoot. Big swings start with a small anticipation the other way.
- **Elbows behave like elbows.** When a hand rises, the elbow folds first and the forearm swings toward the viewer, so the hand travels up in front of the body. When it lowers, the elbow stays bent until the arm is nearly down.
- **Follow-through from real speed.** The wrist trails the forearm's actual angular velocity, so every fast move has drag and settle.
- **A greeting uses the whole body.** Eyes find you, the brows flash, the head tilts toward the hand, that shoulder lifts, weight shifts away, the smile builds, and the wave rolls from elbow to wrist to fingers with the palm turning, at a rhythm that drifts. It starts strong and settles into a gentler wave.
- **Eyes lead, the head follows** a beat later and only part of the way. He often blinks when his gaze jumps.
- **Nothing loops.** Posture, head drift and hand amplitude come from smooth noise. Breathing has a quick inhale and a slow exhale, with an occasional sigh. Smiles build unevenly from one corner and narrow the eyes. Laughs come in irregular bursts. Talking beats vary in size and direction.

How the drawing holds up in motion:

- **Organic limbs.** Arms and legs are one continuous outline each, with a bicep and forearm swell, thigh and calf contours, a soft point on the outside of a bent elbow or knee and a pinch on the inside, plus an elbow crease and a fold behind the knee when they bend.
- **A torso that bends.** The spine curves rather than tilting as a board, the chest twists toward a gesture, the pelvis tilts over the standing leg while the shoulders answer the other way (contrapposto), the shirt gathers at the waist on the compressed side, and breathing widens the ribcage.
- **A sleeve that fits.** The near sleeve morphs from the sketch's shape at rest into one that hugs the arm as it lifts.
- **Small truths.** Blinks close fast, hold, and open slowly. The crease at the base of the thumb shows when the palm faces you. Teeth show on "ee", "s" and "f" sounds.

Squash, stretch and soft body:

- **Squash and stretch, volume preserved.** A jump squashes on the crouch, stretches on take-off, rounds out at the top and squashes on landing; laughs squash with each "ha", surprise stretches him up. It squashes about the feet on the ground and about the middle in the air, and stays subtle (8 to 12%). `bounce` is a springy bounce in place; agents can drive `body.squash` directly.
- **Soft body.** Elastic springs driven by real velocity: the chest lags behind the hips and wobbles back, the trunk compresses and rebounds, the head squashes slightly on quick nods and landings, and fingers flop back when the hand moves fast.

Nothing sticks:

- **No dead stops.** A part waiting on a stagger keeps heading where it was going, with its momentum, instead of freezing; a new move starts from the current velocity, so a moving part never stops and restarts. Arm joints are momentum-carrying springs; anticipation is a small push the other way, not a separate move. Measured: a gesture change starts moving within 2 frames (it used to freeze for 15).
- **Living eyes.** While holding a gaze the eyes make tiny jumps a few times a second and drift slowly, as real eyes do, instead of sitting perfectly still.

Jelly limbs:

- **The pose is a target, not the drawing.** The arm's rigid pose (shoulder, elbow, wrist) only says where it wants to be. What is drawn is a soft chain (elbow, mid-forearm, wrist) on springs that chases it: each point springs to its place and to its offset from the point before, so motion flows from the shoulder to the hand like a whip, lags, overshoots and wobbles back.
- **No hinge.** The arm is drawn as one smooth rubber-hose curve through the chain, with no pinch or crease at the elbow.
- **A jelly hand.** The hand rides the end of the chain, trails and settles with it, and stretches a little along a fast motion.

How the hands are built:

- **In 3D, then projected.** Each hand is modelled with x across the palm, y along the fingers and z out of the back, and turned on the forearm before it is drawn. Face-on, a curl foreshortens and the part that folds behind the hand is left out; edge-on, the curl shows as a real C-shaped bend. A hanging hand is seen mostly from the side, palm toward the thigh, as a real one is.
- **One silhouette, drawn like an illustrator would.** Palm, thumb and fingers are a single outline (they share the skin union), fingers taper to round pads, and a short line appears only between fingers that touch, stopping before the palm. A relaxed hand hangs straight down in line with the forearm, palm toward the thigh.
- **Three joints per finger.** Fingers curl progressively from the knuckle, their tips draw together as they close, creases appear at bent joints, and each finger tapers to a rounded tip.
- **The right hand on each arm.** The near arm carries his left hand and the far arm his right, its mirror image, so a thumb is never on the impossible side.
- **An opposable thumb.** It abducts in the palm plane and swings across toward the palm as the hand closes.
- **An oval wrist.** It thins as the hand turns edge-on, and the forearm flows into the heel of the hand without a step.
- **A real wave.** The forearm rocks from the elbow, the wrist follows a quarter-beat late, the hand turns a little on each pass, and the fingers ripple one after another.

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
Gestures: wave, hello, hi5, idea, count2, thumbsUp, point, think, cheer, shrug, belly, explain, shy, behind, none.
Actions: blink, wink, nod, shakeHead, wiggleEars, hop, bounce, poke, laughBurst, stretch.

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
