export default function KPICard({ value, label, colorClass }: { value: string | number; label: string; colorClass: string }) {
  return (
    <div className="hc-kpi">
      <span className={`hk-n ${colorClass}`}>{value}</span>
      <span className="hk-l">{label}</span>
    </div>
  )
}
