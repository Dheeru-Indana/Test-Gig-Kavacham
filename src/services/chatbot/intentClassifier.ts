import { INTENT_KNOWLEDGE } from './intentKnowledge';

export const classifyIntent = (
  userInput: string,
  knowledge: typeof INTENT_KNOWLEDGE
): typeof INTENT_KNOWLEDGE[0] | null => {

  const input = userInput.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)

  let bestMatch = null
  let bestScore = 0

  for (const item of knowledge) {
    let score = 0

    for (const tag of item.tags) {
      const tagWords = tag.toLowerCase().split(/\s+/)

      // Exact phrase match — high weight
      if (input.join(' ').includes(tag.toLowerCase())) {
        score += 10
      }

      // Individual word matches — medium weight
      for (const word of tagWords) {
        if (input.includes(word) && word.length > 3) {
          score += 3
        }
      }

      // Partial word matches (startsWith) — low weight
      for (const word of tagWords) {
        for (const inputWord of input) {
          if (inputWord.startsWith(word.slice(0, 4))
              && word.length > 3) {
            score += 1
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestMatch = item
    }
  }

  // Only return a match if confidence is above threshold
  return bestScore >= 3 ? bestMatch : null
};
