import { create } from 'zustand'

const AUTH_USER_KEY = 'visioncount_auth_users'
const AUTH_SESSION_KEY = 'visioncount_auth_session'
const DEFAULT_ACCOUNT = {
  name: 'VisionCount Demo',
  email: 'demo@visioncount.ai',
  password: 'demo123',
}

const readStorage = (key, fallback = null) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures (private mode, quota exceeded, blocked storage).
  }
}

const removeStorage = (key) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures (private mode, blocked storage).
  }
}

const readUsers = () => {
  const users = readStorage(AUTH_USER_KEY, null)
  if (Array.isArray(users) && users.length) return users
  if (users && !Array.isArray(users)) return [users]
  return [DEFAULT_ACCOUNT]
}

const writeUsers = (users) => {
  writeStorage(AUTH_USER_KEY, users)
}

const initialSession = readStorage(AUTH_SESSION_KEY, null)

const useAppStore = create((set, get) => ({
  isAuthenticated: true,
  userId: 'demo@visioncount.ai',
  authUser: { name: 'VisionCount Demo', email: 'demo@visioncount.ai' },

  login: ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const account = readUsers().find((user) => user.email.toLowerCase() === normalizedEmail)
    if (!account) {
      return { ok: false, error: 'No account found for this email. Please sign up first.' }
    }
    if (account.password !== password) {
      return { ok: false, error: 'Invalid email or password.' }
    }
    const session = { name: account.name, email: account.email }
    writeStorage(AUTH_SESSION_KEY, session)
    set({ isAuthenticated: true, userId: account.email, authUser: session })
    return { ok: true }
  },

  signup: ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase()
    const account = { name: name.trim(), email: normalizedEmail, password }
    const users = readUsers()
    const existingUser = users.find((user) => user.email === normalizedEmail)
    const nextUsers = existingUser
      ? users.map((user) => (user.email === normalizedEmail ? account : user))
      : [...users, account]
    writeUsers(nextUsers)
    const session = { name: account.name, email: account.email }
    writeStorage(AUTH_SESSION_KEY, session)
    set({ isAuthenticated: true, userId: account.email, authUser: session })
    return { ok: true }
  },

  logout: () => {
    removeStorage(AUTH_SESSION_KEY)
    set({ isAuthenticated: false, userId: 'guest', authUser: null })
  },

  mode: 'conveyor',
  setMode: (mode) => set({ mode }),

  totalCount: 0,
  setTotalCount: (n) => set({ totalCount: n }),

  roiCount: 0,
  setRoiCount: (n) => set({ roiCount: n }),

  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  cameraEnabled: false,
  setCameraEnabled: (v) => set({ cameraEnabled: v }),

  uploads: [],
  addUpload: (item) => set(s => ({ uploads: [item, ...s.uploads].slice(0, 10) })),
  updateUpload: (id, patch) => set(s => ({
    uploads: s.uploads.map(u => u.id === id ? { ...u, ...patch } : u)
  })),

  analyticsData: [],
  addAnalyticsRow: (row) => set(s => ({
    analyticsData: [row, ...s.analyticsData].slice(0, 50)
  })),

  analyticsFilter: null, // filename string | null
  setAnalyticsFilter: (filter) => set({ analyticsFilter: filter }),
  clearAnalyticsFilter: () => set({ analyticsFilter: null }),

  godown: { inventory: 0, todayIn: 0, todayOut: 0 },
  setGodown: (data) => set(s => ({ godown: { ...s.godown, ...data } })),

  cameras: {},
  setCameras: (cameras) => set({ cameras }),
  clearCameras: () => set({ cameras: {} }),
  addCamera: (id, data) => set(s => ({ cameras: { ...s.cameras, [id]: data } })),
  updateCamera: (id, patch) => set(s => ({
    cameras: { ...s.cameras, [id]: { ...s.cameras[id], ...patch } }
  })),
  removeCamera: (id) => set(s => {
    const cameras = { ...s.cameras }
    delete cameras[id]
    return { cameras }
  }),

  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

  reset: () => set({
    totalCount: 0,
    roiCount: 0,
    uploads: [],
    analyticsData: [],
    godown: { inventory: 0, todayIn: 0, todayOut: 0 },
    cameras: {},
  }),
}))

export default useAppStore
