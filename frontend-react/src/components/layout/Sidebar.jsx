import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Camera, Grid2x2, Image, Layers, MapPin,
  Package, ScanLine, Warehouse, ChevronLeft, ChevronRight,
  BarChart2
} from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { cn } from '../../utils/helpers'
import { staggerContainer, sidebarItem } from '../animations/variants'

const MODES = [
  { id: 'multi-cctv',      label: 'Multi-CCTV',       icon: Grid2x2,   color: '#ec4899' },
  { id: 'warehouse-multi', label: 'Warehouse Multi CCTV',  icon: Warehouse, color: '#f97316' },
  { id: 'volume',          label: 'Qty Count Pro',    icon: Package,   color: '#eab308' },
  { id: 'conveyor',        label: 'Conveyor',         icon: Layers,    color: '#3b82f6' },
  { id: 'static',          label: 'Static Image',     icon: Image,     color: '#22c55e' },
  { id: 'live',            label: 'CCTV Live',        icon: Camera,    color: '#ef4444' },
]

export default function Sidebar() {
  const mode = useAppStore(s => s.mode)
  const setMode = useAppStore(s => s.setMode)
  const clearAnalyticsFilter = useAppStore(s => s.clearAnalyticsFilter)
  const collapsed = useAppStore(s => s.sidebarCollapsed)
  const setCollapsed = useAppStore(s => s.setSidebarCollapsed)

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col shrink-0 h-full glass border-r border-black/10 dark:border-white/8 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-black/10 dark:border-white/6">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Activity size={16} className="text-brand-400 shrink-0" />
              <span className="font-bold text-xs text-gradient-green whitespace-nowrap">AI Modes</span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-gray-300 hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
      </div>

      {/* Mode list */}
      <motion.nav
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 flex flex-col gap-1"
      >
        {MODES.map(m => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <motion.button
              key={m.id}
              variants={sidebarItem}
              onClick={() => setMode(m.id)}
              className={cn(
                'sidebar-item w-full text-left',
                active && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? m.label : undefined}
            >
              <Icon
                size={16}
                style={{ color: active ? m.color : undefined }}
                className={cn('shrink-0', !active && 'text-gray-500')}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap overflow-hidden text-xs"
                  >
                    {m.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {active && !collapsed && (
                <motion.span
                  layoutId="mode-indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"
                />
              )}
            </motion.button>
          )
        })}
      </motion.nav>

      {/* Bottom links */}
      <div className="border-t border-black/10 dark:border-white/6 py-3 px-2">
        <button
          onClick={() => { setMode('analytics'); clearAnalyticsFilter() }}
          className={cn('sidebar-item w-full text-left', mode === 'analytics' && 'active', collapsed && 'justify-center px-2')}
          title={collapsed ? 'Analytics' : undefined}
        >
          <BarChart2 size={15} className={cn('shrink-0', mode !== 'analytics' && 'text-gray-500')} style={{ color: mode === 'analytics' ? '#4ade80' : undefined }} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs whitespace-nowrap"
              >
                Analytics
              </motion.span>
            )}
          </AnimatePresence>
          {mode === 'analytics' && !collapsed && (
            <motion.span
              layoutId="mode-indicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"
            />
          )}
        </button>
      </div>
    </motion.aside>
  )
}
