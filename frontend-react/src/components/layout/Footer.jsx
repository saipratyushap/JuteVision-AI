import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { slideUp, staggerContainer } from '../animations/variants'

const SOCIAL = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/thirdeyedata',
    path: 'M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/thirdeye_data',
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/user/ThirdEyeCSS',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  },
]

const LINKS = [
  { label: 'Privacy Policy',    href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Cookies Policy',    href: '#' },
  { label: 'System Status',     href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/6 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          {/* Brand */}
          <motion.div variants={slideUp} className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                <Activity size={14} className="text-brand-400" />
              </div>
              <span className="font-black text-sm">
                <span className="text-gradient-green">VisionCount</span>
                <span className="text-slate-900 dark:text-white"> AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-gray-600">©2026. ThirdEye Data. All Rights Reserved.</p>
          </motion.div>

          {/* Social icons */}
          <motion.div variants={slideUp} className="flex items-center gap-3">
            {SOCIAL.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-lg bg-white/70 dark:bg-white/5 hover:bg-brand-500/15 border border-black/10 dark:border-white/8 hover:border-brand-500/30 flex items-center justify-center text-slate-500 dark:text-gray-500 hover:text-brand-400 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </motion.div>

          {/* Links */}
          <motion.div variants={slideUp} className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-xs text-slate-600 dark:text-gray-600 hover:text-slate-900 dark:hover:text-gray-400 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </footer>
  )
}
