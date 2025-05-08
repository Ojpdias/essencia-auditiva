'use client'

import { useEffect, useState } from 'react'
import SpotifyPlayer from '@/components/SpotifyPlayer'
import dynamic from 'next/dynamic'

const CanvasArt = dynamic(() => import('@/components/CanvasArt'), { ssr: false })

export default function Home() {
  const [token, setToken] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentLine, setCurrentLine] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const tokenFromURL = new URLSearchParams(window.location.search).get('access_token')

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
    <main className="min-h-screen bg-zinc-800 flex flex-col p-4 text-white font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <img src="/Black.png" alt="Logo EA" className="w-12 h-auto" />
        <div className="flex items-center space-x-2 text-xs text-gray-300">
          <span>By Ojpdias</span>
          <img src="/jp.jpeg" alt="JP avatar" className="w-6 h-6 rounded-full object-cover" />
        </div>
      </div>

      {/* Arte ao vivo */}
      <div className="flex-1 bg-zinc-800 rounded-xl flex items-center justify-center">
        <CanvasArt
          isPlaying={isPlaying}
          progress={progress}
          currentLine={currentLine}
        />
      </div>

      {/* Player ou Login */}
      <div className="mt-4 self-end w-fit max-w-full">
        <SpotifyPlayer
          token={token}
          onProgress={setProgress}
          onCurrentLine={setCurrentLine}
          onIsPlaying={setIsPlaying}
        />
      </div>
    </main>
  )
}
