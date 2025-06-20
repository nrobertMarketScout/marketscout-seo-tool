// backend/utils/scoring.js

export function scoreKeyword({
  search_volume = 0,
  cpc = 0,
  competition = 0,
  hasMapPack = false,
  mapPackListings = [],
  overlappingResults = 0,
  adCount = 0
}) {
  let score = 0
  const breakdown = []

  // 1. Search Volume
  if (search_volume >= 500) {
    score += 2
    breakdown.push('Search volume: +2 (≥500)')
  } else if (search_volume >= 100) {
    score += 1
    breakdown.push('Search volume: +1 (100–499)')
  } else {
    breakdown.push('Search volume: +0 (<100)')
  }

  // 2. CPC
  if (cpc < 5) {
    score += 2
    breakdown.push('CPC: +2 (<$5)')
  } else if (cpc < 10) {
    score += 1
    breakdown.push('CPC: +1 ($5–10)')
  } else {
    breakdown.push('CPC: +0 (>$10)')
  }

  // 3. Competition
  if (competition < 0.3) {
    score += 2
    breakdown.push('Competition: +2 (<0.3)')
  } else if (competition < 0.6) {
    score += 1
    breakdown.push('Competition: +1 (0.3–0.6)')
  } else {
    breakdown.push('Competition: +0 (≥0.6)')
  }

  // 4. Ads Density
  if (adCount === 1 || adCount === 2) {
    score += 2
    breakdown.push('Ads density: +2 (1–2 ads)')
  } else if (adCount === 3 || adCount === 4) {
    score += 1
    breakdown.push('Ads density: +1 (3–4 ads)')
  } else {
    breakdown.push('Ads density: +0 (0 or 5+ ads)')
  }

  // 5. Map Pack & Organic Overlap
  let overlapScore = 0
  let overlapNote = 'none'
  if (overlappingResults >= 2 && hasStrongSignals(mapPackListings)) {
    overlapScore = -2
    overlapNote = '≥2 strong overlaps'
  } else if (overlappingResults === 1 && hasOnlyWeakSignals(mapPackListings)) {
    overlapScore = 1
    overlapNote = '1 overlap with weak signals'
  } else {
    overlapScore = 2
    overlapNote = 'no overlap'
  }
  score += overlapScore
  breakdown.push(`Map Pack & Organic overlap: ${overlapScore >= 0 ? '+' : ''}${overlapScore} (${overlapNote})`)

  // 6. Map Pack Opportunity
  if (!hasMapPack) {
    score += 2
    breakdown.push('Map Pack: +2 (absent)')
  } else {
    const count = mapPackListings.length
    const hasWeakCompetition = mapPackListings.every(isWeakMapPackBusiness)
    if (count < 3 || hasWeakCompetition) {
      score += 1
      breakdown.push(`Map Pack: +1 (${count} listings or weak competition)`)
    } else {
      breakdown.push('Map Pack: +0 (strong presence)')
    }
  }

  return { score, breakdown }
}

// Heuristics
function isWeakMapPackBusiness(biz) {
  return (
    (biz.reviews ?? 0) < 20 ||
    (biz.domain_age ?? 0) < 2 ||
    !biz.address ||
    !biz.website
  )
}

function hasStrongSignals(listings) {
  return listings.filter(biz => !isWeakMapPackBusiness(biz)).length >= 2
}

function hasOnlyWeakSignals(listings) {
  return listings.every(isWeakMapPackBusiness)
}

export function fallbackScoreKeyword(keyword) {
  return 0
}
