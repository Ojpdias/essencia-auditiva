'use client'

import { useEffect, useState } from 'react'

interface SpotifyPlayerProps {
  token: string
  onProgress?: (value: number) => void
  onCurrentLine?: (line: string) => void
  onIsPlaying?: (playing: boolean) => void
}

export default function SpotifyPlayer({
  token,
  onProgress,
  onCurrentLine,
  onIsPlaying,
}: SpotifyPlayerProps) {
  const [track, setTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [lines, setLines] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState(0)

  // Buscar faixa atual
  useEffect(() => {
    const fetchTrack = () => {
      fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.status === 204) throw new Error('Sem música tocando')
          if (!res.ok) throw new Error('Erro na API')
          return res.json()
        })
        .then((data) => {
          if (!data || !data.item) return setTrack(null)
          setTrack(data)
          setIsPlaying(data.is_playing)
        })
        .catch(() => setTrack(null))
    }

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
        const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artista)}/${encodeURIComponent(nome)}`)
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
  useEffect(() => {
    if (lyrics) {
      const clean = lyrics.split('\n').filter((line) => line.trim() !== '')
      setLines(clean)
      setCurrentLineIndex(0)
    }
  }, [lyrics])

  // Sincronizar com progress_ms
  useEffect(() => {
    if (!track || lines.length === 0) return

    const totalMs = track.item.duration_ms
    const totalLines = lines.length
    const msPerLine = totalMs / totalLines

    const updateLine = () => {
      const currentMs = track.progress_ms
      const lineIndex = Math.floor(currentMs / msPerLine)
      setCurrentLineIndex(lineIndex)
    }

    updateLine()
    const interval = setInterval(updateLine, 1000)
    return () => clearInterval(interval)
  }, [track, lines])

  // Emitir dados para o componente pai (Home)
  useEffect(() => {
    if (!track) return
    onProgress?.(track.progress_ms)
    onIsPlaying?.(isPlaying)
    onCurrentLine?.(lines[currentLineIndex] || '')
  }, [track, isPlaying, currentLineIndex])

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
