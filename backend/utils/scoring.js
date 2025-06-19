// backend/utils/scoring.js
export function scoreKeyword({
  search_volume = 0,
  cpc = 0,
  competition = 0,
  hasMapPack = false,
  adCount = 0,
  overlappingResults = 0
}) {
  let score = 0
  const breakdown = []

  // Volume
  if (search_volume >= 500) {
    score += 2
    breakdown.push('Search volume: +2 (≥500)')
  } else if (search_volume >= 100) {
    score += 1
    breakdown.push('Search volume: +1 (100–499)')
  } else {
    breakdown.push('Search volume: +0 (<100)')
  }

  // CPC
  if (cpc < 5) {
    score += 2
    breakdown.push('CPC: +2 (<$5)')
  } else if (cpc < 10) {
    score += 1
    breakdown.push('CPC: +1 ($5–10)')
  } else {
    breakdown.push('CPC: +0 (>$10)')
  }

  // Competition
  if (competition < 0.3) {
    score += 2
    breakdown.push('Competition: +2 (<0.3)')
  } else if (competition < 0.6) {
    score += 1
    breakdown.push('Competition: +1 (0.3–0.6)')
  } else {
    breakdown.push('Competition: +0 (≥0.6)')
  }

  // Ads Density
  if (adCount === 1 || adCount === 2) {
    score += 2
    breakdown.push('Ads density: +2 (1–2 ads)')
  } else if (adCount === 3 || adCount === 4) {
    score += 1
    breakdown.push('Ads density: +1 (3–4 ads)')
  } else {
    breakdown.push('Ads density: +0 (0 or 5+ ads)')
  }

  // Map Pack & Organic Overlap
  if (overlappingResults >= 2) {
    score -= 2
    breakdown.push('Map Pack & Organic overlap: -2 (≥2 strong overlaps)')
  } else if (overlappingResults === 1) {
    score += 1
    breakdown.push('Map Pack & Organic overlap: +1 (1 overlap w/ weak signals)')
  } else {
    score += 2
    breakdown.push('Map Pack & Organic overlap: +2 (no overlap)')
  }

  // Map Pack
  if (!hasMapPack) {
    score += 2
    breakdown.push('Map Pack: +2 (absent)')
  } else {
    breakdown.push('Map Pack: +0 (present)')
  }

  return { score, breakdown }
}

export function fallbackScoreKeyword() {
  return { score: 0, breakdown: ['Fallback scoring not implemented'] }
}
