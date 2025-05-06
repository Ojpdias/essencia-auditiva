import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const client_id = process.env.SPOTIFY_CLIENT_ID!
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI!
  const scope = 'user-read-currently-playing user-read-playback-state'

const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirect_uri)}`

  res.redirect(authURL)
}
