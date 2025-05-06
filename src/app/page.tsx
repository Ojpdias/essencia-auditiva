'use client'

import { useEffect, useState } from 'react'
import SpotifyPlayer from '@/components/SpotifyPlayer'

export default function Home() {
  const [token, setToken] = useState('')

  useEffect(() => {
    let tokenFromURL = new URLSearchParams(window.location.search).get('access_token')

    if (tokenFromURL) {
      localStorage.setItem('spotify_token', tokenFromURL)
      window.history.replaceState({}, document.title, '/')
      setToken(tokenFromURL)
    } else {
      const localToken = localStorage.getItem('spotify_token') || ''
      setToken(localToken)
    }
  }, [])

  return (
    <main className="min-h-screen bg-zinc-100 flex flex-col p-4 text-white font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <img src="/Black.png" alt="Logo EA" className="w-12 h-auto" />

        <div className="flex items-center space-x-2 text-xs text-gray-300">
          <span>By Ojpdias</span>
          <img
            src="/jp.jpeg"
            alt="JP avatar"
            className="w-6 h-6 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Área da arte */}
      <div className="flex-1 bg-zinc-100 rounded-xl flex items-center justify-center">
        <p className="text-zinc-400 italic">A arte aparecerá aqui em tempo real...</p>
      </div>

      {/* Player ou Login */}
      <div className="mt-4 self-end w-fit max-w-full">
        <SpotifyPlayer token={token} />
      </div>
    </main>
  )
}
