
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const GENIUS_ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN

  if (!GENIUS_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'GENIUS_ACCESS_TOKEN não está definido' })
  }

  const { track, artist } = req.query

  if (!track || !artist) {
    return res.status(400).json({ error: 'Track and artist are required' })
  }

  try {
    const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(track + ' ' + artist)}`
    const searchRes = await axios.get(searchUrl, {
      headers: {
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
      },
    })

    const hits = searchRes.data.response.hits
    const song = hits.find((hit: any) =>
      hit.result.primary_artist.name.toLowerCase().includes((artist as string).toLowerCase())
    )

    if (!song) {
      return res.status(404).json({ error: 'Song not found on Genius' })
    }

    const songUrl = song.result.url

    const lyricsPage = await axios.get(songUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    })

    const html = lyricsPage.data as string
    let match = html.match(/<div[^>]+data-lyrics-container[^>]*>([\s\S]*?)<\/div>/g)

    if (!match || match.length === 0) {
      const oldMatch = html.match(/<div class="lyrics">([\s\S]*?)<\/div>/)
      if (oldMatch && oldMatch[1]) {
        const raw = oldMatch[1].replace(/<[^>]+>/g, '').trim()
        return res.status(200).json({ lyrics: raw })
      }

      return res.status(404).json({ error: 'Não foi possível extrair a letra do Genius' })
    }

    const raw = match
      .map((section) => section.replace(/<[^>]+>/g, '').trim())
      .join('\n')

    return res.status(200).json({ lyrics: raw })
  } catch (error: any) {
    console.error('Erro na API /lyrics:', error.message)
    return res.status(500).json({ error: 'Internal error', details: error.message })
  }
}
