'use client'

import { useEffect, useState } from 'react'

export default function SpotifyPlayer({ token }: { token: string }) {
  const [track, setTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  // Atualiza a música a cada 2s
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
          setProgress(
            (data.progress_ms / data.item.duration_ms) * 100
          )
        })
        .catch(() => setTrack(null))
    }

    fetchTrack()
    const interval = setInterval(fetchTrack, 2000)
    return () => clearInterval(interval)
  }, [token])

  const handleTogglePlay = () => {
    fetch(`https://api.spotify.com/v1/me/player/${isPlaying ? 'pause' : 'play'}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(() => setIsPlaying(!isPlaying))
  }

  const handleNext = () => {
    fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  if (!track) {
    return (
      <a
        href="/api/login"
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-lg shadow-lg transition-colors"
      >
        Conectar com Spotify
      </a>
    )
  }

  return (
    <div className="bg-emerald-600 text-white p-4 rounded-lg w-full max-w-md shadow-lg space-y-2">
      <div className="flex items-center space-x-4">
        <img
          src={track.item.album.images[0].url}
          className="w-12 h-12 rounded"
          alt="Capa do álbum"
        />
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{track.item.name}</p>
          <p className="text-xs truncate">
            {track.item.artists.map((a: any) => a.name).join(', ')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleTogglePlay} className="text-white">
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <button onClick={handleNext} className="text-white">⏭️</button>
        </div>
      </div>
      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}
