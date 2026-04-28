// Reusable Framer Motion variants

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeInOut' } },
  exit:    { opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
}

export const slideUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeInOut' } },
}

export const slideDown = {
  hidden:  { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
}

export const slideLeft = {
  hidden:  { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const slideRight = {
  hidden:  { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, scale: 0.9, transition: { duration: 0.25 } },
}

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

export const staggerSlow = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

export const pageTransition = {
  initial:  { opacity: 0, y: 24 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeInOut' } },
}

export const scaleHover = {
  whileHover: { scale: 1.04, transition: { duration: 0.2, ease: 'easeOut' } },
  whileTap:   { scale: 0.96 },
}

export const cardHover = {
  whileHover: {
    y: -6,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
}

export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 10px rgba(34,197,94,0.3)',
      '0 0 30px rgba(34,197,94,0.7)',
      '0 0 10px rgba(34,197,94,0.3)',
    ],
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
}

export const modalOverlay = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

export const modalContent = {
  hidden:  { opacity: 0, scale: 0.9, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] } },
  exit:    { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.25 } },
}

export const sidebarItem = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}

export const numberCount = {
  hidden:  { opacity: 0, y: 20, scale: 0.8 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
}

export const blobFloat = (delay = 0) => ({
  animate: {
    y: [0, -30, 0],
    x: [0, 15, 0],
    scale: [1, 1.05, 1],
    transition: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay },
  },
})
