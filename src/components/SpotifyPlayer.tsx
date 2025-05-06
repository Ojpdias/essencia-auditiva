'use client'

import { useEffect, useState } from 'react'
import { IoPlaySkipForward, IoPlaySkipBack, IoPlay, IoPauseOutline } from 'react-icons/io5'

export default function SpotifyPlayer({ token }: { token: string }) {
  const [track, setTrack] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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

  const handlePrevious = () => {
    fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  if (!track) {
    return (
      <div className="bg-gradient-to-b from-slate-900 to-emerald-400 text-white p-4 rounded-lg w-full max-w-md shadow-lg text-center">
        <a
          href="/api/login"
          className="font-medium px-4 py-2 block hover:underline transition-colors"
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
          className={`w-12 h-12 rounded transition-transform duration-500 ${isPlaying ? 'animate-pulse' : ''}`}
          alt="Capa do álbum"
        />
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{track.item.name}</p>
          <p className="text-xs truncate">
            {track.item.artists.map((a: any) => a.name).join(', ')}
          </p>
        </div>
      </div>
      <div className="flex justify-center mt-2 space-x-4 text-white text-xl">
        <button onClick={handlePrevious}><IoPlaySkipBack /></button>
        <button
          onClick={handleTogglePlay}
          className={`text-2xl ${isPlaying ? 'text-white' : 'text-gray-200'}`}
        >
          {isPlaying ? <IoPauseOutline /> : <IoPlay />}
        </button>
        <button onClick={handleNext}><IoPlaySkipForward /></button>
      </div>
    </div>
  )
}
