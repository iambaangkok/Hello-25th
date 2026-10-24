// "Hello 25th!" with each letter in a bright colour; a hard drop shadow keeps every colour readable
// on October's background, whatever it is.
const HELLO_COLOURS = ['#ff3b3b', '#ffd60a', '#4cd964', '#5ac8fa', '#ff6fb5', '#ffffff']

export function HelloTwentyFifth({ size = 'min(11vw,14vh)' }: { size?: string }) {
  let n = 0
  return (
    <p
      className="w-full text-center leading-tight"
      style={{ fontSize: size, textShadow: '0.045em 0.055em 0 rgb(0 0 0 / 0.3)' }}
    >
      {[...'Hello 25th!'].map((ch, i) => (
        <span key={i} style={{ color: ch === ' ' ? undefined : HELLO_COLOURS[n++ % HELLO_COLOURS.length] }}>
          {ch}
        </span>
      ))}
    </p>
  )
}
