import { useEffect, useRef } from 'react'
import p5 from 'p5'

export default function CanvasArt({
  isPlaying,
  progress,
  currentLine,
}: {
  isPlaying: boolean
  progress: number
  currentLine: string
}) {
  const sketchRef = useRef<HTMLDivElement | null>(null)
  const p5Instance = useRef<p5 | null>(null)

  useEffect(() => {
    if (!sketchRef.current) return

    const sketch = (p: p5) => {
      let x = 0

      p.setup = () => {
        p.createCanvas(p.windowWidth, 300)
        p.background('#27272a') // cor do bg-zinc-100
        p.colorMode(p.HSB)
      }

      p.draw = () => {
        // fundo com leve rastro transparente sobre o mesmo tom do bg
        p.background('rgba(244, 244, 245, 0.1)')

        const pulse = isPlaying ? Math.sin(p.frameCount * 0.1) * 5 : 1
        const intensity = currentLine.length % 50
        const y = p.height / 2 + pulse * intensity

        const hue = (progress / 1000) % 255
        p.stroke(hue, 255, 255)
        p.strokeWeight(2 + pulse)
        p.line(x, p.height / 2, x + 10, y)

        x += 5
        if (x > p.width) x = 0
      }
    }

    p5Instance.current = new p5(sketch, sketchRef.current)

    return () => {
      p5Instance.current?.remove()
    }
  }, [isPlaying, progress, currentLine])

  return <div ref={sketchRef} className="w-full h-[300px] overflow-hidden" />
}
