import japaneseRaw from '../assets/lyrics.md?raw'
import romajiRaw from '../assets/lyrics-romanji.md?raw'
import englishRaw from '../assets/lyrics-en-translation.md?raw'

// One Line of the song: three Tiers, plus the Verse it belongs to.
export type Line = {
  japanese: string
  romaji: string
  english: string
  verse: number
  instrumental: boolean
}

const NO_TRANSLATION = '{no translation}'

const rows = (raw: string) => raw.replace(/\r/g, '').replace(/\n+$/, '').split('\n')

function parse(): Line[] {
  const ja = rows(japaneseRaw)
  const ro = rows(romajiRaw)
  const en = rows(englishRaw)
  if (ja.length !== ro.length || ja.length !== en.length) {
    throw new Error(`Lyrics files are not line-aligned: ${ja.length}/${ro.length}/${en.length}`)
  }

  const lines: Line[] = []
  let verse = 0
  ja.forEach((japanese, i) => {
    if (japanese.trim() === '') {
      verse++
      return
    }
    const english = en[i].trim()
    lines.push({
      japanese: japanese.trim(),
      romaji: ro[i].trim(),
      english: english === NO_TRANSLATION ? '' : english,
      verse,
      instrumental: japanese.trim() === '♪',
    })
  })
  return lines
}

export const LINES: Line[] = parse()
