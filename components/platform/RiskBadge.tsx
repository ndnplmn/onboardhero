export default function RiskBadge({ score }: { score: number }) {
  if (score <= 30) return <span className="badge-on">On track</span>
  if (score <= 60) return <span className="badge-warn">Attention</span>
  return <span className="badge-risk">At risk</span>
}
