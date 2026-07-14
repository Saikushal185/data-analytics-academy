import db from '../db.js'

// Clean JSON response by extracting from the first { to the last }
export function parseJSON(raw) {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object.')
  }
  let clean = raw.slice(start, end + 1)
  clean = clean.replace(/,\s*([}\]])/g, '$1')
  return JSON.parse(clean)
}

function configuredProviders() {
  const requested = (process.env.TRACK_GENERATION_PROVIDER || 'auto').toLowerCase()
  if (requested === 'ollama') return ['ollama']
  if (requested === 'gemini') return ['gemini']
  if (requested === 'grok') return ['grok']
  return ['ollama', 'gemini', 'grok']
}

async function callOllama(topic, systemPrompt) {
  const url = process.env.OLLAMA_URL || 'http://127.0.0.1:11434'
  const models = (process.env.OLLAMA_MODELS || 'phi4-mini:3.8b,gemma3:4b,qwen3:8b')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
  let lastErr = null

  for (const model of models) {
    try {
      console.log(`Attempting Ollama generation with model: ${model}...`)
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          format: 'json',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Topic: ${topic}` }
          ],
          options: {
            num_predict: 8192,
            num_ctx: 8192,
            temperature: 0.5
          },
          stream: false
        })
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }
      const data = await response.json()
      return data.message.content
    } catch (err) {
      console.warn(`Ollama model ${model} failed:`, err.message)
      lastErr = err
    }
  }
  throw lastErr || new Error('Ollama failed to generate response.')
}

async function callGemini(topic, systemPrompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.')

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  console.log(`Attempting Gemini generation with model: ${model}...`)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Topic: ${topic}` }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.5,
          maxOutputTokens: 8192
        }
      })
    }
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

async function callGrok(topic, systemPrompt) {
  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY
  if (!apiKey) throw new Error('GROK_API_KEY or XAI_API_KEY is not configured.')

  const model = process.env.GROK_MODEL || 'grok-4'
  const baseUrl = process.env.XAI_API_URL || 'https://api.x.ai/v1'
  console.log(`Attempting Grok generation with model: ${model}...`)
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${topic}` }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 8192,
      stream: false
    })
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  const data = await response.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Grok returned an empty response.')
  return text
}

async function generateRawTrack(topic, systemPrompt) {
  const providers = configuredProviders()
  let lastErr = null

  for (const provider of providers) {
    try {
      if (provider === 'ollama') return await callOllama(topic, systemPrompt)
      if (provider === 'gemini') return await callGemini(topic, systemPrompt)
      if (provider === 'grok') return await callGrok(topic, systemPrompt)
    } catch (err) {
      console.warn(`${provider} generation failed:`, err.message)
      lastErr = err
    }
  }

  throw lastErr || new Error('No track generation provider is configured.')
}

function tableColumnNames(table) {
  return new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((col) => col.name))
}

function prepareInsert(table, valuesByColumn) {
  const columns = [...tableColumnNames(table)].filter((column) =>
    Object.prototype.hasOwnProperty.call(valuesByColumn, column)
  )
  const placeholders = columns.map(() => '?').join(', ')
  return {
    stmt: db.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`),
    values: columns.map((column) => valuesByColumn[column])
  }
}

export function saveTrackToDb(userId, track) {
  if (!userId) throw new Error('Cannot save generated track without an authenticated user.')

  const insertTrack = db.prepare(`
    INSERT INTO custom_tracks (user_id, tag, title, description, difficulty, quiz_questions, challenges)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const insertQuizAttempt = db.prepare(`
    INSERT INTO quiz_attempts (user_id, item_id, topic_id, correct)
    VALUES (?, ?, ?, -1)
  `)

  const insertReview = db.prepare(`
    INSERT INTO reviews (user_id, card_id, ease, interval_days, reps, due_at, last_reviewed)
    VALUES (?, ?, 2.5, 1, 0, ?, NULL)
  `)

  const today = new Date().toISOString()

  const tx = db.transaction((parsed) => {
    const resTrack = insertTrack.run(
      userId,
      parsed.tag,
      parsed.title,
      parsed.description || '',
      parsed.difficulty || 'beginner',
      JSON.stringify(parsed.quiz_questions || []),
      JSON.stringify(parsed.challenges || [])
    )
    const trackId = resTrack.lastInsertRowid

    parsed.modules.forEach((mod, mIdx) => {
      const lessonsJson = JSON.stringify(mod.lessons || [])
      const srsCardsJson = JSON.stringify(mod.srs_cards || [])
      const moduleInsert = prepareInsert('custom_modules', {
        track_id: trackId,
        user_id: userId,
        title: mod.title || `Module ${mIdx + 1}`,
        order_index: mod.order_index ?? (mIdx + 1),
        lessons: lessonsJson,
        subtopics: lessonsJson,
        quiz_questions: JSON.stringify(mod.quiz_questions || []),
        srs_cards: srsCardsJson
      })
      const resMod = moduleInsert.stmt.run(...moduleInsert.values)
      const moduleId = resMod.lastInsertRowid

      if (mod.srs_cards) {
        mod.srs_cards.forEach((_, cIdx) => {
          const cardId = `custom-card-${trackId}-${moduleId}-${cIdx}`
          insertReview.run(userId, cardId, today)
        })
      }
    })

    if (parsed.quiz_questions) {
      parsed.quiz_questions.forEach((_, qIdx) => {
        const itemId = `custom-quiz-${trackId}-${qIdx}`
        insertQuizAttempt.run(userId, itemId, `custom-${trackId}`)
      })
    }

    return trackId
  })

  return tx(track)
}

export function getCustomTracksForUser(userId) {
  const tracks = db.prepare(`
    SELECT id, tag, title, description, difficulty, quiz_questions, challenges, created_at
    FROM custom_tracks
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId)

  const getModules = db.prepare(`
    SELECT id, title, order_index, lessons, srs_cards
    FROM custom_modules
    WHERE track_id = ?
    ORDER BY order_index ASC
  `)

  return tracks.map((track) => {
    const modules = getModules.all(track.id).map((mod) => ({
      id: mod.id,
      title: mod.title,
      order_index: mod.order_index,
      lessons: JSON.parse(mod.lessons || '[]'),
      srs_cards: JSON.parse(mod.srs_cards || '[]')
    }))

    return {
      ...track,
      quiz_questions: JSON.parse(track.quiz_questions || '[]'),
      challenges: JSON.parse(track.challenges || '[]'),
      modules
    }
  })
}

export function getCustomCardsForUser(userId) {
  const modules = db.prepare(`
    SELECT m.id as moduleId, m.track_id as trackId, m.srs_cards, t.tag, t.title as trackTitle
    FROM custom_modules m
    JOIN custom_tracks t ON m.track_id = t.id
    WHERE m.user_id = ?
  `).all(userId)

  const cards = []
  for (const m of modules) {
    const srsCards = JSON.parse(m.srs_cards || '[]')
    srsCards.forEach((card, idx) => {
      cards.push({
        id: `custom-card-${m.trackId}-${m.moduleId}-${idx}`,
        topicId: `custom-${m.trackId}`,
        topicLabel: m.trackTitle,
        kind: 'term',
        front: card.front,
        back: card.back
      })
    })
  }
  return cards
}

export async function generateTrack(userId, topic) {
  const systemPrompt = `You are a JSON API. Return raw JSON only. No markdown, no code fences, no explanation.
Your entire response must start with { and end with }.

You are a curriculum design expert for a data analytics academy. When given a topic,
generate a complete, self-contained learning track that matches the quality and depth
of a professional analytics course.

════════════════════════════════════════
LESSON CONTENT STANDARD (follow exactly)
════════════════════════════════════════
Each lesson must match this style:

- A 2-4 sentence conceptual intro explaining the "why"
- Bullet-point breakdown of key concepts (use **bold** for terms, not ** name **)
- At least one realistic code example with a comment explaining what it does
- A "Note" tip — a real-world gotcha, best practice, or common mistake to avoid
- Bold syntax: wrap important terms like **window function** or **PARTITION BY**
  directly in the text using **word** (no spaces around the asterisks)

Example lesson structure:
{
  "title": "Window Functions",
  "content": "Window functions compute across related rows WITHOUT collapsing them like GROUP BY. This is the skill that separates intermediate from advanced analysts.\\n\\n**ROW_NUMBER()** assigns a unique integer per row within a partition.\\n**RANK()** shares ranks on ties but leaves gaps (1,1,3).\\n**DENSE_RANK()** shares ranks with no gaps (1,1,2).\\n\\n\`\`\`sql\\nSELECT customer_id, amount,\\n  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS nth_order\\nFROM orders;\\n\`\`\`\\n\\nNote: You cannot filter on a window result in WHERE — wrap it in a CTE or subquery first.",
  "has_code": true
}

════════════════════════════════════════
QUIZ STANDARD
════════════════════════════════════════
- 3 quiz questions per track (not per module)
- 4 options each, one correct
- Include a clear explanation for the correct answer
- Questions should test real understanding, not just definitions

════════════════════════════════════════
SRS CARD STANDARD
════════════════════════════════════════
- Mix cloze (fill-in-the-blank) and Q&A style
- Answers must be concise (1 sentence max or a single term)
- 2 SRS cards per module

════════════════════════════════════════
CHALLENGE STANDARD
════════════════════════════════════════
Match the SQL track's graded challenge style:
- scaffold: partial SQL with ... placeholders where the user fills in
- Each challenge has a title, description, scaffold code, and the full solution
- Difficulty: start easy, progress to multi-step problems
- 2 challenges per track minimum, up to 3 for complex topics

════════════════════════════════════════
OUTPUT SCHEMA (follow exactly)
════════════════════════════════════════
{
  "tag": "ML",
  "title": "Machine Learning",
  "description": "One sentence summary of what this track covers.",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "modules": [
    {
      "title": "Module title",
      "order_index": 1,
      "lessons": [
        {
          "title": "Lesson title",
          "content": "Full markdown-style lesson text. Use **bold** for key terms. Use \\n\\n for paragraphs. Include fenced code blocks with language tag (\`\`\`sql, \`\`\`python, etc). End with a Note: tip.",
          "has_code": true
        }
      ],
      "srs_cards": [
        { "front": "Question or cloze sentence", "back": "Answer" }
      ]
    }
  ],
  "quiz_questions": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Why this option is correct."
    }
  ],
  "challenges": [
    {
      "title": "Challenge title",
      "description": "What the user must produce. Be specific about columns, filters, ordering.",
      "scaffold": "SELECT ...\\nFROM table\\nWHERE ...;",
      "solution": "SELECT name FROM customers WHERE region = 'West' ORDER BY name;"
    }
  ]
}

════════════════════════════════════════
STRICT RULES
════════════════════════════════════════
- Number of lessons per module: decide based on the topic complexity (minimum 2, maximum 3)
- Always include a "Cheat Sheet" as the final lesson of the last module
- quiz_questions sits at the track level (not inside modules)
- challenges sits at the track level (not inside modules)
- difficulty: calibrate to the topic — don't always default to beginner
- tag: 2-4 uppercase letters
- Every lesson content field must use **bold** with NO spaces inside the asterisks
- Never write ** term ** — always write **term**
- All content must be original and specific to the topic, not generic filler`

  const raw = await generateRawTrack(topic, systemPrompt)
  console.log('Successfully generated track content. Parsing JSON...')

  let track
  try {
    track = parseJSON(raw)
  } catch (err) {
    console.error('Track JSON parsing failed.', err.message)
    throw new Error('The model returned invalid JSON. Please try again or switch to a stronger generation model.')
  }

  try {
    const trackId = saveTrackToDb(userId, track)
    const userTracks = getCustomTracksForUser(userId)
    return userTracks.find(t => t.id === trackId)
  } catch (err) {
    console.error('Generated track save failed.', err.message)
    throw new Error(`Generated track could not be saved: ${err.message}`)
  }
}
