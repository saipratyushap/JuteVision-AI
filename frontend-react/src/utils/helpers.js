export const cn = (...classes) => classes.filter(Boolean).join(' ')

export const formatCount = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const ANALYTICS_KEY = (userId = 'admin') => `analyticsData_${userId}`
export const RECENT_KEY    = (userId = 'admin') => `recentUploads_${userId}`
export const TOTAL_KEY     = (userId = 'admin') => `currentTotalBags_${userId}`

export const getAnalytics = (userId) => {
  try { return JSON.parse(localStorage.getItem(ANALYTICS_KEY(userId)) ?? '[]') }
  catch { return [] }
}
export const saveAnalytics = (userId, data) =>
  localStorage.setItem(ANALYTICS_KEY(userId), JSON.stringify(data.slice(0, 50)))

export const getRecent = (userId) => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY(userId)) ?? '[]') }
  catch { return [] }
}
export const saveRecent = (userId, items) =>
  localStorage.setItem(RECENT_KEY(userId), JSON.stringify(items.slice(0, 5)))

export const MODE_META = {
  conveyor:   { label: 'Conveyor Mode',       icon: 'conveyor',   color: 'blue',   desc: 'Standard conveyor belt tracking' },
  static:     { label: 'Static Image',        icon: 'image',      color: 'green',  desc: 'Pile & warehouse counting from images' },
  scanning:   { label: 'Scanning Mode',       icon: 'scan',       color: 'purple', desc: 'Dynamic video analysis' },
  zone:       { label: 'Zone Counting Mode',  icon: 'zone',       color: 'cyan',   desc: 'Custom ROI area counting' },
  godown:     { label: 'Godown Mode',         icon: 'warehouse',  color: 'orange', desc: 'Entry / exit inventory tracking' },
  'multi-cctv':      { label: 'Multi-CCTV',          icon: 'grid',           color: 'pink',   desc: 'Multiple cameras surveillance' },
  'warehouse-multi': { label: 'Warehouse Multi CCTV',  icon: 'warehouse-grid', color: 'orange', desc: 'Multi-camera warehouse image counting with depth estimation' },
  live:       { label: 'CCTV Live Mode',      icon: 'camera',     color: 'red',    desc: 'Real-time live camera feed' },
  volume:     { label: 'Quantity Count Pro',  icon: 'box',        color: 'yellow', desc: '3D stack depth estimation' },
}

export const DEMO_HOURLY = [
  { time: '00:00', boxes: 28 },
  { time: '02:00', boxes: 15 },
  { time: '04:00', boxes: 9 },
  { time: '06:00', boxes: 42 },
  { time: '08:00', boxes: 87 },
  { time: '10:00', boxes: 124 },
  { time: '12:00', boxes: 98 },
  { time: '14:00', boxes: 135 },
  { time: '16:00', boxes: 112 },
  { time: '18:00', boxes: 76 },
  { time: '20:00', boxes: 54 },
  { time: '22:00', boxes: 33 },
]

export const DEMO_WEEKLY = [
  { day: 'Mon', boxes: 642 },
  { day: 'Tue', boxes: 785 },
  { day: 'Wed', boxes: 920 },
  { day: 'Thu', boxes: 834 },
  { day: 'Fri', boxes: 1102 },
  { day: 'Sat', boxes: 487 },
  { day: 'Sun', boxes: 321 },
]
