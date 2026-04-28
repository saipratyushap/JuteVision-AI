import { useMemo, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Upload, Radio, X, Download, BarChart2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { cn } from '../../utils/helpers'
import { getApiUrl } from '../../config'
import { saveAnalytics, getAnalytics } from '../../utils/helpers'

function CameraTile({ cameraId, index, cam, onRemove, userId = 'admin' }) {
  const label    = cam?.label    || `CAMERA ${index + 1}`
  const count    = cam?.count    ?? 0
  const status   = cam?.status   ?? 'idle'
  const frameSrc = cam?.frameSrc ?? null
  const progress = cam?.progress ?? null
  const videoUrl = cam?.video_url || cam?.videoUrl || null

  // Gemini AI audit fields (warehouse-multi)
  const auditAvailable       = cam?.auditAvailable       ?? false
  const auditedCount         = cam?.auditedCount         ?? null
  const estimatedTotal       = cam?.estimatedTotal       ?? null
  const visibleCount         = cam?.visibleCount         ?? null
  const depthLayers          = cam?.depthLayers          ?? null
  const geminiReasoning      = cam?.geminiReasoning      ?? null
  const geminiVisibleRows    = cam?.geminiVisibleRows    ?? null
  const geminiVisibleCols    = cam?.geminiVisibleCols    ?? null
  const geminiEstimatedDepth = cam?.geminiEstimatedDepth ?? null
  const geminiVolumeFormula  = cam?.geminiVolumeFormula  ?? null

  const hasAudit = status === 'completed' && auditAvailable && geminiReasoning
  const [reasoningOpen, setReasoningOpen] = useState(false)

  const derivedFormula = geminiVolumeFormula ||
    (geminiVisibleRows && geminiVisibleCols && geminiEstimatedDepth
      ? `${geminiVisibleRows} rows × ${geminiVisibleCols} cols × ${geminiEstimatedDepth} depth = ${geminiVisibleRows * geminiVisibleCols * geminiEstimatedDepth} × 0.94 ≈ ${Math.round(geminiVisibleRows * geminiVisibleCols * geminiEstimatedDepth * 0.94)}`
      : null)

  const setMode = useAppStore(s => s.setMode)
  const setAnalyticsFilter = useAppStore(s => s.setAnalyticsFilter)

  const isImageUrl = videoUrl && /\.(jpg|jpeg|png|webp)$/i.test(videoUrl)
  const media =
    status === 'completed' && videoUrl
      ? { kind: isImageUrl ? 'image' : 'video', src: `${getApiUrl('')}${videoUrl}` }
      : frameSrc
      ? { kind: 'image', src: frameSrc }
      : null

  const handleDownload = async () => {
    if (!videoUrl) return
    try {
      const url = `${getApiUrl('')}${videoUrl}`
      const res = await fetch(url)
      const blob = await res.blob()
      const ext = isImageUrl ? 'jpg' : 'mp4'
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `detected_${label.replace(/\s+/g, '_')}.${ext}`
      a.click()
    } catch {}
  }

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/40 group h-full">
      {/* Media Content (v14.65) */}
      <div className="relative flex-1 bg-black/20 overflow-hidden min-h-[140px]">
        {media ? (
          media.kind === 'video' ? (
            <video src={media.src} controls className="w-full h-full object-cover" />
          ) : (
            <img src={media.src} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300/70">
            No feed
          </div>
        )}

        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 text-emerald-300 text-[11px] font-black tracking-wide z-10">
          {label}
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 text-amber-200 text-[11px] font-black z-10">
          {count} boxes
        </div>

        {/* Corner Processing Badge (v14.66) */}
        {status === 'processing' && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-lg z-20">
            <div className="w-3.5 h-3.5 rounded-full border border-brand-500/20 border-t-brand-500 animate-spin" />
            <div className="text-brand-400 text-[9px] font-black uppercase tracking-tighter">
              {progress != null ? `${progress}%` : 'Proc...'}
            </div>
          </div>
        )}

        {/* Remove Button (Hover only) */}
        <button
          onClick={() => onRemove?.(cameraId)}
          className="absolute top-10 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/40 z-10"
          title="Remove camera"
        >
          <X size={12} />
        </button>
      </div>

      {/* Persistent Action Bar */}
      <div className="flex border-t border-white/5 bg-black/30 p-1.5 gap-1.5 shrink-0">
        <button
          onClick={handleDownload}
          disabled={status !== 'completed'}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
            status === 'completed'
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
              : "bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed opacity-50"
          )}
        >
          <Download size={11} />
          {status === 'completed' ? 'Download' : 'Wait...'}
        </button>
        <button
          onClick={() => { 
            if (status === 'completed') { 
              const analyticsMode = hasAudit ? 'Warehouse Multi CCTV' : 'Multi-CCTV'
              setAnalyticsFilter(analyticsMode)
              setMode('analytics') 
            } 
          }}
          disabled={status !== 'completed'}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
            status === 'completed'
              ? "bg-blue-500/15 border border-blue-500/30 text-blue-400 hover:bg-blue-500/25"
              : "bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed opacity-50"
          )}
        >
          <BarChart2 size={11} />
          {status === 'completed' ? 'Analytics' : 'Processing'}
        </button>
      </div>

      {/* Gemini AI Audit Panel — warehouse-multi only */}
      {hasAudit && (
        <div className="border-t border-purple-500/20 bg-purple-950/20 shrink-0">
          <button
            onClick={() => setReasoningOpen(o => !o)}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-purple-300 hover:bg-purple-500/10 transition-colors"
          >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} className="text-purple-400 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-wider">AI Audit</span>
                </div>
                {auditedCount != null && (
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-200 text-[9px] font-black shrink-0">
                    {auditedCount} boxes
                  </span>
                )}
              </div>
              {derivedFormula && (
                <div className="text-[9px] font-mono text-amber-200/80 leading-tight">
                  {derivedFormula}
                </div>
              )}
            </div>
            {reasoningOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {reasoningOpen && (
            <div className="px-2.5 pb-2.5 space-y-2">
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-lg bg-black/30 border border-white/8 p-1.5 text-center">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide">Visible</div>
                  <div className="text-[11px] font-black text-emerald-300">{visibleCount ?? '—'}</div>
                </div>
                <div className="rounded-lg bg-black/30 border border-white/8 p-1.5 text-center">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide">Depth</div>
                  <div className="text-[11px] font-black text-blue-300">{depthLayers ?? '—'}</div>
                </div>
              </div>

              {/* Gemini rows × cols × depth */}
              {(geminiVisibleRows || geminiVisibleCols || geminiEstimatedDepth) && (
                <div className="rounded-lg bg-black/30 border border-purple-500/15 p-1.5">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">AI Face Analysis</div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-purple-200">
                    <span>{geminiVisibleRows ?? '?'} rows</span>
                    <span className="text-slate-500">×</span>
                    <span>{geminiVisibleCols ?? '?'} cols</span>
                    <span className="text-slate-500">×</span>
                    <span>{geminiEstimatedDepth ?? '?'} depth</span>
                  </div>
                </div>
              )}

              {/* Reasoning */}
              {geminiReasoning && (
                <div className="rounded-lg bg-black/30 border border-white/8 px-2 py-1.5">
                  <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">AI Reasoning</div>
                  <p className="text-[9px] text-slate-300 leading-relaxed">{geminiReasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PlaceholderTile({ index }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed border-white/12 bg-black/20 flex items-center justify-center">
      <div className="text-xs text-slate-300/60">Camera {index + 1}</div>
    </div>
  )
}

export default function MultiCctvPanel({
  cameras,
  layout,
  onAddCamera,
  onOpenUpload,
  onLive,
  onRemoveCamera,
  userId = 'admin',
  panelTitle = 'Multi-CCTV Surveillance',
  uploadLabel = 'Upload Video',
}) {
  const cameraIds = useMemo(() => Object.keys(cameras ?? {}), [cameras])
  const counts = useMemo(() => cameraIds.map(id => cameras[id]?.count ?? 0), [cameraIds, cameras])
  const total = useMemo(() => counts.reduce((s, n) => s + (n || 0), 0), [counts])

  const rows = layout?.rows ?? 2
  const cols = layout?.cols ?? 2
  const slots = Math.max(1, rows * cols)

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/6">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">{panelTitle}</h3>
          <span className="px-3 py-1 rounded-full bg-brand-500/12 border border-brand-500/25 text-brand-600 dark:text-brand-400 text-xs font-black">
            Total: {total}
          </span>
          <span className="px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-gray-300 text-xs font-bold">
            {cameraIds.length} Cameras
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddCamera}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/4 border border-black/10 dark:border-white/8 text-slate-700 dark:text-gray-200 text-xs font-bold hover:border-brand-300 dark:hover:border-white/15 transition-all"
          >
            <Plus size={14} />
            Add Camera
          </button>
          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-black shadow-neon-green hover:bg-brand-400"
          >
            <Upload size={14} />
            {uploadLabel}
          </button>
          <button
            onClick={onLive}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/4 border border-red-500/40 text-red-500 text-xs font-black hover:bg-red-500/10 transition-all"
          >
            <Radio size={14} />
            Live Camera
          </button>
        </div>
      </div>

      <div className="p-4">
        {cameraIds.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-black/15 dark:border-white/10 bg-black/5 dark:bg-black/30 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-gray-500"
            style={{ aspectRatio: '16/9', maxHeight: 520 }}
          >
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-14 h-14 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center"
            >
              <Plus size={22} />
            </motion.div>
            <p className="text-sm">Click “Add Camera” to get started</p>
          </div>
        ) : (
          <div
            className={cn('grid gap-3 bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.90))] rounded-2xl p-3', 'border border-white/8')}
            style={{ gridTemplateColumns: `repeat(${Math.max(1, cols)}, minmax(0, 1fr))`, minHeight: 360 }}
          >
            {Array.from({ length: slots }).map((_, idx) => {
              const id = cameraIds[idx]
              if (!id) return <PlaceholderTile key={`placeholder-${idx}`} index={idx} />
              return (
                <CameraTile
                  key={id}
                  cameraId={id}
                  index={idx}
                  cam={cameras[id]}
                  onRemove={onRemoveCamera}
                  userId={userId}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
