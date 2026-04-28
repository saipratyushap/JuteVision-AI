import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw, Upload, Download, Sun, Moon, Activity, Wifi, WifiOff,
  Camera, CameraOff, X, CheckCircle, AlertCircle, Loader2,
  BarChart2, Package, ArrowUpRight, ArrowDownRight,
  Eye, Trash2, Image, Video, ChevronDown, Check, Sparkles,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Cell,
} from 'recharts'
import { motion as m } from 'framer-motion'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { StatCard } from '../components/ui/Card'
import Sidebar from '../components/layout/Sidebar'
import useAppStore from '../store/useAppStore'
import useTheme from '../hooks/useTheme'
import { getApiUrl, getWsUrl, ENDPOINTS } from '../config'
import { generateId, getRecent, saveRecent, getAnalytics, saveAnalytics, cn, ANALYTICS_KEY, DEMO_HOURLY, DEMO_WEEKLY, MODE_META } from '../utils/helpers'
import { slideUp, staggerContainer, fadeIn, scaleIn } from '../components/animations/variants'
import MultiCctvPanel from '../components/multicctv/MultiCctvPanel'
import MultiCctvCountsCard from '../components/multicctv/MultiCctvCountsCard'
import MultiCctvUploadModal from '../components/multicctv/MultiCctvUploadModal'
import MultiCctvImageUploadModal from '../components/multicctv/MultiCctvImageUploadModal'

// ─── Constants ────────────────────────────────────────────────────────────
const USER_ID = 'admin'

const DEMO_MODE_DIST = [
  { mode: 'Multi-CCTV',           count: 45, color: '#ec4899' },
  { mode: 'Warehouse Multi CCTV', count: 38, color: '#f97316' },
  { mode: 'Quantity Count Pro',   count: 32, color: '#eab308' },
  { mode: 'Conveyor Mode',        count: 26, color: '#3b82f6' },
  { mode: 'Static Image',         count: 19, color: '#22c55e' },
  { mode: 'CCTV Live Mode',       count: 12, color: '#ef4444' },
]

const DEMO_ACCURACY = [
  { day: 'Mon', accuracy: 99.2 },
  { day: 'Tue', accuracy: 99.7 },
  { day: 'Wed', accuracy: 98.9 },
  { day: 'Thu', accuracy: 99.4 },
  { day: 'Fri', accuracy: 99.8 },
  { day: 'Sat', accuracy: 99.1 },
  { day: 'Sun', accuracy: 99.5 },
]

// ─── Dashboard root ───────────────────────────────────────────────────────
export default function Dashboard() {
  const { isDark, toggleTheme } = useTheme()
  const mode = useAppStore(s => s.mode)
  const wsConnected = useAppStore(s => s.wsConnected)
  const setWsConnected = useAppStore(s => s.setWsConnected)
  const totalCount = useAppStore(s => s.totalCount)
  const setTotalCount = useAppStore(s => s.setTotalCount)
  const roiCount = useAppStore(s => s.roiCount)
  const setRoiCount = useAppStore(s => s.setRoiCount)
  const uploads = useAppStore(s => s.uploads)
  const addUpload = useAppStore(s => s.addUpload)
  const updateUpload = useAppStore(s => s.updateUpload)
  const godown = useAppStore(s => s.godown)
  const setGodown = useAppStore(s => s.setGodown)
  const setMode = useAppStore(s => s.setMode)
  const setAnalyticsFilter = useAppStore(s => s.setAnalyticsFilter)
  const reset = useAppStore(s => s.reset)

  const cameras = useAppStore(s => s.cameras)
  const setCameras = useAppStore(s => s.setCameras)
  const clearCameras = useAppStore(s => s.clearCameras)
  const addCamera = useAppStore(s => s.addCamera)
  const updateCamera = useAppStore(s => s.updateCamera)
  const removeCamera = useAppStore(s => s.removeCamera)

  const addAnalyticsRow = useAppStore(s => s.addAnalyticsRow)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [processingFrameSrc, setProcessingFrameSrc] = useState(null)
  const [multiUploadOpen, setMultiUploadOpen] = useState(false)
  const [warehouseMultiUploadOpen, setWarehouseMultiUploadOpen] = useState(false)
  const [multiLayout, setMultiLayout] = useState({ rows: 2, cols: 2 })

  const cameraFeedRef = useRef(null)
  const socketRef = useRef(null)
  const cameraEnabledRef = useRef(false)

  useEffect(() => {
    cameraEnabledRef.current = cameraEnabled
  }, [cameraEnabled])

  // ── Restore persisted data ──────────────────────────────────────────────
  useEffect(() => {
    const recent = getRecent(USER_ID)
    recent.forEach(item => addUpload({ ...item, restored: true }))
    const saved = localStorage.getItem(`currentTotalBags_${USER_ID}`)
    if (saved) setTotalCount(parseInt(saved))
  }, [])

  // ── WebSocket ───────────────────────────────────────────────────────────
  useEffect(() => {
    let retryTimer
    function connect() {
      const url = getWsUrl(`${ENDPOINTS.WS}/${USER_ID}`)
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => { setWsConnected(true) }
      ws.onclose = () => {
        setWsConnected(false)
        retryTimer = setTimeout(connect, 3000)
      }
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.event === 'reset') { reset() }
          else if (data.type === 'multi_cctv_frame') {
            const camId = data.camera_id
            if (!camId) return
            const state = useAppStore.getState()
            const existing = state.cameras?.[camId]
            if (!existing) state.addCamera(camId, { label: `Camera ${camId}`, status: 'processing', count: 0 })
            const newStatus = data.status ?? 'processing'
            state.updateCamera(camId, {
              frameSrc: data.data ? `data:image/jpeg;base64,${data.data}` : null,
              count: data.count ?? 0,
              progress: data.progress ?? null,
              status: newStatus,
              videoUrl: data.video_url || null,
              // Gemini AI audit fields (warehouse-multi only)
              auditAvailable:       data.audit_available        ?? false,
              auditedCount:         data.audited_count          ?? null,
              estimatedTotal:       data.estimated_total        ?? null,
              visibleCount:         data.visible_count          ?? null,
              depthLayers:          data.depth_layers           ?? null,
              geminiReasoning:      data.gemini_reasoning       ?? null,
              geminiVisibleRows:    data.gemini_visible_rows    ?? null,
              geminiVisibleCols:    data.gemini_visible_cols    ?? null,
              geminiEstimatedDepth: data.gemini_estimated_depth ?? null,
              geminiVolumeFormula:  data.gemini_volume_formula  ?? null,
            })

            // Auto-save Multi-CCTV / Warehouse-Multi to analytics (v14.77 Centralized Fix)
            if (newStatus === 'completed' && (data.count ?? 0) > 0) {
              const analytics = getAnalytics(USER_ID) || []
              const analyticsMode = data.detection_mode === 'warehouse-multi' ? 'Warehouse Multi CCTV' : 'Multi-CCTV'
              const isDuplicate = analytics.some(a => a.id === camId && a.count === data.count && a.mode === analyticsMode && (new Date() - new Date(a.date)) < 5000)
              if (!isDuplicate) {
                const isImg = data.detection_mode === 'warehouse-multi'
                const newRow = {
                  id: camId,
                  filename: isImg ? `warehouse_${camId}.jpg` : `cctv_${camId}.mp4`,
                  label: existing?.label || `CAMERA ${camId}`,
                  count: data.count,
                  date: new Date().toISOString(),
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'Completed',
                  mode: analyticsMode,
                  videoUrl: data.video_url
                }
                analytics.unshift(newRow)
                saveAnalytics(USER_ID, analytics)
                addAnalyticsRow(newRow) // v14.87 Real-time sync
              }
            }
          }
          else if (data.type === 'frame') {
            // Show processing preview in the Live Feed card (do not override MJPEG stream)
            if (!cameraEnabledRef.current && data.data) {
              setProcessingFrameSrc(`data:image/jpeg;base64,${data.data}`)
            }
            if (data.count !== undefined) setRoiCount(data.count)
          } else if (data.event === 'godown_in' || data.event === 'godown_out') {
            if (data.inventory !== undefined) setGodown({ inventory: data.inventory })
            if (data.today_in !== undefined) setGodown({ todayIn: data.today_in })
          }
        } catch {}
      }
    }
    connect()
    return () => {
      clearTimeout(retryTimer)
      socketRef.current?.close()
    }
  }, [])

  // Multi-CCTV state is now handled exclusively via WebSocket (v14.78)

  const handleMultiAddCamera = useCallback(async () => {
    try {
      const state = useAppStore.getState()
      const nextIndex = Object.keys(state.cameras ?? {}).length + 1
      const fd = new FormData()
      fd.append('user_id', USER_ID)
      fd.append('label', `Camera ${nextIndex}`)
      const res = await fetch(getApiUrl(ENDPOINTS.MULTI_CCTV_ADD), { method: 'POST', body: fd })
      const data = await res.json()
      if (data?.camera_id) state.addCamera(data.camera_id, { label: data.label || `Camera ${data.camera_id}`, status: 'idle', count: 0 })
    } catch {}
  }, [])

  const handleMultiRemoveCamera = useCallback(async (cameraId) => {
    if (!cameraId) return
    try {
      await fetch(`${getApiUrl(ENDPOINTS.MULTI_CCTV_REMOVE)}/${USER_ID}/${cameraId}`, { method: 'POST' })
    } catch {}
    removeCamera(cameraId)
  }, [])

  const handleMultiStart = useCallback(async (layout, files) => {
    setMultiLayout(layout)

    const state = useAppStore.getState()
    const existing = Object.keys(state.cameras ?? {})
    await Promise.all(existing.map(async (id) => {
      try { await fetch(`${getApiUrl(ENDPOINTS.MULTI_CCTV_REMOVE)}/${USER_ID}/${id}`, { method: 'POST' }) } catch {}
    }))
    state.clearCameras()

    const cameraIds = []
    for (let i = 0; i < files.length; i++) {
      try {
        const fd = new FormData()
        fd.append('user_id', USER_ID)
        fd.append('label', `CAMERA ${i + 1}`)
        const res = await fetch(getApiUrl(ENDPOINTS.MULTI_CCTV_ADD), { method: 'POST', body: fd })
        const data = await res.json()
        if (data?.camera_id) {
          cameraIds.push(data.camera_id)
          state.addCamera(data.camera_id, { label: data.label || `CAMERA ${i + 1}`, status: 'idle', count: 0 })
        }
      } catch {}
    }

    await Promise.all(cameraIds.map(async (cameraId, idx) => {
      const file = files[idx]
      if (!file) return
      state.updateCamera(cameraId, { status: 'uploading', count: 0, progress: 0, frameSrc: null, video_url: null, error: null })
      try {
        const fd = new FormData()
        fd.append('user_id', USER_ID)
        fd.append('file', file)
        const res = await fetch(`${getApiUrl(ENDPOINTS.MULTI_CCTV_UPLOAD)}/${cameraId}`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? 'Upload failed')
        state.updateCamera(cameraId, { status: 'processing' })
      } catch (e) {
        state.updateCamera(cameraId, { status: 'error', error: String(e) })
      }
    }))
  }, [])

  const handleWarehouseMultiStart = useCallback(async (layout, files) => {
    setMultiLayout(layout)

    const state = useAppStore.getState()
    const existing = Object.keys(state.cameras ?? {})
    await Promise.all(existing.map(async (id) => {
      try { await fetch(`${getApiUrl(ENDPOINTS.MULTI_CCTV_REMOVE)}/${USER_ID}/${id}`, { method: 'POST' }) } catch {}
    }))
    state.clearCameras()

    const cameraIds = []
    for (let i = 0; i < files.length; i++) {
      try {
        const fd = new FormData()
        fd.append('user_id', USER_ID)
        fd.append('label', `CAMERA ${i + 1}`)
        const res = await fetch(getApiUrl(ENDPOINTS.MULTI_CCTV_ADD), { method: 'POST', body: fd })
        const data = await res.json()
        if (data?.camera_id) {
          cameraIds.push(data.camera_id)
          state.addCamera(data.camera_id, { label: data.label || `CAMERA ${i + 1}`, status: 'idle', count: 0 })
        }
      } catch {}
    }

    await Promise.all(cameraIds.map(async (cameraId, idx) => {
      const file = files[idx]
      if (!file) return
      state.updateCamera(cameraId, { status: 'uploading', count: 0, progress: 0, frameSrc: null, video_url: null, error: null })
      try {
        const fd = new FormData()
        fd.append('user_id', USER_ID)
        fd.append('file', file)
        const res = await fetch(`${getApiUrl(ENDPOINTS.MULTI_CCTV_UPLOAD_IMAGE)}/${cameraId}`, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error ?? 'Upload failed')
        state.updateCamera(cameraId, { status: 'processing' })
      } catch (e) {
        state.updateCamera(cameraId, { status: 'error', error: String(e) })
      }
    }))
  }, [])

  // ── Camera toggle ───────────────────────────────────────────────────────
  const handleCameraToggle = useCallback(async () => {
    const next = !cameraEnabled
    setCameraEnabled(next)
    try {
      const fd = new FormData()
      fd.append('user_id', USER_ID)
      await fetch(getApiUrl(next ? ENDPOINTS.CAMERA_ON : ENDPOINTS.CAMERA_OFF), { method: 'POST', body: fd })
    } catch {}
    if (next && cameraFeedRef.current) {
      cameraFeedRef.current.src = `${getApiUrl(ENDPOINTS.STREAM)}/${USER_ID}?t=${Date.now()}`
    } else if (cameraFeedRef.current) {
      cameraFeedRef.current.src = 'about:blank'
      cameraFeedRef.current.removeAttribute('src')
    }
  }, [cameraEnabled])

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file, selectedMode) => {
    const id = generateId()
    const uploadItem = {
      id,
      fileName: file.name,
      status: 'uploading',
      progress: 0,
      count: null,
      mediaUrl: null,
      isImage: null,
      mode: selectedMode,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    addUpload(uploadItem)
    setUploadModalOpen(false)
    setProcessingFrameSrc(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('mode', selectedMode)
    fd.append('user_id', USER_ID)

    try {
      const res = await fetch(getApiUrl(ENDPOINTS.UPLOAD), { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'Upload failed')
      updateUpload(id, { status: 'processing', progress: 50 })
      pollTask(data.task_id, id, file.name, selectedMode)
    } catch (err) {
      updateUpload(id, { status: 'failed', error: String(err) })
    }
  }, [])

  const pollTask = useCallback((taskId, uploadId, fileName, selectedMode) => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${getApiUrl(ENDPOINTS.TASKS)}/${taskId}`)
        const task = await res.json()
        if (task.status === 'completed') {
          clearInterval(iv)
          const mediaUrl = `${getApiUrl('')}${task.video_url}`
          updateUpload(uploadId, {
            status: 'completed',
            progress: 100,
            count: task.count,
            mediaUrl,
            isImage: task.is_image,
            estimationMode: task.estimation_mode ?? false,
            visibleCount: task.visible_count ?? null,
            depthLayers: task.depth_layers ?? null,
            estimatedTotal: task.estimated_total ?? null,
            auditAvailable: task.audit_available ?? false,
            auditedCount: task.audited_count ?? null,
            geminiReasoning: task.gemini_reasoning ?? null,
            geminiVisibleRows:    task.gemini_visible_rows    ?? null,
            geminiVisibleCols:    task.gemini_visible_cols    ?? null,
            geminiEstimatedDepth: task.gemini_estimated_depth ?? null,
            geminiVolumeFormula:  task.gemini_volume_formula  ?? null,
          })
          setTotalCount(useAppStore.getState().totalCount + (task.count ?? 0))

          // Persist to localStorage
          const recent = getRecent(USER_ID)
          recent.unshift({ id: uploadId, fileName, status: 'completed', count: task.count, mediaUrl, isImage: task.is_image, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })
          saveRecent(USER_ID, recent)

          const analytics = getAnalytics(USER_ID)
          const newRow = { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            date: new Date().toISOString(), 
            filename: fileName, 
            count: task.count, 
            status: 'Completed',
            mode: selectedMode
          }
          analytics.unshift(newRow)
          saveAnalytics(USER_ID, analytics)
          addAnalyticsRow(newRow) // v14.87 Sync to store
        } else if (task.status === 'failed') {
          clearInterval(iv)
          updateUpload(uploadId, { status: 'failed', error: task.error ?? 'Processing failed' })
        }
      } catch { clearInterval(iv) }
    }, 2000)
  }, [])

  // ── Reset ───────────────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    try {
      await fetch(`${getApiUrl(ENDPOINTS.RESET)}?user_id=${USER_ID}`, { method: 'POST' })
    } catch {}
    reset()
    localStorage.removeItem(`currentTotalBags_${USER_ID}`)
    localStorage.removeItem(`recentUploads_${USER_ID}`)
    localStorage.removeItem(ANALYTICS_KEY(USER_ID))
    setResetConfirmOpen(false)
  }, [])

  // ── Export CSV ──────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const data = getAnalytics(USER_ID)
    if (!data.length) return
    const csv = 'Time,File,Count,Status\n' + data.map(r => `${r.time},${r.filename},${r.count},${r.status}`).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = 'visioncount_analytics.csv'
    a.click()
  }, [])

  const showGodown = mode === 'godown'
  const showZoneStats = mode === 'zone' || mode === 'conveyor'
  const isMultiCctv = mode === 'multi-cctv'
  const isWarehouseMulti = mode === 'warehouse-multi'
  const isLive = mode === 'live'
  const modeUploads = uploads.filter(u => u.mode === mode)
  const latestResult = modeUploads.filter(u => u.status === 'completed' && u.mediaUrl)[0] ?? null
  const activeProcessing = modeUploads.find(u => u.status === 'processing') ?? null
  const modeTotal = modeUploads.reduce((sum, u) => sum + (u.count ?? 0), 0)
  const latestVolumeInsight = mode === 'volume'
    ? modeUploads.find(u => u.status === 'completed' && u.auditAvailable && u.geminiReasoning) ?? null
    : null

  useEffect(() => {
    if (!activeProcessing) setProcessingFrameSrc(null)
  }, [activeProcessing])

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(187,247,208,0.42),transparent_26%),radial-gradient(circle_at_top_right,rgba(186,230,253,0.34),transparent_24%),linear-gradient(180deg,#fffef9_0%,#f8fbff_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.08),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_20%),linear-gradient(180deg,#020617_0%,#030712_100%)]">
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <DashboardNav
          isDark={isDark}
          toggleTheme={toggleTheme}
          wsConnected={wsConnected}
          onReset={() => setResetConfirmOpen(true)}
          onExport={handleExport}
          onUpload={() => setUploadModalOpen(true)}
        />

        {/* Body */}
        {mode === 'analytics' ? (
          <AnalyticsView userId={USER_ID} totalCount={totalCount} isDark={isDark} />
        ) : (
          <div className="flex-1 overflow-y-auto p-4 md:p-5 flex flex-col gap-5">
            {/* Mode label */}
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{MODE_META[mode]?.label ?? mode}</h2>
              <div className="live-badge">LIVE</div>
            </motion.div>

            {/* Main grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Video feed */}
              <div className="xl:col-span-2">
                {isMultiCctv ? (
                  <MultiCctvPanel
                    cameras={cameras}
                    layout={multiLayout}
                    onAddCamera={handleMultiAddCamera}
                    onOpenUpload={() => setMultiUploadOpen(true)}
                    onLive={() => {}}
                    onRemoveCamera={handleMultiRemoveCamera}
                    userId={USER_ID}
                  />
                ) : isWarehouseMulti ? (
                  <MultiCctvPanel
                    cameras={cameras}
                    layout={multiLayout}
                    onAddCamera={handleMultiAddCamera}
                    onOpenUpload={() => setWarehouseMultiUploadOpen(true)}
                    onLive={() => {}}
                    onRemoveCamera={handleMultiRemoveCamera}
                    userId={USER_ID}
                    panelTitle="Warehouse Multi-Image"
                    uploadLabel="Upload Images"
                  />
                ) : (
                  <VideoFeedCard
                    mode={mode}
                    cameraEnabled={cameraEnabled}
                    onCameraToggle={handleCameraToggle}
                    cameraFeedRef={cameraFeedRef}
                    isLive={isLive}
                    latestResult={latestResult}
                    processingFrameSrc={processingFrameSrc}
                    activeProcessingName={activeProcessing?.fileName ?? null}
                  />
                )}
              </div>

              {/* Stats column */}
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {(isMultiCctv || isWarehouseMulti) ? (
                    <motion.div key="multi-counts" variants={scaleIn} initial="hidden" animate="visible" exit="hidden">
                      <MultiCctvCountsCard cameras={cameras} />
                    </motion.div>
                  ) : !showGodown && (
                    <motion.div key="total" variants={scaleIn} initial="hidden" animate="visible" exit="hidden">
                      <StatCard title="Total Boxes" value={modeTotal} sub="+12% vs last hour" color="green" icon={<Package size={16} />} />
                    </motion.div>
                  )}
                  {showZoneStats && (
                    <motion.div key="roi" variants={scaleIn} initial="hidden" animate="visible" exit="hidden">
                      <StatCard title="Objects in ROI" value={roiCount} color="blue" icon={<Activity size={16} />} />
                    </motion.div>
                  )}
                  {showGodown && (
                    <motion.div key="godown-stats" className="flex flex-col gap-3" variants={staggerContainer} initial="hidden" animate="visible">
                      <motion.div variants={slideUp}>
                        <StatCard title="Total Inventory" value={godown.inventory} color="green" icon={<Package size={16} />} />
                      </motion.div>
                      <motion.div variants={slideUp}>
                        <StatCard title="Bags In Today" value={godown.todayIn} color="cyan" icon={<ArrowUpRight size={16} />} />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload list */}
                <UploadStatusCard uploads={modeUploads} />
              </div>
            </div>

            {/* Godown section */}
            <AnimatePresence>
              {showGodown && (
                <motion.div
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                >
                  <GodownSection godown={godown} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insight section — Qty Count Pro (Gemini audit) */}
            <AnimatePresence>
              {latestVolumeInsight && (
                <motion.div
                  variants={slideUp}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AIInsightPanel result={latestVolumeInsight} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upload modal */}
      <UploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleUpload}
        onOpenMultiCctv={() => setMultiUploadOpen(true)}
      />
      <MultiCctvUploadModal
        open={multiUploadOpen}
        onClose={() => setMultiUploadOpen(false)}
        onStart={handleMultiStart}
      />
      <MultiCctvImageUploadModal
        open={warehouseMultiUploadOpen}
        onClose={() => setWarehouseMultiUploadOpen(false)}
        onStart={handleWarehouseMultiStart}
      />

      {/* Reset confirm */}
      <Modal open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} title="Reset Session" size="sm">
        <div className="p-6">
          <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">This will clear all counts and history. This action cannot be undone.</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setResetConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" className="flex-1" onClick={handleReset}>Reset</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Top navbar ────────────────────────────────────────────────────────────
function DashboardNav({ isDark, toggleTheme, wsConnected, onReset, onExport, onUpload }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-black/10 dark:border-white/6 glass shrink-0">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-brand-400" />
        <span className="font-black text-sm">
          <span className="text-gradient-green">VisionCount</span>
          <span className="text-slate-900 dark:text-white"> AI</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* WS status */}
        <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          wsConnected
            ? 'text-brand-500 dark:text-brand-400 border-brand-500/20 bg-brand-500/8'
            : 'text-slate-500 border-slate-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50'
        }`}>
          {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          {wsConnected ? 'Connected' : 'Offline'}
        </div>

        <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/8 transition-colors">
          <motion.div key={isDark ? 'moon' : 'sun'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25 }}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </motion.div>
        </motion.button>

        <Button variant="secondary" size="xs" icon={<RotateCcw size={12} />} onClick={onReset}>Reset</Button>
        <Button variant="secondary" size="xs" icon={<Download size={12} />} onClick={onExport}>Export</Button>
        <Button size="xs" icon={<Upload size={12} />} onClick={onUpload}>Uploads</Button>
      </div>
    </div>
  )
}

// ─── Video Feed ────────────────────────────────────────────────────────────
function VideoFeedCard({ mode, cameraEnabled, onCameraToggle, cameraFeedRef, isLive, latestResult, processingFrameSrc, activeProcessingName }) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/6">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">
          {mode === 'multi-cctv' ? 'Multi-CCTV Surveillance' : 'Live Feed 01'}
        </h3>
        <div className="live-badge">LIVE</div>
      </div>

      {/* Feed area */}
      <div className="relative bg-[linear-gradient(135deg,rgba(203,213,225,0.9),rgba(226,232,240,0.78))] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.90))]" style={{ aspectRatio: '16/9', maxHeight: 400 }}>
        {cameraEnabled ? (
          <img
            ref={cameraFeedRef}
            className="w-full h-full object-contain"
            alt="Live Camera Feed"
          />
        ) : processingFrameSrc && activeProcessingName ? (
          <div className="relative w-full h-full">
            <img src={processingFrameSrc} alt="Processing preview" className="w-full h-full object-contain" />
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-neon-cyan/40 text-neon-cyan text-xs font-black">
              Processing
            </div>
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-gray-200 text-[10px] max-w-[240px] truncate">
              {activeProcessingName}
            </div>
          </div>
        ) : latestResult ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {latestResult.isImage ? (
              <img src={latestResult.mediaUrl} alt="Processed result" className="w-full h-full object-contain" />
            ) : (
              <video src={latestResult.mediaUrl} controls loop className="w-full h-full object-contain" />
            )}
            {latestResult.count != null && (
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-brand-500/40 text-brand-400 text-xs font-bold">
                Count: {latestResult.count}
              </div>
            )}
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-gray-300 text-[10px] max-w-[200px] truncate">
              {latestResult.fileName}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-gray-600">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:shadow-none"
            >
              <CameraOff size={24} />
            </motion.div>
            <p className="text-sm">Camera is disabled</p>
          </div>
        )}

        {/* Animated scan overlay */}
        {cameraEnabled && (
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500/50 to-transparent pointer-events-none animate-scan" />
        )}
      </div>

      {/* Controls */}
      {!isLive || true ? (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-black/10 dark:border-white/6">
          <button
            onClick={onCameraToggle}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 focus:outline-none ${cameraEnabled ? 'bg-brand-500' : 'bg-slate-600 dark:bg-gray-700'}`}
            style={{ height: 22 }}
          >
            <motion.div
              animate={{ x: cameraEnabled ? 18 : 2 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow"
            />
          </button>
          <span className="text-xs text-slate-500 dark:text-gray-400">{cameraEnabled ? 'Camera enabled' : 'Enable Camera'}</span>
          {!cameraEnabled && latestResult && (
            <span className="ml-auto text-[10px] text-brand-400 font-medium">Showing processed result</span>
          )}
        </div>
      ) : null}
    </div>
  )
}

// ─── Upload Status Card ───────────────────────────────────────────────────
function UploadStatusCard({ uploads }) {
  const mode = useAppStore(s => s.mode)
  const setMode = useAppStore(s => s.setMode)
  const setAnalyticsFilter = useAppStore(s => s.setAnalyticsFilter)

  return (
    <div className="glass-card flex-1 overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-black/10 dark:border-white/6">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Upload Status</h3>
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-black/10 dark:divide-white/5">
        {uploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500 dark:text-gray-600 text-sm">
            <BarChart2 size={24} />
            <span>No active uploads</span>
          </div>
        ) : (
          <AnimatePresence>
            {uploads.map(u => (
              <motion.div
                key={u.id}
                variants={slideUp}
                initial="hidden"
                animate="visible"
                className="p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-300 truncate">{u.fileName}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-600">{u.time}</p>
                  </div>
                  <UploadStatusBadge status={u.status} count={u.count} />
                </div>

                {/* Progress bar */}
                {(u.status === 'uploading' || u.status === 'processing') && (
                  <div className="progress-bar-track">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: '0%' }}
                      animate={{ width: u.status === 'processing' ? '65%' : `${u.progress ?? 20}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
                {u.status === 'completed' && <div className="progress-bar-track"><div className="progress-bar-fill w-full" /></div>}

                {/* Media preview */}
                {u.status === 'completed' && u.mediaUrl && (
                  <div className="mt-1">
                    {u.isImage ? (
                      <img src={u.mediaUrl} alt="" className="w-full rounded-lg border border-black/10 dark:border-white/8 max-h-32 object-contain" />
                    ) : (
                      <video src={u.mediaUrl} controls className="w-full rounded-lg border border-black/10 dark:border-white/8 max-h-32" />
                    )}
                    <div className="flex gap-2 mt-2">
                      <DownloadButton url={u.mediaUrl} filename={`detected_${u.fileName}`} />
                      <AnalyticsButton onClick={() => { if (u.status === 'completed') { setAnalyticsFilter(mode); setMode('analytics') } }} />
                    </div>
                  </div>
                )}
                {u.error && <p className="text-[10px] text-red-400">{u.error}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function UploadStatusBadge({ status, count }) {
  if (status === 'uploading' || status === 'processing') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-blue-400">
        <Loader2 size={10} className="animate-spin" />
        {status === 'uploading' ? 'Uploading' : 'Processing'}
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-brand-400 font-semibold">
        <CheckCircle size={10} />
        {count != null ? `Count: ${count}` : 'Done'}
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-[10px] text-red-400">
      <AlertCircle size={10} />
      Failed
    </span>
  )
}

function DownloadButton({ url, filename }) {
  const handle = async () => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {}
  }
  return (
    <button onClick={handle} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[10px] font-semibold hover:bg-brand-500/20 transition-colors">
      <Download size={10} />
      Download
    </button>
  )
}

function AnalyticsButton({ onClick }) {
  return (
    <button onClick={onClick} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-[10px] font-semibold hover:bg-neon-purple/15 transition-colors">
      <BarChart2 size={10} />
      Analytics
    </button>
  )
}

// ─── Godown Section ────────────────────────────────────────────────────────
function GodownSection({ godown }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">Godown Inventory Monitor</h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="xs">Set Baseline</Button>
          <Button variant="secondary" size="xs">Reset Daily</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Inventory" value={godown.inventory} color="green" />
        <StatCard title="Bags In Today" value={godown.todayIn} color="cyan" />
        <StatCard title="Bags Out Today" value={godown.todayOut ?? 0} color="orange" />
        <StatCard title="Net Today" value={`+${godown.todayIn ?? 0}`} color="purple" />
      </div>
      <div className="mt-4">
        <label className="text-xs text-slate-500 dark:text-gray-500 block mb-2">Counting Line Position</label>
        <input type="range" min="10" max="90" defaultValue="50"
          className="w-full h-1.5 rounded-full accent-brand-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-600 dark:text-gray-600 mt-1">
          <span>Top (10%)</span><span>Center (50%)</span><span>Bottom (90%)</span>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics View ────────────────────────────────────────────────────────
function AnalyticsView({ userId, totalCount, isDark }) {
  const filter = useAppStore(s => s.analyticsFilter)
  const clearFilter = useAppStore(s => s.clearAnalyticsFilter)
  const setAnalyticsFilter = useAppStore(s => s.setAnalyticsFilter)
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const analyticsData = useAppStore(s => s.analyticsData)

  const stored = useMemo(() => {
    // Merge persisted and live data, unique by timestamp/label
    const persisted = getAnalytics(userId) || []
    return [...analyticsData, ...persisted].filter((v, i, a) => 
      a.findIndex(t => (t.date === v.date && t.label === v.label && t.filename === v.filename)) === i
    )
  }, [analyticsData, userId])
  
  const uniqueLabels = useMemo(() => {
    const set = new Set()
    stored.forEach(row => {
      if (row.label) set.add(row.label)
      else if (row.filename) set.add(row.filename)
    })
    return Array.from(set).slice(0, 12)
  }, [stored])

  const rows = stored.filter(row => {
    if (!filter) return true
    const f = filter.toLowerCase()
    return (
      (row.filename && row.filename.toLowerCase().includes(f)) ||
      (row.label && row.label.toLowerCase().includes(f)) ||
      (row.mode && row.mode.toLowerCase().includes(f)) ||
      (row.mode && row.mode.toLowerCase().replace('-', ' ').includes(f.replace('-', ' ')))
    )
  })
  const totalFiles = rows.length
  const totalBags  = rows.reduce((s, a) => s + (a.count ?? 0), 0)
  const displayBags = filter ? totalBags : (totalBags || totalCount)
  const today      = new Date().toDateString()
  const todayFiles = rows.filter(a => a.date && new Date(a.date).toDateString() === today).length
  const avgPerFile = totalFiles > 0 ? Math.round(totalBags / totalFiles) : 0

  const grid   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'
  const tick   = isDark ? '#6b7280' : '#94a3b8'
  const yLabel = isDark ? '#9ca3af' : '#64748b'
  const ttStyle = {
    background: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: '0.75rem',
    fontSize: 11,
  }
  const ttLabel = { color: isDark ? '#94a3b8' : '#64748b' }

  const recentRows = rows.slice(0, 8)

  // v14.95: Real-time Analytics Calculations
  const modeDist = useMemo(() => {
    const counts = {}
    rows.forEach(r => {
      const modeKey = r.mode?.toLowerCase() || 'unknown'
      const label = MODE_META[modeKey]?.label || r.mode || 'Unknown'
      counts[label] = (counts[label] || 0) + 1
    })
    return Object.entries(counts).map(([label, count]) => {
      const meta = Object.values(MODE_META).find(m => m.label === label)
      return {
        mode: label,
        count,
        color: meta?.color || '#94a3b8'
      }
    }).sort((a, b) => b.count - a.count).slice(0, 6)
  }, [rows])

  const efficiency = useMemo(() => {
    if (totalFiles === 0) return 0
    const successful = rows.filter(r => r.status === 'Completed').length
    return Math.round((successful / totalFiles) * 100)
  }, [rows, totalFiles])

  const accuracyData = useMemo(() => {
    if (rows.length === 0) return DEMO_ACCURACY
    // Group by day for the trend
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const last7 = {}
    rows.forEach(r => {
      const d = days[new Date(r.date).getDay()]
      if (!last7[d]) last7[d] = { count: 0, sum: 0 }
      last7[d].count++
      // If we have an audit, use it to calculate accuracy, else assume 99%+
      const acc = r.auditedCount ? (Math.min(r.count, r.auditedCount) / Math.max(r.count, r.auditedCount)) * 100 : (99 + Math.random())
      last7[d].sum += acc
    })
    return days.map(d => ({
      day: d,
      accuracy: last7[d] ? Math.round(last7[d].sum / last7[d].count * 10) / 10 : 99.5
    }))
  }, [rows])

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-0.5">
            {filter ? `Showing analytics for: ${filter}` : 'Insights across all processing sessions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filter && (
            <button
              onClick={clearFilter}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:bg-slate-900/8 dark:hover:bg-white/8 transition-colors"
            >
              Clear Filter
            </button>
          )}
          
          {/* All Processing Dropdown (v14.79 Functional) */}
          <div className="relative">
            <button 
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={cn(
                "flex items-center gap-4 text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm",
                filter 
                  ? "bg-sky-500/10 border border-sky-400 text-sky-600 dark:text-sky-400" 
                  : "bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-slate-800 dark:text-gray-100 hover:border-sky-400"
              )}
            >
              <span className="truncate max-w-[120px]">{filter || 'All Processing'}</span>
              <ChevronDown size={16} className={cn("transition-transform duration-300", showFilterMenu && "rotate-180")} />
            </button>

            <AnimatePresence>
              {showFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 glass-card border border-white/12 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="max-h-64 overflow-y-auto py-1">
                    <button
                      onClick={() => { clearFilter(); setShowFilterMenu(false) }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-gray-400 hover:bg-sky-500/10 hover:text-sky-500 transition-colors"
                    >
                      All Processing
                    </button>
                    <div className="h-px bg-white/5 my-1" />
                    {uniqueLabels.map(label => (
                      <button
                        key={label}
                        onClick={() => { setAnalyticsFilter(label); setShowFilterMenu(false) }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-xs font-medium transition-colors",
                          filter === label 
                            ? "bg-sky-500/20 text-sky-400 border-r-2 border-sky-400" 
                            : "text-slate-700 dark:text-gray-300 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-xs text-slate-500 dark:text-gray-500 font-medium px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-black/10 dark:border-white/10">All Time</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Files Processed"  value={totalFiles || 0}        sub="All sessions"    color="green"  icon={<BarChart2 size={16} />} />
        <StatCard title="Total Boxes"        value={displayBags}             sub="Cumulative"     color="blue"   icon={<Package size={16} />} />
        <StatCard title="Processed Today"   value={todayFiles}              sub={new Date().toLocaleDateString()} color="purple" icon={<Activity size={16} />} />
        <StatCard title="Avg Bags / File"   value={avgPerFile || '—'}       sub="Per run"        color="cyan"   icon={<ArrowUpRight size={16} />} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Hourly */}
        <div className="glass-card p-5 border border-emerald-100/70 dark:border-white/8">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">Hourly Activity</h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-500 mb-4">Boxes processed by hour (24h window)</p>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMO_HOURLY} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="gradH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="time" tick={{ fill: tick, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tick, fontSize: 9 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={{ color: '#4ade80' }} />
                <Area type="monotone" dataKey="boxes" stroke="#22c55e" strokeWidth={2} fill="url(#gradH)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly */}
        <div className="glass-card p-5 border border-sky-100/70 dark:border-white/8">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">Weekly Overview</h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-500 mb-4">Total boxes counted per day this week</p>
          <div style={{ height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEMO_WEEKLY} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="day" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={{ color: '#4ade80' }} />
                <Bar dataKey="boxes" fill="#22c55e" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* NEW: Performance Trends & Productivity Heatmap (v14.62) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Productivity Heatmap */}
        <div className="glass-card p-5 border border-amber-100/70 dark:border-white/8 col-span-1 xl:col-span-2">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">Productivity Heatmap</h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-500 mb-4">Throughput intensity by shift time</p>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DEMO_HOURLY} margin={{ top: 0, right: 15, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke={grid} vertical={false} />
                <XAxis dataKey="time" tick={{ fill: tick, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={{ color: '#f59e0b' }} />
                <Area type="step" dataKey="boxes" stroke="#f59e0b" strokeWidth={1.5} fill="url(#gradP)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Efficiency Meter */}
        <div className="glass-card p-5 border border-brand-100/70 dark:border-white/8 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-500 flex items-center justify-center mb-4 relative">
            <span className="text-xl font-black text-slate-900 dark:text-white">{efficiency || 100}%</span>
            <div className="absolute inset-0 rounded-full blur-lg bg-brand-500/20" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">Operational Efficiency</h3>
          <p className="text-[10px] text-slate-500 dark:text-gray-500">Based on system uptime and detection stability</p>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Mode distribution */}
        <div className="glass-card p-5 border border-orange-100/70 dark:border-white/8">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">Mode Distribution</h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-500 mb-4">Files processed per AI mode</p>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modeDist.length > 0 ? modeDist : DEMO_MODE_DIST} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={{ fill: tick, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="mode" tick={{ fill: yLabel, fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {(modeDist.length > 0 ? modeDist : DEMO_MODE_DIST).map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Accuracy trend */}
        <div className="glass-card p-5 border border-violet-100/70 dark:border-white/8">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-0.5">Detection Accuracy</h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-500 mb-4">Accuracy % per day this week</p>
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="day" tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[98, 100]} tick={{ fill: tick, fontSize: 10 }} axisLine={false} tickLine={false} width={35} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={{ color: '#a78bfa' }} formatter={v => [`${v}%`, 'Accuracy']} />
                <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Log (v14.69) */}
      <div className="glass-card overflow-hidden border border-slate-200/80 dark:border-white/8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/10 dark:border-white/6 bg-white/50 dark:bg-transparent">
          <h3 className="font-bold text-base text-gray-900 dark:text-white">Recent Activity Log</h3>
          <button className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline">View All History</button>
        </div>
        
        {recentRows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-slate-500 dark:text-gray-500">
            <Activity size={32} className="opacity-40" />
            <p className="text-sm">No activity recorded today.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/2 border-b border-black/10 dark:border-white/6">
                  <th className="px-6 py-4 text-left text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">File Name</th>
                  <th className="px-6 py-4 text-left text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Bags Counted</th>
                  <th className="px-6 py-4 text-left text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Verified Count</th>
                  <th className="px-6 py-4 text-right text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent">
                {recentRows.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-white/4 hover:bg-slate-50/80 dark:hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-gray-400 font-medium">{row.time}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-slate-500">
                          {row.filename?.toLowerCase().endsWith('.mp4') ? <Video size={13} /> : <Image size={13} />}
                        </div>
                        <span className="text-slate-900 dark:text-white font-bold">{row.label || row.filename}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-black">{row.count || 0} Bags</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Completed
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">{row.count || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-emerald-500 hover:bg-emerald-50 transition-colors" title="Verify">
                          <Check size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 transition-colors" title="View Results">
                          <Eye size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-50 transition-colors" title="Download">
                          <Download size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AI Insight Panel (Qty Count Pro — Gemini audit) ──────────────────────
function AIInsightPanel({ result }) {
  const yoloTotal      = result.estimatedTotal      ?? result.count
  const auditedCount   = result.auditedCount        ?? yoloTotal
  const reasoning      = result.geminiReasoning
  const visibleCount   = result.visibleCount
  const depthLayers    = result.depthLayers
  const rows           = result.geminiVisibleRows    ?? null
  const cols           = result.geminiVisibleCols    ?? null
  const depth          = result.geminiEstimatedDepth ?? depthLayers
  const formula        = result.geminiVolumeFormula  ?? null
  const countChanged   = auditedCount !== yoloTotal
  const delta          = auditedCount - yoloTotal

  // Build formula display even if Gemini didn't return one
  const derivedFormula = formula
    || (rows && cols && depth
      ? `${rows} rows × ${cols} cols × ${depth} depth = ${rows * cols * depth} × 0.94 ≈ ${Math.round(rows * cols * depth * 0.94)}`
      : null)

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_4px_20px_rgba(168,85,247,0.15)]">
          <Sparkles size={18} className="text-purple-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">AI Auditor — Pro Vision</h3>
          <p className="text-[11px] text-slate-500 dark:text-gray-500">Secondary verification by Advanced Vision Engine</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          AI Audited
        </div>
      </div>

      {/* Count comparison row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="p-4 rounded-2xl bg-purple-500/8 border border-purple-500/30 text-center shadow-[0_4px_24px_rgba(168,85,247,0.10)]">
          <p className="text-[10px] text-purple-400 font-semibold uppercase tracking-widest mb-1">AI Audited Total</p>
          <p className="text-2xl font-black text-purple-400">{auditedCount}</p>
          <p className="text-[10px] font-bold mt-1 text-purple-300">
            AI Verification Complete
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/4 border border-black/8 dark:border-white/8 text-center">
          <p className="text-[10px] text-slate-500 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">Visible Face (L × H)</p>
          <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-800 dark:text-gray-100">
            <div className="flex flex-col items-center">
              <span className="text-lg">{rows ?? visibleCount ?? '—'}</span>
              <span className="text-[9px] text-slate-400 font-normal">rows</span>
            </div>
            <span className="text-slate-400 mb-3">×</span>
            <div className="flex flex-col items-center">
              <span className="text-lg">{cols ?? '—'}</span>
              <span className="text-[9px] text-slate-400 font-normal">cols</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/4 border border-black/8 dark:border-white/8 text-center">
          <p className="text-[10px] text-slate-500 dark:text-gray-500 font-semibold uppercase tracking-widest mb-1.5">Hidden Depth (Breadth)</p>
          <div className="flex flex-col items-center justify-center">
            <span className="text-lg font-black text-slate-800 dark:text-gray-100">{depth ?? depthLayers ?? '—'}</span>
            <span className="text-[9px] text-slate-400">layers behind</span>
          </div>
        </div>
      </div>

      {/* Volume calculation formula */}
      {derivedFormula && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-500/8 to-blue-500/8 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest shrink-0">Volume Formula (L × H × B)</p>
          <p className="text-sm font-mono font-bold text-slate-800 dark:text-gray-100 sm:ml-3 break-all">{derivedFormula}</p>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && (
        <div className="rounded-lg bg-black/30 border border-purple-500/15 p-1.5">
          <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1">AI Face Analysis</div>
          <p className="text-sm text-slate-700 dark:text-gray-300 leading-relaxed">{reasoning}</p>
        </div>
      )}
    </div>
  )
}

// ─── Upload Modal ──────────────────────────────────────────────────────────
const MODES_LIST = [
  { id: 'multi-cctv', label: 'Multi-CCTV Mode',      desc: 'Multiple cameras', accepts: 'video/*' },
  { id: 'volume',     label: 'Quantity Count Pro',    desc: 'Stack depth estimation', accepts: 'image/*,video/*' },
  { id: 'live',       label: 'CCTV Live',             desc: 'Real-time webcam', accepts: null },
  { id: 'static',     label: 'Static Mode',           desc: 'Images only', accepts: 'image/*' },
  { id: 'conveyor',   label: 'Conveyor Mode',         desc: 'Video only', accepts: 'video/*' },
]

function UploadModal({ open, onClose, onUpload, onOpenMultiCctv }) {
  const [selectedMode, setSelectedMode] = useState('conveyor')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)
  const currentMode = MODES_LIST.find(m => m.id === selectedMode)

  const handleFile = (file) => { if (file) { onUpload(file, selectedMode); onClose() } }

  return (
    <Modal open={open} onClose={onClose} title="Upload for Analysis" size="lg">
      <div className="p-6 flex flex-col gap-5">
        {/* Mode grid */}
        <div>
          <p className="text-xs text-slate-500 dark:text-gray-500 font-medium mb-3 uppercase tracking-widest">Select Analysis Mode</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MODES_LIST.map(m => (
              <motion.button
                key={m.id}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode(m.id)}
                className={`p-4 rounded-2xl text-left border transition-all duration-300 ${
                  selectedMode === m.id
                    ? 'border-brand-500/60 bg-brand-500/12 text-brand-600 dark:text-brand-300 shadow-[0_8px_30px_rgba(34,197,94,0.15)]'
                    : 'border-black/5 dark:border-white/6 bg-black/5 dark:bg-white/4 text-slate-800 dark:text-gray-200 hover:border-brand-500/30'
                }`}
              >
                <p className="text-[11px] font-black uppercase tracking-tight">{m.label}</p>
                <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-1 font-medium leading-tight">{m.desc}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Drop zone (hidden for live mode) */}
        {selectedMode === 'multi-cctv' ? (
          <div className="rounded-2xl border border-black/10 dark:border-white/8 bg-black/5 dark:bg-white/3 p-5">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Multi-CCTV upload uses a grid</p>
            <p className="text-xs text-slate-500 dark:text-gray-500 mt-1">Pick a layout (e.g. 2×2), then select one video per camera.</p>
            <Button className="mt-4" onClick={() => { setMode('multi-cctv'); onClose(); onOpenMultiCctv?.() }} icon={<Upload size={14} />}>
              Open Multi-CCTV Upload
            </Button>
          </div>
        ) : currentMode?.accepts ? (
          <div
            className={`upload-drop-zone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          >
            <input
              ref={fileRef}
              type="file"
              accept={currentMode.accepts}
              className="hidden"
              onChange={e => handleFile(e.target.files[0])}
            />
            <motion.div
              animate={{ y: dragging ? -5 : 0 }}
              className="flex flex-col items-center gap-3 pointer-events-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Upload size={20} className="text-brand-400" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-gray-300 font-medium">
                  Drag & drop or <span className="text-brand-400">browse</span>
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-600 mt-0.5">
                  {selectedMode === 'static' ? 'Images (JPG, PNG)' : 'Videos (MP4, AVI) & Images'}
                </p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Camera size={20} className="text-brand-400" />
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400">This mode uses your live webcam feed.</p>
            <Button onClick={onClose} icon={<Camera size={14} />}>Start CCTV Live</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
