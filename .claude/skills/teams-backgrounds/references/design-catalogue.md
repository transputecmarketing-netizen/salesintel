# Design catalogue

All designs are 1920x1080, compose their feature in the right third (flip with `"side": "left"`), and draw only from palette roles in the brand file. Centre edge scores below are from the Transputec render (sheet.py, blurred edge mean in the centre third; warning above 2; all office scenes score 0.7 to 1.2).

## office (families/office.js, three.js + SwiftShader, 10 to 20 s each)

The logo is a lit sign on the wall, so the overlay logo defaults to `none`. Every scene has a lit ceiling (dark brand-toned plaster, cove wash, two linear light slots) via `ceiling()`, so no part of the frame renders black.

| design | scene | logo sign | notes |
|---|---|---|---|
| exec | walnut slat wall either side of a felt feature panel, backlit logo panel, credenza and lamp right | top left panel | warm and executive |
| brandwall | felt wall, window onto a generic dusk skyline, desk right | top left | calm wall behind the person; good first choice |
| library | shelving wall either side of a felt feature panel, plaque | top right | richest texture at the edges |
| meeting | glass-walled meeting room onto a soft open office | top left, frosted | very calm |
| studio | plaster wall, light wash, timber ledge with framed art | top left (top right when flipped) | calmest; first choice |

`seed` (integer) changes book and texture randomness.

## hud (families/svgart.py)

Corner brackets, scanlines, cyan glow, logo with glow inset at 100,92. Readouts sit in the left third (x 96 to 456), so they never sit behind the person.

| design | feature (right third) | extras |
|---|---|---|
| assistant | dotted holographic robot on a projector disc, ring, grid floor | readouts, place |
| globe | wire globe with arcs from a home hub, ring, projector | readouts, place, hubs |
| visor | symmetric visor arcs at both edges, small dial and bars | place (bottom right) |
| core | chip with circuit traces, ring | readouts, core_label |

Readouts default to neutral rows (STATUS ONLINE, SESSION SECURE, LINK STABLE, SIGNAL CLEAR) unless the brand file has `hud_readouts`. Only write claims that are true.

## gradient (families/gradient.js, canvas)

Built from the brand's colours with a grain overlay and a left-side darkening so the logo and centre stay quiet.

| design | look |
|---|---|
| mesh | soft blurred colour mesh, right |
| ribbon | flowing line ribbon fading in from the centre |
| horizon | glowing horizon band near the bottom |
| fluted | reeded-glass flutes over colour, brightest right |
| glass | frosted glass panels over colour field |
| rings | concentric arcs from the bottom right corner |
| orb | large lit sphere, right |
| beam | diagonal light beam, right |
| system | reference sheet of the brand's four gradients (not a background) |

## keynote (families/svgart.py)

Deep black with fine grain, one precise object. Very premium; pairs well with a short tag.

| design | look |
|---|---|
| silk | overlapping silk sheets sweeping in from the right |
| waves | layered waves in the lower half (crosses the full width, low) |
| line | one infinity loop of light |
| liquid | glass pills magnifying a colour field |
| bloom | colour bloom low right |
| petals | translucent petals fanning from the corner |
| sheen | one polished curved surface |
| orbit | thin orbit rings and a lit sphere |
