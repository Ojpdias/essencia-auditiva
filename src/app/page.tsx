'use client'

import { useEffect, useState } from 'react'

export default function Home() {
  const [track, setTrack] = useState<any>(null)
  const [valence, setValence] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)

  useEffect(() => {
    let token = new URLSearchParams(window.location.search).get('access_token')

    if (token) {
      localStorage.setItem('spotify_token', token)
      window.history.replaceState({}, document.title, '/')
    } else {
      token = localStorage.getItem('spotify_token') || ''
    }

    if (!token) return

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
          if (!data || !data.item) {
            setTrack(null)
            return Promise.resolve(null) // ← evita erro de tipo
          }

          setTrack(data)
          const trackId = data.item.id

          return fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        })
        .then((res) => {
          if (res && res.ok) return res.json()
          return null
        })
        .then((features) => {
          if (features) {
            setValence(features.valence)
            setEnergy(features.energy)
          }
        })
        .catch((err) => {
          console.error(err)
          setTrack(null)
        })
    }

    fetchTrack()
    const interval = setInterval(fetchTrack, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-zinc-900 flex flex-col p-4 text-white">
  {/* Header */}
  <div className="flex justify-between items-center mb-4">
    <div className="text-2xl font-bold text-pink-500">EA</div>
    <div className="text-xs text-gray-300">By JP 🎧</div>
  </div>

  {/* Área da arte */}
  <div className="flex-1 bg-pink-50 rounded-xl flex items-center justify-center">
    {/* Aqui entra o canvas ou visual dinâmico */}
    <p className="text-zinc-400 italic">A arte aparecerá aqui em tempo real...</p>
  </div>

  {/* Player */}
  <div className="mt-4 self-end bg-pink-700 text-white p-3 rounded-lg w-fit shadow-lg flex items-center space-x-4">
    {track ? (
      <>
        <img src={track.item.album.images[0].url} className="w-12 h-12 rounded" alt="Capa do álbum" />
        <div>
          <p className="text-sm font-medium">{track.item.name}</p>
          <p className="text-xs">{track.item.artists.map((a: any) => a.name).join(', ')}</p>
        </div>
      </>
    ) : (
      <p className="text-sm">Nenhuma faixa tocando</p>
    )}
  </div>
</main>

  )
}
