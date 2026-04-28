import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers'

export default function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  className,
  id,
  type = 'text',
  ...props
}) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="gradient-border-animated relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            'w-full bg-white/85 dark:bg-white/5 border rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-600 outline-none transition-all duration-200',
            'focus:bg-white dark:focus:bg-white/8',
            icon && 'pl-10',
            iconRight && 'pr-10',
            error
              ? 'border-red-500/60 focus:border-red-400'
              : focused
              ? 'border-brand-500/60'
              : 'border-slate-200 dark:border-white/10 hover:border-brand-300 dark:hover:border-white/20',
            className
          )}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-gray-500">
            {iconRight}
          </span>
        )}
        {focused && (
          <motion.span
            layoutId="input-focus-ring"
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ boxShadow: '0 0 0 2px rgba(34,197,94,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500 dark:text-gray-500">{hint}</p>}
    </div>
  )
}
