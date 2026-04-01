interface KPICardProps {
  value: string | number
  label: string
  colorClass?: 'cyan' | 'blue' | 'aqua' | 'red' | 'amber' | 'green'
  icon?: string
  trend?: {
    value: string
    isDown?: boolean
  }
}

export default function KPICard({ value, label, colorClass = 'cyan', icon, trend }: KPICardProps) {
  return (
    <div className={`kpi-box ${colorClass}`}>
      {icon && <div className="kpi-icon-sm"><i className={icon}></i></div>}
      <div className="kpi-n">{value}</div>
      <div className="kpi-l">{label}</div>
      {trend && (
        <div className={`kpi-trend ${trend.isDown ? 'down' : ''}`}>
          <i className={`fa-solid fa-arrow-trend-${trend.isDown ? 'down' : 'up'}`}></i>
          {trend.value}
        </div>
      )}
    </div>
  )
}

