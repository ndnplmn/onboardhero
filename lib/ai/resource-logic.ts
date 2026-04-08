/**
 * Phase 5: Predictive Resource Explorer
 * Maps journey friction categories to specific Resource Hub items.
 */

export type FrictionCategory = 'TECHNICAL' | 'PROCESS' | 'CULTURE' | 'ROLE_SPECIFIC'

export interface RecommendedResource {
  id: string
  title: string
  reason: string
  category: FrictionCategory
}

const RESOURCE_MAP: Record<string, string[]> = {
  'Technical setup velocity is lower than peer average.': ['2'], // IT Setup Guide
  'Has not attended architecture deep-dive yet.': ['2'], // IT Setup Guide (Engineering Wiki)
  'Engagement score is decreasing.': ['3', '4'], // Benefits, Brand
  'Process friction detected in HR forms.': ['3'], // HR Portal
  'Default': ['1'] // Company Handbook
}

export function getRecommendedResources(riskReasons: string[]): string[] {
  const recommendedIds = new Set<string>()
  
  riskReasons.forEach(reason => {
    const ids = RESOURCE_MAP[reason] || []
    ids.forEach(id => recommendedIds.add(id))
  })

  // If no specific risk, suggest general handbook
  if (recommendedIds.size === 0) {
    recommendedIds.add('1')
  }

  return Array.from(recommendedIds)
}
