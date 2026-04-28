import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'

export default function Card({
  children,
  className,
  hover = false,
  glow = false,
  onClick,
  as: Tag = 'div',
}) {
  const base = cn(
    'glass-card',
    glow && 'neon-border-green',
    onClick && 'cursor-pointer',
    className
  )

  if (hover || onClick) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={base}>{children}</div>
}

export function StatCard({ title, value, sub, icon, color = 'green', loading = false }) {
  const colorMap = {
    green:  'text-brand-500 dark:text-brand-400 bg-[linear-gradient(135deg,rgba(187,247,208,0.95),rgba(255,255,255,0.88)_45%,rgba(209,250,229,0.92))] dark:bg-[linear-gradient(135deg,rgba(34,197,94,0.07),rgba(15,23,42,0.78))] border-brand-200/90 dark:border-brand-500/15 shadow-[0_22px_50px_rgba(34,197,94,0.12)]',
    blue:   'text-blue-500 dark:text-blue-400 bg-[linear-gradient(135deg,rgba(191,219,254,0.95),rgba(255,255,255,0.88)_45%,rgba(224,242,254,0.92))] dark:bg-[linear-gradient(135deg,rgba(59,130,246,0.07),rgba(15,23,42,0.78))] border-blue-200/90 dark:border-blue-500/15 shadow-[0_22px_50px_rgba(59,130,246,0.12)]',
    purple: 'text-violet-500 dark:text-purple-400 bg-[linear-gradient(135deg,rgba(221,214,254,0.95),rgba(255,255,255,0.88)_45%,rgba(243,232,255,0.92))] dark:bg-[linear-gradient(135deg,rgba(139,92,246,0.07),rgba(15,23,42,0.78))] border-violet-200/90 dark:border-purple-500/15 shadow-[0_22px_50px_rgba(139,92,246,0.14)]',
    cyan:   'text-cyan-500 dark:text-cyan-400 bg-[linear-gradient(135deg,rgba(165,243,252,0.95),rgba(255,255,255,0.88)_45%,rgba(224,242,254,0.92))] dark:bg-[linear-gradient(135deg,rgba(6,182,212,0.07),rgba(15,23,42,0.78))] border-cyan-200/90 dark:border-cyan-500/15 shadow-[0_22px_50px_rgba(6,182,212,0.12)]',
    orange: 'text-orange-500 dark:text-orange-400 bg-[linear-gradient(135deg,rgba(254,215,170,0.96),rgba(255,255,255,0.88)_45%,rgba(255,237,213,0.92))] dark:bg-[linear-gradient(135deg,rgba(249,115,22,0.07),rgba(15,23,42,0.78))] border-orange-200/90 dark:border-orange-500/15 shadow-[0_22px_50px_rgba(249,115,22,0.12)]',
    red:    'text-red-500 dark:text-red-400 bg-[linear-gradient(135deg,rgba(254,202,202,0.96),rgba(255,255,255,0.88)_45%,rgba(255,228,230,0.92))] dark:bg-[linear-gradient(135deg,rgba(239,68,68,0.07),rgba(15,23,42,0.78))] border-red-200/90 dark:border-red-500/15 shadow-[0_22px_50px_rgba(239,68,68,0.12)]',
  }
  const textColor = {
    green:  'text-brand-500 dark:text-brand-400',
    blue:   'text-blue-500 dark:text-blue-400',
    purple: 'text-violet-500 dark:text-purple-400',
    cyan:   'text-cyan-500 dark:text-cyan-400',
    orange: 'text-orange-500 dark:text-orange-400',
    red:    'text-red-500 dark:text-red-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'stat-card border rounded-2xl p-6 backdrop-blur-xl',
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">{title}</p>
        {icon && (
          <div className={cn('p-2 rounded-xl bg-current/10', textColor[color])}>
            {icon}
          </div>
        )}
      </div>
      {loading ? (
        <div className="skeleton h-10 w-24 rounded-lg mb-2" />
      ) : (
        <motion.p
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className={cn('text-4xl font-black count-number', textColor[color])}
        >
          {value}
        </motion.p>
      )}
      {sub && <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">{sub}</p>}
    </motion.div>
  )
}
