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
- **Figure** — the small abstract walking person drawn from simple shapes, centred horizontally
  near the bottom of the screen. Always short hair.
- **Outfit** — what the Figure wears in a Month: inner, outer, bottom, shoes, bag, hair colour.
  - **Inner** — strap top / t-shirt / tank top / blouse / **dress** (a dress is inner + bottom).
  - **Outer** — none / open jacket / cardigan / coat.
  - **Bottom** — pants with adjustable **length** (shorts ↔ full) and **leg width**.
  - **Shoes** — slipper / two-colour slipper / two-colour running shoes.
  - **Bag** — optional.
- **Wardrobe** — the 12 Months' background colours + Outfits, exported from the picker as JSON.
- **Timing** — the start time of every Line and every Month, recorded by tapping along with the song
  in the **timing tool**.
- **Timeline** — the minimal bottom bar: a thin white line for the song's duration with white
  **Dots** at each Verse start and each Month start; clicking a Dot seeks there.
- **Start screen** — "Thank you 24th..." with a play icon below, before playback.
- **End screen** — "Hello 25th!" over the October colour; tapping replays.
