// backend/utils/scoring.js
export function scoreKeyword({ search_volume = 0, cpc = 0, competition = 0, hasMapPack = false }) {
  let score = 0

  if (search_volume > 1000) score += 2
  else if (search_volume > 500) score += 1

  if (cpc < 3) score += 2
  else if (cpc < 7) score += 1

  if (competition < 0.3) score += 2
  else if (competition < 0.6) score += 1

  if (!hasMapPack) score += 1

  return score
}

export function fallbackScoreKeyword(keyword) {
  return 0 // for now, fallback returns 0 — could be updated to match heuristic
}
