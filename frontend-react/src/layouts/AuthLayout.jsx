import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen hero-bg flex flex-col">
      {/* Animated blobs */}
      <div className="blob w-96 h-96 bg-brand-500/20 top-0 -left-48" style={{ animationDelay: '0s' }} />
      <div className="blob w-80 h-80 bg-blue-500/15 bottom-0 -right-40" style={{ animationDelay: '3s' }} />
      <div className="blob w-64 h-64 bg-purple-500/10 top-1/2 left-1/2 -translate-x-1/2" />

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-100 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 py-5">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Activity size={16} className="text-brand-400" />
          </div>
          <span className="font-black text-sm">
            <span className="text-gradient-green">VisionCount</span>
            <span className="text-slate-900 dark:text-white"> AI</span>
          </span>
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}
