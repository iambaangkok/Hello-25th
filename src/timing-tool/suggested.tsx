import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import timing from '../data/timing.json'
import film from '../data/wardrobe-suggested.json'
import vivid from '../data/wardrobe-vivid.json'
import type { Timing } from '../timing.ts'
import { withDefaults, type Wardrobe } from '../wardrobe.ts'
import { fromTiming } from './draft.ts'
import TimingTool from './TimingTool.tsx'

// The timing tool with a suggested Wardrobe, served at /hello25/timing-suggested.html:
// `?set=film` (default) — story backgrounds + film grade; `?set=vivid` — bright and saturated, after
// City the Animation. Each set keeps its own draft; "Save to repo" adopts it as wardrobe.json.

const SETS = {
  // The film set keeps the storage key it had before there were two sets.
  film: { title: 'film colours', wardrobe: film, storageKey: 'hello25.timing-tool.suggested' },
  vivid: { title: 'vivid colours', wardrobe: vivid, storageKey: 'hello25.timing-tool.suggested.vivid' },
}
const name = new URLSearchParams(location.search).get('set') === 'vivid' ? 'vivid' : 'film'
const set = SETS[name]

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <TimingTool
      title={`Timing tool — suggested ${set.title}`}
      storageKey={set.storageKey}
      initial={() => fromTiming(timing as Timing, withDefaults(set.wardrobe as Wardrobe))}
    />
  </StrictMode>,
)
