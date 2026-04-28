import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Menu, X, Activity } from 'lucide-react'
import useTheme from '../../hooks/useTheme'
import useAppStore from '../../store/useAppStore'
import Button from '../ui/Button'

const NAV_LINKS = [
  { label: 'Features',    href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Dashboard',   href: '/dashboard' },
]

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-white/8 shadow-glass'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <Activity size={16} className="text-brand-400" />
            </div>
            <span className="font-black text-sm tracking-tight">
              <span className="text-gradient-green">VisionCount</span>
              <span className="text-slate-900 dark:text-white"> AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                className={`nav-link ${
                  location.pathname === link.href.split('#')[0] ? 'active' : ''
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors"
              aria-label="Toggle theme"
            >
              <motion.div
                key={isDark ? 'moon' : 'sun'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </motion.div>
            </motion.button>

            {/* System status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Online
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link to="/dashboard">
                <Button size="sm">Open Dashboard</Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-xl text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors"
          >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-30 glass border-b border-black/10 dark:border-white/8 py-4 px-6 flex flex-col gap-3 md:hidden"
          >
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white font-medium py-2 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2 border-t border-black/10 dark:border-white/8">
              <Link to="/dashboard" className="flex-1">
                <Button size="sm" className="w-full">Open Dashboard</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
