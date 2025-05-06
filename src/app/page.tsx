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
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Essência Auditiva 🎶</h1>

      <a href="/api/login" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        Login com Spotify
      </a>

      {track ? (
        <div>
          <h2>{track.item.name}</h2>
          <p>{track.item.artists.map((a: any) => a.name).join(', ')}</p>
          <img src={track.item.album.images[0].url} width={200} style={{ borderRadius: 8 }} />
          <p><strong>Valence:</strong> {valence}</p>
          <p><strong>Energy:</strong> {energy}</p>
        </div>
      ) : (
        <p>Nenhuma faixa tocando agora</p>
      )}
    </main>
  )
}
