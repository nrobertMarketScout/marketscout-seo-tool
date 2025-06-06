export function auditAndScore(allResults) {
  const groups = {}

  for (const row of allResults) {
    const groupKey = row.Group?.trim() || `${row.Keyword}_${row.Location}`
    if (!groups[groupKey]) {
      groups[groupKey] = {
        Location: row.Location,
        Keywords: new Set(),
        Competitors: []
      }
    }
    groups[groupKey].Keywords.add(row.Keyword)
    groups[groupKey].Competitors.push(row)
  }

  const summary = []

  for (const [group, data] of Object.entries(groups)) {
    const { Location, Keywords, Competitors } = data
    const reviewThreshold = 50

    const mapPackCount = Math.min(3, Competitors.length)
    const anyLowReview = Competitors.some(c => parseInt(c.Reviews || '0', 10) < 20)
    const missingWebsite = Competitors.some(c => !c.Website || c.Website.trim() === '')
    const overThreshold = Competitors.filter(c => parseInt(c.Reviews || '0', 10) >= reviewThreshold)

    summary.push({
      Group: group,
      Location,
      Keywords: Array.from(Keywords).join(', '),
      Map_Pack_Count: mapPackCount,
      Any_Map_Review_Under_20: anyLowReview ? 'Yes' : 'No',
      Missing_Website: missingWebsite ? 'Yes' : 'No',
      ResultsOverThreshold: overThreshold.length,
    })
  }

  return summary
}
