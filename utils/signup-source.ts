export interface SignupWithUtm {
  utm_parameters?: Record<string, string> | null
  referred_by?: string | null
}

export interface SourceInfo {
  label: string
  color: string
}

export const SOURCE_LABELS: Record<string, string> = {
  'cold_outreach': 'Cold Email'
}

export const SOURCE_COLORS: Record<string, string> = {
  'Referral Link': '#10b981',
  'Metadata': '#0077b5',
  'LinkedIn': '#0a66c2',
  'Reddit': '#ff4500',
  'Google': '#4285f4',
  'Facebook': '#1877f2',
  'Twitter': '#1da1f2',
  'Cold Email': '#f97316'
}

export const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#14b8a6', '#6366f1', '#84cc16']

export function getSignupSource(signup: SignupWithUtm): string {
  if (signup.utm_parameters && signup.utm_parameters.utm_medium) {
    const medium = signup.utm_parameters.utm_medium
    return SOURCE_LABELS[medium] || medium
  }
  return 'Referral Link'
}

export function getSourceColor(source: string, index: number = 0): string {
  return SOURCE_COLORS[source] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

export function getSignupSourceInfo(signup: SignupWithUtm, colorIndex: number = 0): SourceInfo {
  const label = getSignupSource(signup)
  return {
    label,
    color: getSourceColor(label, colorIndex)
  }
}

export interface SourceBreakdown {
  label: string
  value: number
  color: string
}

export function calculateSourceBreakdown(signups: SignupWithUtm[]): SourceBreakdown[] {
  if (!signups.length) return []

  const counts = new Map<string, number>()

  signups.forEach(s => {
    const source = getSignupSource(s)
    counts.set(source, (counts.get(source) || 0) + 1)
  })

  let colorIndex = 0
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      color: getSourceColor(label, colorIndex++)
    }))
    .sort((a, b) => b.value - a.value)
}
