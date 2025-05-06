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
      window.history.replaceState({}, document.title, '/') // Limpa o token da URL
    } else {
      token = localStorage.getItem('spotify_token') || ''
    }

    if (!token) return

    // 1º: pegar a música atual
    fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar música atual')
        return res.json()
      })
      .then((data) => {
        setTrack(data)
        const trackId = data?.item?.id

        // 2º: pegar valence e energy com o ID da música
        return fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      })
      .then((res) => {
        if (!res.ok) throw new Error('Erro ao buscar features da música')
        return res.json()
      })
      .then((features) => {
        setValence(features.valence)
        setEnergy(features.energy)
      })
      .catch((err) => {
        console.error(err)
        setTrack(null)
      })
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
