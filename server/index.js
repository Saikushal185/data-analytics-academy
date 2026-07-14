// Express entry point. Mounts API routes and (in production) serves the built client.
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

import authRouter from './auth.js'
import progressRouter from './routes/progress.js'
import contentRouter from './routes/content.js'
import sqlRouter from './routes/sql.js'
import meRouter from './routes/me.js'
import tutorRouter from './routes/tutor.js'
import accountRouter from './routes/account.js'
import reviewsRouter from './routes/reviews.js'
import tracksRouter from './routes/tracks.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb', extended: true }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/progress', progressRouter)
app.use('/api/content', contentRouter)
app.use('/api/sql', sqlRouter)
app.use('/api/me', meRouter)
app.use('/api/tutor', tutorRouter)
app.use('/api/account', accountRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/tracks', tracksRouter)
// Serve the built client in production (npm run build → client/dist).
const dist = join(__dirname, '..', 'client', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')))
}

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))
