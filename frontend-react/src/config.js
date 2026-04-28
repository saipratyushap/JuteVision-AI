export const API_BASE_URL = ''

export const ENDPOINTS = {
  UPLOAD:                   '/upload',
  TASKS:                    '/tasks',
  STREAM:                   '/stream',
  RESET:                    '/reset',
  WS:                       '/ws',
  CAMERA_ON:                '/camera/on',
  CAMERA_OFF:               '/camera/off',
  MULTI_CCTV_ADD:           '/multi-cctv/add',
  MULTI_CCTV_UPLOAD:        '/multi-cctv/upload',
  MULTI_CCTV_UPLOAD_IMAGE:  '/multi-cctv/upload-image',
  MULTI_CCTV_LIVE:          '/multi-cctv/live',
  MULTI_CCTV_REMOVE:        '/multi-cctv/remove',
  MULTI_CCTV_STREAM:        '/multi-cctv/stream',
  MULTI_CCTV_COUNTS:        '/multi-cctv/counts',
  MULTI_CCTV_STOP:          '/multi-cctv/stop',
  SESSION_ID:               '/session/id',
}

export const getApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`

export const getWsUrl = (endpoint) => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}${endpoint}`
  }
  return `ws://localhost:8000${endpoint}`
}
