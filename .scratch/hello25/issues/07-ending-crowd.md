# Pose the ending's crowd

Type: task
Status: closed
Assignee: iambaangkok
Blocked by: 05

## Question

Around "Hello 25th!" the ending shows many still copies of her around the waving Figure, each in a
chosen Month's Outfit and a hand-set pose. Build the editor, then the human poses the crowd and the
result is committed. Resolved when `src/data/crowd.json` holds the human's crowd.

## Resolution

**Crowd posed** by the human: 11 copies in `src/data/crowd.json`, fading in at the `hello` mark.

What was built:
- `src/pose.ts` — a Pose (side / front view, lean, arm and leg angles + bends in degrees), the
  skeleton maths, presets (stand, walk, run, jump, front stand, wave, cheer, hands on hips) and
  `dragLimb` for joint handles. `Figure` takes `pose` to hold still; the walk and the wave are now
  poses too (rendering unchanged — compared old vs new).
- `src/crowd.ts` + `src/data/crowd.json` (seeded with 6) — month, x / y / height (% of the 16:9
  screen → vw / vh in the MV), mirror, pose.
- Crowd editor at `/hello25/crowd.html`: the ending as a 16:9 stage; select, drag to move, drag
  elbow / hand / knee / foot handles; Month, preset, mirror, x / y / height, lean and per-joint
  sliders; Duplicate / Delete / Z undo / arrows; autosave; Save to repo.
- In the MV the crowd fades in at the `hello` mark (with "Hello 25th!"); copies above the main
  Figure's feet line stand behind her, lower ones in front.
