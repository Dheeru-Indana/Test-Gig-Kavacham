interface ChatInteraction {
  query: string
  intent: string | null
  timestamp: number
  wasHelpful?: boolean
}

// Store interactions in localStorage for session learning
const STORAGE_KEY = 'gigkavacham_chat_history'

export const saveInteraction = (
  query: string,
  intent: string | null
) => {
  try {
    const history: ChatInteraction[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    history.push({ query, intent, timestamp: Date.now() })
    // Keep last 50 interactions
    const trimmed = history.slice(-50)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (e) {
    // Ignore storage errors
  }
}

export const getFrequentTopics = (): string[] => {
  try {
    const history: ChatInteraction[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    )
    const intentCounts: Record<string, number> = {}
    history.forEach(h => {
      if (h.intent) {
        intentCounts[h.intent] = (intentCounts[h.intent] || 0) + 1
      }
    })
    return Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([intent]) => intent)
  } catch {
    return []
  }
}

export const logToSupabase = async (
  supabase: any,
  userId: string,
  query: string,
  intent: string | null,
  response: string
) => {
  try {
    await supabase.from('chatbot_query_log').insert({
      worker_id: userId,
      query,
      detected_intent: intent || 'fallback',
      confidence: intent ? 1 : 0,
      response: response.slice(0, 500),
      model_version: 'v2-intent-classifier',
      created_at: new Date().toISOString(),
    })
  } catch (e) {
    // Fail silently
  }
}
