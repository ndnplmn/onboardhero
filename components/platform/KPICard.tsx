import { motion } from 'framer-motion'

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="kpi-card"
    >
      {icon && <div className={`kpi-icon ${colorClass}`}><i className={icon} /></div>}
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {trend && (
        <div className={`kpi-trend ${trend.isDown ? 'down' : 'up'}`}>
          <i className={`fa-solid fa-arrow-trend-${trend.isDown ? 'down' : 'up'}`} />
          {trend.value}
        </div>
      )}
    </motion.div>
  )
}
