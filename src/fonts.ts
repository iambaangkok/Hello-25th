// Font choices for the MV's text, all from Google Fonts and checked to draw ī / ō properly (Noto Sans
// JP alone does not: its ī keeps the dot and its macrons sit off-centre). Japanese-only stacks cover
// every Tier; Latin-first stacks draw Romaji / English in the Latin font and fall back to the
// Japanese font for the Japanese Tier. In dev, `?font=<key>` picks one; builds use the first.
export type FontChoice = {
  key: string
  label: string
  families: string[] // CSS font-family stack, first choice first
  weight: number // the heaviest weight the stack's fonts share
  google: string // css2 `family=` parameters
}

export const FONTS: FontChoice[] = [
  { key: 'noto', label: 'Noto Sans + Noto Sans JP', families: ['Noto Sans', 'Noto Sans JP'], weight: 900, google: 'family=Noto+Sans:wght@900&family=Noto+Sans+JP:wght@900' },
  { key: 'mplus', label: 'M PLUS Rounded 1c', families: ['M PLUS Rounded 1c'], weight: 900, google: 'family=M+PLUS+Rounded+1c:wght@900' },
  { key: 'zenmaru', label: 'Zen Maru Gothic', families: ['Zen Maru Gothic'], weight: 900, google: 'family=Zen+Maru+Gothic:wght@900' },
  { key: 'murecho', label: 'Murecho', families: ['Murecho'], weight: 900, google: 'family=Murecho:wght@900' },
  { key: 'zenkaku', label: 'Zen Kaku Gothic New', families: ['Zen Kaku Gothic New'], weight: 900, google: 'family=Zen+Kaku+Gothic+New:wght@900' },
  { key: 'dela', label: 'Dela Gothic One', families: ['Dela Gothic One'], weight: 400, google: 'family=Dela+Gothic+One' },
  { key: 'nunito', label: 'Nunito + M PLUS Rounded 1c', families: ['Nunito', 'M PLUS Rounded 1c'], weight: 900, google: 'family=Nunito:wght@900&family=M+PLUS+Rounded+1c:wght@900' },
  { key: 'rubik', label: 'Rubik + Noto Sans JP', families: ['Rubik', 'Noto Sans JP'], weight: 900, google: 'family=Rubik:wght@900&family=Noto+Sans+JP:wght@900' },
  { key: 'poppins', label: 'Poppins + Noto Sans JP', families: ['Poppins', 'Noto Sans JP'], weight: 900, google: 'family=Poppins:wght@900&family=Noto+Sans+JP:wght@900' },
  { key: 'inter', label: 'Inter + Noto Sans JP', families: ['Inter', 'Noto Sans JP'], weight: 900, google: 'family=Inter:wght@900&family=Noto+Sans+JP:wght@900' },
]

export const fontStack = (font: FontChoice) =>
  [...font.families.map((f) => `"${f}"`), 'ui-sans-serif', 'system-ui', 'sans-serif'].join(', ')
