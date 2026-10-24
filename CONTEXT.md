# hello25 — glossary

A birthday music video for the song "Hello" (Furui Riho), played as a web page.

## Ubiquitous language

- **MV** — the whole experience: the song playing with lyrics, month colours, and the walking Figure.
- **Line** — one line of the lyrics files (`assets/lyrics*.md`); the unit shown on screen at a time.
  Each Line has three **Tiers**:
  - **Japanese** — top, slightly smaller than Romaji.
  - **Romaji** — centre, white, the largest tier.
  - **English** — bottom, greyed, same size as Japanese. May be empty (e.g. "Hello, dear my friends").
- **Instrumental break** — a `♪` Line; shown as a single note symbol.
- **Verse** — one blank-line-separated block of Lines in the lyrics files.
- **Month** — one of 12 consecutive spans of the song, **November → October** (ending on her
  birthday month). Each Month has one flat **background colour** and one **Outfit**.
- **Figure** — the small abstract person built only from sharp rectangles (no face features),
  centred horizontally near the bottom of the screen. Short bob hair. Moves side-on, facing right;
  turns to face the screen only to **Wave**.
- **Gait** — what the Figure's legs are doing: **Stand** (still, breathing; the song starts here),
  **Walk** (80 steps/min) or **Light run** (140 steps/min), both on the song's beat. Changing gait
  eases over a short blend rather than snapping.
- **Gait keyframe** — a time where the Gait changes, with its own ease time. Either tied to a Month
  marker or free at any time.
- **Month keyframe** — what changes at a Month marker: the background colour and the Outfit.
- **Outfit** — what the Figure wears in a Month: inner, outer, bottom, shoes, accessories, hair.
  - **Inner** — strap top / t-shirt / long-sleeve / turtleneck / tank top / blouse / **dress** (a dress is inner +
    bottom). One colour, or **striped**: horizontal stripes of two colours.
  - **Outer** — none / open jacket / cardigan / coat / vest (sleeveless) / puffer (puffy, quilted).
  - **Bottom** — pants with adjustable **length** (shorts ↔ full) and **leg width**.
  - **Shoes** — slipper / two-colour slipper / two-colour running shoes.
  - **Accessories** — a bag (none / side bag / bigger side bag with a thicker strap / backpack) and
    an optional scarf and a hat (none / **bucket** — low crown, brim sloping down all round, optional dots in their own colour / **cap** — peak in
    front), each with its own colour.
  - **Hair** — colour, and a style — all short, as hers is: **bob** (chin length), **short bob** (a
    little shorter), **ponytail** (short, high, with long side bangs framing the face) or
    **pigtails** (two short tufts low at the sides).
- **Wardrobe** — the 12 Month keyframes (background colours + Outfits), edited in the timing tool.
- **Timing** — the start time of every Line and every Month, recorded by tapping along with the song
  in the **timing tool**.
- **Rapid change** — the closing stretch: from October's start the Outfits and background colours
  flick through the other Months, slowly at first, speeding up to their fastest at the **Rapid change
  mark** (`rapid`), then slowing back down to land on October's about 1 s before the **Wave**.
- **Wave** — the final mark (`wave`): the Figure, in October's Outfit, stops walking and waves at the
  screen until the audio ends. The End screen follows.
- **Timeline** — the minimal bottom bar: a thin white line for the song's duration with white
  **Dots** at each Verse start and each Month start; clicking a Dot seeks there.
- **Start screen** — "Thank you 24th..." with a play icon below, before playback.
- **End screen** — "Hello 25th!" over the October colour; tapping replays.
