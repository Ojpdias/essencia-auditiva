import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { track, artist } = req.query

  if (!track || !artist) {
    return res.status(400).json({ error: 'Track and artist are required' })
  }

  try {
    // 1. Buscar resultado no Genius
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(track + ' ' + artist)}`
    const searchRes = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
      },
    })

    const hits = searchRes.data.response.hits
    const song = hits.find((hit: any) => hit.result.primary_artist.name.toLowerCase().includes((artist as string).toLowerCase()))

    if (!song) {
      return res.status(404).json({ error: 'Song not found on Genius' })
    }

    const songUrl = song.result.url

    // 2. Fazer scraping simples da página (pois Genius API não retorna a letra diretamente)
    const lyricsPage = await axios.get(songUrl)
    const html = lyricsPage.data as string
    const match = html.match(/<div[^>]+data-lyrics-container[^>]*>([\s\S]*?)<\/div>/g)

    if (!match) {
      return res.status(404).json({ error: 'Could not extract lyrics' })
    }

    const raw = match
      .map((section) => section.replace(/<[^>]+>/g, '').trim())
      .join('\n')

    return res.status(200).json({ lyrics: raw })
  } catch (error) {
    return res.status(500).json({ error: 'Internal error', details: error })
  }
}
