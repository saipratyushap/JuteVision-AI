import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Image, Grid2x2, Settings2, Upload, X } from 'lucide-react'
import Modal from '../ui/Modal'
import { cn } from '../../utils/helpers'

const LAYOUTS = [
  { id: '1',   label: '1',     sub: 'Single',     rows: 1, cols: 1, slots: 1,  icon: Image },
  { id: '1x2', label: '1 × 2', sub: '2 Cameras',  rows: 1, cols: 2, slots: 2,  icon: Grid2x2 },
  { id: '1x3', label: '1 × 3', sub: '3 Cameras',  rows: 1, cols: 3, slots: 3,  icon: Grid2x2 },
  { id: '2x2', label: '2 × 2', sub: '4 Cameras',  rows: 2, cols: 2, slots: 4,  icon: Grid2x2 },
  { id: '2x3', label: '2 × 3', sub: '6 Cameras',  rows: 2, cols: 3, slots: 6,  icon: Grid2x2 },
  { id: '3x3', label: '3 × 3', sub: '9 Cameras',  rows: 3, cols: 3, slots: 9,  icon: Grid2x2 },
  { id: '4x4', label: '4 × 4', sub: '16 Cameras', rows: 4, cols: 4, slots: 16, icon: Grid2x2 },
]

export default function MultiCctvImageUploadModal({ open, onClose, onStart }) {
  const [layoutId, setLayoutId]     = useState('2x2')
  const [files, setFiles]           = useState([])
  const [error, setError]           = useState('')
  const [customRows, setCustomRows] = useState(2)
  const [customCols, setCustomCols] = useState(2)
  const fileRef = useRef(null)

  const layout = useMemo(() => {
    if (layoutId === 'custom') return { rows: customRows, cols: customCols, slots: customRows * customCols }
    return LAYOUTS.find(l => l.id === layoutId) ?? LAYOUTS[3]
  }, [layoutId, customRows, customCols])
  const slots = layout.slots

  const handlePick = () => { setError(''); fileRef.current?.click() }

  const handleFiles = (nextList) => {
    setError('')
    const next = Array.from(nextList ?? []).filter(Boolean)
    if (next.length > slots) {
      setError(`You selected ${next.length} files. Using the first ${slots} for this layout.`)
      setFiles(next.slice(0, slots))
      return
    }
    setFiles(next)
  }

  const handleStart = () => {
    setError('')
    if (files.length < 1) {
      setError('Please select at least 1 image file to start processing.')
      return
    }
    onStart?.({ rows: layout.rows, cols: layout.cols }, files)
    setFiles([])
    onClose?.()
  }

  return (
    <Modal open={open} onClose={onClose} size="xl" title={null}>
      <div className="p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Upload Images to Multi-Camera Grid</h3>
            <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Select a layout, then pick individual image files for each camera slot.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          <p className="text-xs text-slate-500 dark:text-gray-500 font-semibold mb-3">Choose a layout</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LAYOUTS.map((l) => {
              const Icon = l.icon
              const active = l.id === layoutId
              return (
                <motion.button
                  key={l.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setLayoutId(l.id)
                    setFiles([])
                    setError('')
                    setTimeout(() => fileRef.current?.click(), 50)
                  }}
                  className={cn(
                    'rounded-2xl border px-3 py-4 text-left transition-all',
                    active
                      ? 'bg-brand-500/10 border-brand-500/40'
                      : 'bg-black/5 dark:bg-white/4 border-black/10 dark:border-white/8 hover:border-brand-300 dark:hover:border-white/15'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-base font-black text-slate-900 dark:text-white">{l.label}</div>
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', active ? 'border-brand-500/30 bg-brand-500/15 text-brand-500' : 'border-black/10 dark:border-white/10 text-slate-500')}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-gray-500 mt-1">{l.sub}</div>
                </motion.button>
              )
            })}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setLayoutId('custom'); setFiles([]); setError('') }}
              className={cn(
                'rounded-2xl border px-3 py-4 text-left transition-all',
                layoutId === 'custom'
                  ? 'bg-brand-500/10 border-brand-500/40'
                  : 'bg-black/5 dark:bg-white/4 border border-dashed border-black/10 dark:border-white/10 hover:border-brand-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="text-base font-black text-slate-900 dark:text-white">Custom</div>
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border', layoutId === 'custom' ? 'border-brand-500/30 bg-brand-500/15 text-brand-500' : 'border-black/10 dark:border-white/10 text-slate-500')}>
                  <Settings2 size={16} />
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-gray-500 mt-1">Manual Grid</div>
            </motion.button>
          </div>
        </div>

        {layoutId === 'custom' && (
          <div className="mt-4 p-4 rounded-2xl border border-brand-500/20 bg-brand-500/5 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Rows:</span>
              <input
                type="number" min="1" max="5" value={customRows}
                onChange={e => setCustomRows(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="w-16 h-10 rounded-xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center font-black text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-all"
              />
            </div>
            <div className="text-slate-400 font-light text-xl">×</div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Cols:</span>
              <input
                type="number" min="1" max="5" value={customCols}
                onChange={e => setCustomCols(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="w-16 h-10 rounded-xl bg-black/10 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center font-black text-slate-900 dark:text-white focus:border-brand-500 outline-none transition-all"
              />
            </div>
            <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <span className="text-xs font-bold text-brand-500">= {customRows * customCols} Cameras</span>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/8 bg-black/5 dark:bg-white/3 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">Selected images</p>
              <p className="text-xs text-slate-500 dark:text-gray-500">{files.length}/{slots} selected (you can choose 1 to {slots})</p>
            </div>
            <button
              onClick={handlePick}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/12 border border-brand-500/25 text-brand-500 font-semibold text-xs hover:bg-brand-500/18"
            >
              <Upload size={14} />
              Choose Images
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Array.from({ length: slots }).map((_, i) => {
              const file = files[i]
              return (
                <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/4">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-gray-300">Camera {i + 1}</div>
                    <div className="text-[11px] text-slate-500 dark:text-gray-500 truncate">{file ? file.name : 'No file selected'}</div>
                  </div>
                  <div className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', file ? 'bg-brand-500/12 text-brand-600 dark:text-brand-400 border border-brand-500/20' : 'bg-slate-900/5 dark:bg-white/5 text-slate-500 border border-black/5 dark:border-white/10')}>
                    {file ? 'Ready' : 'Pick'}
                  </div>
                </div>
              )
            })}
          </div>

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/3 border border-black/10 dark:border-white/8 text-slate-600 dark:text-gray-300 font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white font-black text-sm shadow-neon-green hover:bg-brand-400"
          >
            Start Processing
          </button>
        </div>
      </div>
    </Modal>
  )
}
