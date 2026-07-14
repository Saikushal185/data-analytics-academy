import db from '../db.js'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
const OLLAMA_TRACK_MODEL = process.env.OLLAMA_TRACK_MODEL || 'qwen3-coder:latest'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4'
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1'

const FULL_PROMPT = (topicName) => `You are a JSON API for Data Analytics Academy.
Return raw JSON only. No markdown fences, no explanation.

Generate a complete self-contained learning topic for: "${topicName}".

The output must match this JSON schema exactly:
{
  "tag": "ML",
  "title": "Machine Learning",
  "description": "One sentence summary for the topic header.",
  "difficulty": "beginner",
  "modules": [
    {
      "title": "Module title",
      "order_index": 1,
      "subtopics": ["Short subtopic name", "Another subtopic"],
      "lessons": [
        {
          "title": "Lesson title",
          "order_index": 1,
          "content": "<p>Full HTML prose using <strong>key terms</strong>. Explain why the concept matters.</p><p>Include concrete analytics context.</p>",
          "code_example": "SELECT ...",
          "note": "A real-world gotcha, best practice, or common mistake.",
          "has_code": 1
        }
      ],
      "quiz_questions": [
        {
          "question": "Question text?",
          "options": ["A", "B", "C", "D"],
          "correct_index": 0,
          "explanation": "Why the correct answer is correct."
        }
      ],
      "srs_cards": [
        { "front": "Question or cloze sentence", "back": "Concise answer" }
      ]
    }
  ]
}

Rules:
- Use a 2-4 uppercase letter tag.
- difficulty must be one of beginner, intermediate, advanced.
- Create 2-4 modules.
- Create 2-3 lessons per module.
- Create 1-2 quiz questions per module.
- Create 2 SRS cards per module.
- The final lesson of the final module must be a Cheat Sheet.
- Lesson content must be valid simple HTML paragraphs. Use <strong>...</strong> for bold terms.
- Put code only in code_example, not inside content.
- Use realistic SQL, Python, spreadsheet, analytics, or BI examples when helpful.
- Keep all content original and specific to the requested topic.`

function extractJson(raw) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object.')
  }
  return JSON.parse(raw.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1'))
}

async function callOllama(prompt) {
  console.log(`Attempting Ollama generation with model: ${OLLAMA_TRACK_MODEL}...`)
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_TRACK_MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(3000)
  }).catch(e => { throw new Error('Ollama unreachable'); })
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  if (!data.response) throw new Error('Ollama returned an empty response.')
  return data.response
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.')
  console.log(`Attempting Gemini generation with model: ${GEMINI_MODEL}...`)
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

async function callGrok(prompt) {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!apiKey) throw new Error('GROK_API_KEY or XAI_API_KEY is not configured.')
  console.log(`Attempting Grok generation with model: ${GROK_MODEL}...`)
  const res = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      messages: [
        { role: 'system', content: 'Return raw JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      stream: false
    })
  })
  if (!res.ok) throw new Error(`Grok HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Grok returned an empty response.')
  return text
}

function normalizeTrack(topicName, parsed) {
  const modules = Array.isArray(parsed.modules) ? parsed.modules : []
  if (!modules.length) throw new Error('Generated track has no modules.')

  return {
    tag: String(parsed.tag || topicName.slice(0, 4)).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4) || 'NEW',
    title: String(parsed.title || topicName).trim(),
    description: String(parsed.description || `A focused learning path for ${topicName}.`).trim(),
    difficulty: ['beginner', 'intermediate', 'advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'beginner',
    modules: modules.map((mod, mIdx) => ({
      title: String(mod.title || `Module ${mIdx + 1}`).trim(),
      order_index: Number.isInteger(mod.order_index) ? mod.order_index : mIdx + 1,
      subtopics: Array.isArray(mod.subtopics) ? mod.subtopics.map(String) : (mod.lessons || []).map((l) => String(l.title || 'Lesson')),
      lessons: (Array.isArray(mod.lessons) ? mod.lessons : []).map((lesson, lIdx) => ({
        title: String(lesson.title || `Lesson ${lIdx + 1}`).trim(),
        order_index: Number.isInteger(lesson.order_index) ? lesson.order_index : lIdx + 1,
        content: String(lesson.content || '').trim() || `<p>${topicName} concept overview.</p>`,
        code_example: String(lesson.code_example || ''),
        note: String(lesson.note || ''),
        has_code: lesson.has_code ? 1 : 0
      })),
      quiz_questions: (Array.isArray(mod.quiz_questions) ? mod.quiz_questions : []).map((q) => ({
        question: String(q.question || '').trim(),
        options: Array.isArray(q.options) ? q.options.slice(0, 4).map(String) : [],
        correct_index: Number.isInteger(q.correct_index) ? q.correct_index : 0,
        explanation: String(q.explanation || '').trim()
      })).filter((q) => q.question && q.options.length === 4),
      srs_cards: (Array.isArray(mod.srs_cards) ? mod.srs_cards : []).map((card) => ({
        front: String(card.front || '').trim(),
        back: String(card.back || '').trim()
      })).filter((card) => card.front && card.back)
    }))
  }
}

export async function generateTrack(topicName) {
  const prompt = FULL_PROMPT(String(topicName || '').trim())
  const providers = [callOllama, callGemini, callGrok]
  let lastErr = null

  for (const provider of providers) {
    try {
      const raw = await provider(prompt)
      console.log('Successfully generated track content. Parsing JSON...')
      return normalizeTrack(topicName, extractJson(raw))
    } catch (err) {
      console.warn(`Track generation provider failed: ${err.message}`)
      lastErr = err
    }
  }

  throw lastErr || new Error('No generation provider succeeded.')
}

function customTopicId(trackId) {
  return `custom-${trackId}`
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function contentBlocks(lesson) {
  const blocks = []
  const paragraphs = String(lesson.content || '')
    .split(/<\/p>\s*<p>|(?:\n\s*){2,}/i)
    .map((p) => p.replace(/^<p>/i, '').replace(/<\/p>$/i, '').trim())
    .filter(Boolean)

  for (const html of paragraphs) blocks.push({ html })
  if (lesson.has_code && lesson.code_example) blocks.push({ code: lesson.code_example })
  if (lesson.note) blocks.push({ note: lesson.note })
  return blocks.length ? blocks : [{ p: stripTags(lesson.content) || lesson.title }]
}

function parseArrayJson(value) {
  try {
    const parsed = JSON.parse(value || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function toTopic(track, modules, lessons, quizzes, cards) {
  const topicId = customTopicId(track.id)
  const topicLessons = lessons.map((lesson) => ({
    id: `${topicId}-lesson-${lesson.id}`,
    title: lesson.title,
    blocks: contentBlocks(lesson)
  }))

  return {
    id: topicId,
    customId: track.id,
    isCustom: true,
    label: track.tag,
    title: track.title,
    blurb: track.description,
    difficulty: track.difficulty,
    lessons: topicLessons,
    quiz: quizzes.map((q) => ({
      id: `${topicId}-quiz-${q.id}`,
      q: q.question,
      options: JSON.parse(q.options || '[]'),
      answer: q.correct_index,
      why: q.explanation
    })),
    interview: [],
    capstone: null,
    aside: {
      terms: cards.slice(0, 8).map((card) => [card.front, card.back]),
      tip: modules.length ? `Start with ${modules[0].title}, then work through each generated lesson in order.` : null
    }
  }
}

export async function saveTrackForUser(userId, generated) {
  if (!userId) throw new Error('Cannot save generated track without an authenticated user.')

  const tx = db.transaction(async (txDb, track) => {
    const insertTrack = txDb.prepare(`
      INSERT INTO custom_tracks (user_id, tag, title, description, difficulty)
      VALUES (?, ?, ?, ?, ?)
    `)
    const insertModule = txDb.prepare(`
      INSERT INTO custom_modules (track_id, user_id, title, order_index, subtopics)
      VALUES (?, ?, ?, ?, ?)
    `)
    const insertLesson = txDb.prepare(`
      INSERT INTO custom_lessons (module_id, track_id, user_id, title, order_index, content, code_example, note, has_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertQuiz = txDb.prepare(`
      INSERT INTO custom_quiz_questions (module_id, track_id, user_id, question, options, correct_index, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertCard = txDb.prepare(`
      INSERT INTO custom_srs_cards (module_id, track_id, user_id, front, back)
      VALUES (?, ?, ?, ?, ?)
    `)

    const trackRes = await insertTrack.run(userId, track.tag, track.title, track.description, track.difficulty)
    const trackId = trackRes.lastInsertRowid

    for (const mod of track.modules) {
      const modRes = await insertModule.run(trackId, userId, mod.title, mod.order_index, JSON.stringify(mod.subtopics || []))
      const moduleId = modRes.lastInsertRowid

      for (const lesson of mod.lessons) {
        await insertLesson.run(
          moduleId,
          trackId,
          userId,
          lesson.title,
          lesson.order_index,
          lesson.content,
          lesson.code_example,
          lesson.note,
          lesson.has_code ? 1 : 0
        )
      }
      for (const q of mod.quiz_questions) {
        await insertQuiz.run(moduleId, trackId, userId, q.question, JSON.stringify(q.options), q.correct_index, q.explanation)
      }
      for (const card of mod.srs_cards) {
        await insertCard.run(moduleId, trackId, userId, card.front, card.back)
      }
    }

    return trackId
  })

  return await tx(generated)
}

export async function getCustomTracksForUser(userId) {
  const tracks = await db.prepare(`
    SELECT id, tag, title, description, difficulty, created_at, quiz_questions
    FROM custom_tracks
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
  `).all(userId)

  const getModules = db.prepare(`
    SELECT id, title, order_index, subtopics, lessons, srs_cards
    FROM custom_modules
    WHERE track_id = ? AND user_id = ?
    ORDER BY order_index ASC, id ASC
  `)
  const getLessons = db.prepare(`
    SELECT id, module_id, title, order_index, content, code_example, note, has_code
    FROM custom_lessons
    WHERE track_id = ? AND user_id = ?
    ORDER BY module_id ASC, order_index ASC, id ASC
  `)
  const getQuiz = db.prepare(`
    SELECT id, module_id, question, options, correct_index, explanation
    FROM custom_quiz_questions
    WHERE track_id = ? AND user_id = ?
    ORDER BY module_id ASC, id ASC
  `)
  const getCards = db.prepare(`
    SELECT id, module_id, front, back
    FROM custom_srs_cards
    WHERE track_id = ? AND user_id = ?
    ORDER BY module_id ASC, id ASC
  `)

  return await Promise.all(tracks.map(async (track) => {
    const modules = await getModules.all(track.id, userId)
    let lessons = await getLessons.all(track.id, userId)
    let quiz = await getQuiz.all(track.id, userId)
    let cards = await getCards.all(track.id, userId)

    if (!lessons.length) {
      lessons = modules.flatMap((mod) =>
        parseArrayJson(mod.lessons || mod.subtopics).map((lesson, idx) => ({
          id: `${mod.id}-${idx}`,
          module_id: mod.id,
          title: lesson.title || `Lesson ${idx + 1}`,
          order_index: idx + 1,
          content: lesson.content || '',
          code_example: lesson.code_example || '',
          note: lesson.note || '',
          has_code: lesson.has_code ? 1 : 0
        }))
      )
    }
    if (!quiz.length) {
      quiz = parseArrayJson(track.quiz_questions).map((q, idx) => ({
        id: `legacy-${idx}`,
        module_id: modules[0]?.id || 0,
        question: q.question,
        options: JSON.stringify(q.options || []),
        correct_index: q.correct_index ?? 0,
        explanation: q.explanation || ''
      }))
    }
    if (!cards.length) {
      cards = modules.flatMap((mod) =>
        parseArrayJson(mod.srs_cards).map((card, idx) => ({
          id: `legacy-${mod.id}-${idx}`,
          module_id: mod.id,
          front: card.front,
          back: card.back
        }))
      )
    }

    return toTopic(
      track,
      modules,
      lessons,
      quiz,
      cards
    )
  }))
}

export async function getCustomCardsForUser(userId) {
  const rows = await db.prepare(`
    SELECT c.id, c.track_id, c.front, c.back, t.title AS trackTitle
    FROM custom_srs_cards c
    JOIN custom_tracks t ON c.track_id = t.id
    WHERE c.user_id = ?
    ORDER BY c.id ASC
  `).all(userId)
  
  return rows.map((card) => ({
    id: `custom-card-${card.track_id}-${card.id}`,
    topicId: customTopicId(card.track_id),
    topicLabel: card.trackTitle,
    kind: 'term',
    front: card.front,
    back: card.back
  }))
}

export async function deleteCustomTrackForUser(userId, trackId) {
  const topicId = customTopicId(trackId)
  return await db.transaction(async (txDb) => {
    await txDb.prepare('DELETE FROM progress WHERE user_id = ? AND item_id LIKE ?').run(userId, `${topicId}-%`)
    await txDb.prepare('DELETE FROM quiz_attempts WHERE user_id = ? AND topic_id = ?').run(userId, topicId)
    await txDb.prepare('DELETE FROM reviews WHERE user_id = ? AND card_id LIKE ?').run(userId, `custom-card-${trackId}-%`)
    await txDb.prepare('DELETE FROM custom_srs_cards WHERE track_id = ? AND user_id = ?').run(trackId, userId)
    await txDb.prepare('DELETE FROM custom_quiz_questions WHERE track_id = ? AND user_id = ?').run(trackId, userId)
    await txDb.prepare('DELETE FROM custom_lessons WHERE track_id = ? AND user_id = ?').run(trackId, userId)
    await txDb.prepare('DELETE FROM custom_modules WHERE track_id = ? AND user_id = ?').run(trackId, userId)
    const res = await txDb.prepare('DELETE FROM custom_tracks WHERE id = ? AND user_id = ?').run(trackId, userId)
    return res.changes
  })()
}
