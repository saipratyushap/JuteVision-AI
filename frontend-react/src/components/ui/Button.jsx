import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'

const variants = {
  primary:   'bg-brand-500 hover:bg-brand-400 text-white shadow-neon-green hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] focus:ring-brand-500/40',
  secondary: 'bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-white/20 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:shadow-none focus:ring-white/20',
  outline:   'bg-white/50 dark:bg-transparent border border-brand-300 dark:border-brand-500/50 text-brand-700 dark:text-brand-400 hover:bg-brand-500/10 hover:border-brand-400 focus:ring-brand-500/30',
  danger:    'bg-red-500/90 hover:bg-red-400 text-white focus:ring-red-500/40',
  ghost:     'bg-transparent hover:bg-slate-900/5 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200',
}

const sizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  sm: 'px-4 py-2 text-sm rounded-xl gap-2',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
  xl: 'px-9 py-4 text-lg rounded-2xl gap-3',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  loading = false,
  icon,
  iconRight,
  disabled,
  onClick,
  type = 'button',
  ...rest
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent select-none',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </motion.button>
  )
}
