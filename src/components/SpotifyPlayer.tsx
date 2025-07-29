'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

interface SpotifyPlayerProps {
  token: string
  onProgress?: (value: number) => void
  onCurrentLine?: (line: string) => void
  onIsPlaying?: (playing: boolean) => void
}

/**
 * A minimal shape for the Spotify `Get the User's Currently Playing Track` API
 * response.  Only the fields we care about are defined here to improve type
 * safety and eliminate the use of `any` throughout this file.
 */
interface SpotifyCurrentlyPlaying {
  progress_ms: number
  is_playing: boolean
  item: {
    name: string
    duration_ms: number
    artists: { name: string }[]
    album: { images: { url: string }[] }
  }
}

export default function SpotifyPlayer({
  token,
  onProgress,
  onCurrentLine,
  onIsPlaying,
}: SpotifyPlayerProps) {
  const [track, setTrack] = useState<SpotifyCurrentlyPlaying | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)

  // Keep track of when we last fetched the current track.  This allows us
  // to estimate the current playback position between API polls and avoid
  // abrupt jumps in the progress value.  Without this, progress would
  // remain constant until the next poll, making the visuals feel out of
  // sync with the music.
  const lastFetchRef = useRef<number>(Date.now())

  // Buscar faixa atual
  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const res = await fetch('https://api.spotify.com/v1/me/player', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (res.status === 204) throw new Error('Sem música tocando')
        if (!res.ok) throw new Error('Erro na API')
        const data: SpotifyCurrentlyPlaying = await res.json()
        if (!data || !data.item) {
          setTrack(null)
          setIsPlaying(false)
          return
        }
        setTrack(data)
        setIsPlaying(data.is_playing)
        lastFetchRef.current = Date.now()
      } catch (err) {
        // If any error occurs we clear the track and pause the player state
        setTrack(null)
        setIsPlaying(false)
      }
    }
    // Call immediately and then every 5 seconds
    fetchTrack()
    const interval = setInterval(fetchTrack, 5000)
    return () => clearInterval(interval)
  }, [token])

  // Buscar letra com lyrics.ovh
  useEffect(() => {
    if (!track) return
    const fetchLyrics = async () => {
      const nome = track.item.name
      const artista = track.item.artists[0].name
      try {
        const res = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(nome)}`
        )
        const data = await res.json()
        if (data.lyrics) setLyrics(data.lyrics)
        else setLyrics('Letra não encontrada.')
      } catch {
        setLyrics('Erro ao buscar letra.')
      }
    }
    fetchLyrics()
  }, [track])

  // Processar linhas da letra
  // Compute a list of non‑empty lyric lines whenever the lyrics change.
  const cleanLines = useMemo(() => {
    if (!lyrics) return [] as string[]
    return lyrics
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
  }, [lyrics])

  useEffect(() => {
    setLines(cleanLines)
    setCurrentLineIndex(0)
  }, [cleanLines])

  // Sincronizar com progress_ms
  useEffect(() => {
    // If we don't have a track or no lyrics yet, nothing to sync
    if (!track || lines.length === 0) return

    const totalMs = track.item.duration_ms
    const totalLines = lines.length
    const msPerLine = totalMs / totalLines

    // Update the current line index and emit progress & playing state.  We
    // estimate the current progress by adding the time elapsed since the
    // last API poll to the reported `progress_ms` when the track was
    // fetched.  If playback is paused we use the raw progress.  This
    // provides a smooth progression between polls.
    const update = () => {
      let currentMs = track.progress_ms
      if (isPlaying) {
        const elapsed = Date.now() - lastFetchRef.current
        currentMs += elapsed
      }
      const lineIndex = Math.min(
        Math.floor(currentMs / msPerLine),
        totalLines - 1
      )
      setCurrentLineIndex(lineIndex)
      // Emit updates to the parent so that visuals stay in sync
      onProgress?.(currentMs)
      onCurrentLine?.(lines[lineIndex] || '')
      onIsPlaying?.(isPlaying)
    }
    // run immediately
    update()
    const interval = setInterval(update, 500)
    return () => clearInterval(interval)
  }, [track, lines, isPlaying])

  // When there is no track we still want to reset the state in the parent
  useEffect(() => {
    if (!track) {
      onProgress?.(0)
      onIsPlaying?.(false)
      onCurrentLine?.('')
    }
  }, [track])

  // Render sem faixa
  if (!track) {
    return (
      <div className="bg-gradient-to-b from-slate-900 to-emerald-400 text-white p-4 rounded-lg w-full max-w-md shadow-lg text-center">
        <a
          href="/api/login"
          className="font-medium px-4 py-2 block hover:underline transition-colors w-full"
        >
          Conectar com Spotify
        </a>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-b from-slate-900 to-emerald-400 text-white p-4 rounded-lg w-full max-w-md shadow-lg transition-all duration-500 ${isPlaying ? 'ring-2 ring-emerald-400' : ''}`}>
      <div className="flex items-center space-x-4">
        <img
          src={track.item.album.images[0].url}
          className={`w-12 h-12 rounded transition-transform duration-500 ${!isPlaying ? 'animate-pulse' : ''}`}
          alt="Capa do álbum"
        />
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{track.item.name}</p>
          <p className="text-xs truncate">
            {track.item.artists.map((a: any) => a.name).join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}
