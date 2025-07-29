import { useEffect, useRef } from 'react'
import p5 from 'p5'

/**
 * CanvasArt component
 *
 * This component renders a p5.js sketch that responds to the current playback
 * state of a Spotify track.  The original implementation would tear down and
 * recreate the entire p5 instance whenever `isPlaying`, `progress` or
 * `currentLine` changed.  That behaviour caused the canvas to flash or reset
 * every time new data was received, which is particularly jarring when the
 * track is playing live.  To provide a smoother, continuous visualisation we
 * only create the p5 instance once and then update local refs whenever props
 * change.  The sketch reads from those refs on each draw call, producing
 * pulsing psychedelic circles that orbit the centre of the canvas.  Hue,
 * radius and orbit size are derived from the song progress and the length of
 * the current lyric line to give the impression that the artwork is synced
 * with the rhythm and energy of the music.
 */
export default function CanvasArt({
  isPlaying,
  progress,
  currentLine,
}: {
  isPlaying: boolean
  progress: number
  currentLine: string
}) {
  // ref to the container for the p5 sketch
  const sketchRef = useRef<HTMLDivElement | null>(null)
  // hold onto the p5 instance so we can clean it up on unmount
  const p5Instance = useRef<p5 | null>(null)
  // refs to hold the latest values of the props without re‑creating the sketch
  const isPlayingRef = useRef(isPlaying)
  const progressRef = useRef(progress)
  const currentLineRef = useRef(currentLine)

  // Whenever the props change, update the corresponding ref.  This allows
  // the p5 sketch to read the most recent values without being rebuilt.
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])
  useEffect(() => {
    progressRef.current = progress
  }, [progress])
  useEffect(() => {
    currentLineRef.current = currentLine
  }, [currentLine])

  useEffect(() => {
    // Only create a new p5 instance once on mount.  Any updates to props
    // will flow through the ref values.  Cleaning up removes the p5 canvas
    // from the DOM when the component unmounts.
    if (!sketchRef.current) return
    const sketch = (p: p5) => {
      // Use a local time variable to drive the animation.  We avoid using
      // progress directly as a frame counter because progress jumps
      // whenever Spotify polls the API; instead, we combine progress with
      // frameCount to get a smoothly varying parameter.
      p.setup = () => {
        // Use WEBGL mode to enable 3D rendering.  The third argument
        // activates p5's 3D renderer.  We still set a fixed height.
        p.createCanvas(p.windowWidth, 300, p.WEBGL)
        p.background(39, 39, 42)
        p.colorMode(p.HSB)
        p.noStroke()
      }
      p.draw = () => {
        const playing = isPlayingRef.current
        const currProgress = progressRef.current
        const line = currentLineRef.current
        // Intensity derived from the length of the current lyric line
        const intensity = line ? line.length % 60 : 0
        // Pulse factor controls the size of the shapes
        const pulse = playing ? (Math.sin(p.frameCount * 0.05) + 1) / 2 : 0.3
        // Base radius for orbital calculations
        const baseRadius = 30 + intensity
        const radius = baseRadius * (0.5 + pulse)
        // Angle to drive rotations; combine progress and frameCount for variation
        const angle = (currProgress / 1000.0) * 0.02 + p.frameCount * 0.015
        // Clear the scene with a dark colour (no alpha in WEBGL mode)
        p.background(39, 39, 42)
        // Set up some basic lighting
        p.ambientLight(60, 60, 60)
        p.pointLight(255, 255, 255, 0, 0, 300)
        // Slow rotation of the entire scene for dynamism
        p.push()
        p.rotateY(angle * 0.5)
        p.rotateX(angle * 0.25)
        const hue = ((currProgress / 10) % 360 + p.frameCount) % 360
        // Draw concentric torus shapes that pulse with the beat
        for (let i = 0; i < 2; i++) {
          const r = radius * (1 + i * 0.5)
          p.push()
          p.rotateZ(angle * (0.3 + i * 0.2))
          p.specularMaterial((hue + i * 30) % 360, 255, 255)
          p.torus(r, 5 + pulse * 4)
          p.pop()
        }
        // Create 3D spokes radiating from the centre.  Use noise to vary
        // their lengths along the z-axis for a more organic appearance.
        const segments = Math.max(8, Math.floor(intensity / 2))
        for (let i = 0; i < segments; i++) {
          const segAngle = (i / segments) * Math.PI * 2 + angle
          const noiseVal = p.noise(i * 0.3, p.frameCount * 0.02)
          const rayLength = (p.height / 2 - 40) * (0.4 + noiseVal * 0.6)
          const x = rayLength * Math.cos(segAngle)
          const y = rayLength * Math.sin(segAngle)
          const z = (noiseVal - 0.5) * 200
          p.push()
          p.translate(x, y, z)
          const boxSize = 10 + pulse * 20
          p.specularMaterial((hue + i * (360 / segments)) % 360, 200, 255)
          p.box(boxSize)
          p.pop()
        }
        p.pop()
      }
      // Handle window resizing so the canvas always fills the width
      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, 300)
      }
    }
    p5Instance.current = new p5(sketch, sketchRef.current)
    return () => {
      p5Instance.current?.remove()
    }
    // We intentionally leave the dependency array empty so that this effect
    // runs only on mount/unmount.  All prop updates are handled via refs.
  }, [])

  return <div ref={sketchRef} className="w-full h-[300px] overflow-hidden" />
}
