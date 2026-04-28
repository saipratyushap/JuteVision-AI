import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  ArrowRight, Activity, Camera, Grid2x2, Image, Layers, MapPin,
  Package, ScanLine, Warehouse, CheckCircle, Zap, Shield, BarChart3,
  Play, ChevronRight,
} from 'lucide-react'
import Button from '../components/ui/Button'
import {
  fadeIn, slideUp, slideLeft, slideRight,
  staggerContainer, staggerSlow, cardHover, glowPulse, blobFloat,
} from '../components/animations/variants'
import MainLayout from '../layouts/MainLayout'

// ─── Data ───────────────────────────────────────────────────────────────
const FEATURES = [
  { id: 'conveyor',   label: 'Conveyor Mode',      icon: Layers,    color: 'blue',   desc: 'Real-time counting on moving conveyor belts with sub-frame precision.' },
  { id: 'static',     label: 'Static Image Mode',  icon: Image,     color: 'green',  desc: 'High-accuracy pile counting from static warehouse images using tiled detection.' },
  { id: 'multi-cctv', label: 'Multi-CCTV Mode',    icon: Grid2x2,   color: 'pink',   desc: 'Simultaneous processing across up to 16 camera feeds with session totals.' },
  { id: 'live',       label: 'CCTV Live Mode',      icon: Camera,    color: 'red',    desc: 'Stream a live webcam feed and count bags in real-time as they pass.' },
  { id: 'volume',     label: 'Qty Count Pro',      icon: Package,   color: 'yellow', desc: 'Estimates hidden layers in 3D stacks using depth inference for total prediction.' },
]

const STEPS = [
  { n: '01', title: 'Define Analysis Mode', desc: 'Choose from 5 powerful AI tracking modes tailored for your environment.', icon: Zap },
  { n: '02', title: 'Upload & Connect',     desc: 'Drop files or stream a CCTV live feed for instant real-time monitoring.', icon: Camera },
  { n: '03', title: 'AI Processes',         desc: 'YOLOv8 processes your feed to detect, track, and count with industrial-grade accuracy.', icon: Activity },
  { n: '04', title: 'Analytics & Reports',  desc: 'Review historical trends, peak hour stats, and export detailed efficiency reports.', icon: BarChart3 },
]

const STATS = [
  { value: '99.8%', label: 'Detection Accuracy' },
  { value: '<50ms', label: 'Response Latency' },
  { value: '5',     label: 'AI Tracking Modes' },
  { value: '16',    label: 'Max CCTV Feeds' },
]

const TECH = ['YOLOv8', 'OpenCV', 'Flask', 'Python', 'PyTorch', 'React', 'WebSocket', 'ByteTrack']

const colorMap = {
  blue:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.25)',  text: '#3b82f6' },
  green:  { bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)',   text: '#22c55e' },
  purple: { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)',  text: '#8b5cf6' },
  cyan:   { bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)',   text: '#06b6d4' },
  orange: { bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)',  text: '#f97316' },
  pink:   { bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.25)',  text: '#ec4899' },
  red:    { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
  yellow: { bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)',   text: '#eab308' },
}

// ─── Section helpers ──────────────────────────────────────────────────────
function Section({ id, className = '', children }) {
  return (
    <section id={id} className={`py-24 px-4 relative ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}

function SectionHeading({ eyebrow, title, sub }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className="text-center mb-16"
    >
      {eyebrow && (
        <motion.span variants={slideUp} className="inline-block text-xs font-bold tracking-widest text-brand-500 uppercase mb-3">
          {eyebrow}
        </motion.span>
      )}
      <motion.h2 variants={slideUp} className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
        {title}
      </motion.h2>
      {sub && (
        <motion.p variants={slideUp} className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          {sub}
        </motion.p>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <MainLayout>
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoPreviewSection />
      <TechStackSection />
      <CTASection />
    </MainLayout>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden hero-bg">
      {/* Grid bg */}
      <div className="absolute inset-0 bg-grid-dark pointer-events-none opacity-30 dark:opacity-100" />

      {/* Blobs */}
      <motion.div {...blobFloat(0)} className="blob w-[500px] h-[500px] bg-brand-500/10 -top-20 -left-32" />
      <motion.div {...blobFloat(2)} className="blob w-[400px] h-[400px] bg-blue-500/8 bottom-0 -right-24" />
      <motion.div {...blobFloat(4)} className="blob w-[300px] h-[300px] bg-purple-500/6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-32 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center gap-6"
        >
          {/* Badge */}
          <motion.div
            variants={slideUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs font-semibold text-brand-500 dark:text-brand-300 border border-brand-500/25"
          >
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Industrial-Grade AI Object Detection
          </motion.div>

          {/* Heading */}
          <motion.h1 variants={slideUp} className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight">
            <span className="text-gradient-hero">CCTV Vision</span>
            <br />
            <span className="text-gray-800 dark:text-white">Count AI</span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={slideUp} className="text-gray-600 dark:text-gray-400 text-xl max-w-2xl leading-relaxed">
            5 AI-powered tracking modes for warehouses, conveyors, and production lines.
            <br />
            Real-time insights. Industrial accuracy. Zero compromise.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link to="/dashboard">
              <Button size="lg" className="btn-glow-green gap-2">
                Start Counting Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" icon={<Play size={16} />}>
                Watch How It Works
              </Button>
            </a>
          </motion.div>

          {/* Trust line */}
          <motion.div variants={fadeIn} className="flex items-center gap-5 pt-4 flex-wrap justify-center">
            {['No credit card', 'All 5 modes free', 'Connect in minutes'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-500">
                <CheckCircle size={12} className="text-brand-500" />
                {t}
              </span>
            ))}
          </motion.div>

          {/* Preview card — always dark-styled to show off the dashboard UI */}
          <motion.div
            variants={slideUp}
            className="mt-12 w-full max-w-3xl rounded-3xl overflow-hidden border border-gray-300 dark:border-white/8 shadow-2xl"
            style={{ aspectRatio: '16/9', position: 'relative' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 flex items-center justify-center">
              <div className="w-full h-full p-4 flex gap-3">
                <div className="flex-1 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center mx-auto mb-3 animate-pulse-slow">
                      <Camera size={28} className="text-brand-400" />
                    </div>
                    <div className="text-brand-400 font-mono text-xs">LIVE FEED 01</div>
                    <div className="live-badge mt-1 inline-block">LIVE</div>
                  </div>
                </div>
                <div className="w-40 flex flex-col gap-2">
                  {[
                    { label: 'Total Bags', value: '247', color: '#22c55e' },
                    { label: 'Today In',   value: '89',  color: '#3b82f6' },
                    { label: 'Accuracy',   value: '99.2%', color: '#8b5cf6' },
                  ].map(s => (
                    <div key={s.label} className="flex-1 bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col justify-between">
                      <div className="text-gray-500 text-[10px]">{s.label}</div>
                      <div className="font-black text-lg" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(34,197,94,0.05))', border: '1px solid rgba(34,197,94,0.1)' }} />
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade — matches theme bg via CSS class */}
      <div className="absolute bottom-0 inset-x-0 h-32 hero-bottom-fade pointer-events-none" />
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────
function StatsBar() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <div ref={ref} className="relative z-10 py-8 border-y border-gray-200 dark:border-white/6 glass">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8"
      >
        {STATS.map(s => (
          <motion.div key={s.label} variants={slideUp} className="text-center">
            <div className="text-3xl font-black text-gradient-green mb-1">{s.value}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────
function FeaturesSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <Section id="features">
      <SectionHeading
        eyebrow="5 Intelligent Modes"
        title="The Right Tool for Every Job"
        sub="From conveyor belts to 3D stack estimation — every industrial counting scenario is covered."
      />
      <motion.div
        ref={ref}
        variants={staggerSlow}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {FEATURES.map(f => {
          const Icon = f.icon
          const c = colorMap[f.color]
          return (
            <motion.div
              key={f.id}
              variants={slideUp}
              {...cardHover}
              className="feature-card group"
              style={{ border: `1px solid ${c.border}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ background: c.bg }}
              >
                <Icon size={18} style={{ color: c.text }} />
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{f.label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          )
        })}
      </motion.div>
    </Section>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <Section id="how-it-works" className="overflow-hidden">
      <SectionHeading
        eyebrow="Process"
        title="Up and Running in Minutes"
        sub="A simple 4-step workflow to get accurate counts from any camera or image."
      />
      <div className="relative">
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500/30 to-transparent -translate-x-px" />
        <div className="flex flex-col gap-12">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isLeft = i % 2 === 0
            const ref = useRef(null)
            const inView = useInView(ref, { once: true, margin: '-60px' })
            return (
              <motion.div
                key={step.n}
                ref={ref}
                variants={isLeft ? slideRight : slideLeft}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className={`flex items-center gap-8 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              >
                <div className="flex-1 glass rounded-2xl p-6 border border-gray-200 dark:border-white/8 hover:border-brand-500/30 transition-colors duration-300 shadow-sm dark:shadow-none">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 flex items-center justify-center">
                      <Icon size={16} className="text-brand-500" />
                    </div>
                    <span className="font-mono text-xs text-brand-500/70 font-bold tracking-widest">{step.n}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
                <div className="hidden md:flex w-4 h-4 rounded-full bg-brand-500 border-2 border-brand-300 shadow-neon-green shrink-0 z-10" />
                <div className="flex-1 hidden md:block" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// ─── Demo Preview ─────────────────────────────────────────────────────────
function DemoPreviewSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <Section className="overflow-hidden">
      <SectionHeading eyebrow="Live Preview" title="See It In Action" />
      <motion.div
        ref={ref}
        variants={slideUp}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="relative rounded-3xl border border-gray-200 dark:border-white/8 overflow-hidden shadow-xl"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-200 dark:border-white/6 glass">
          {['#ef4444', '#f97316', '#22c55e'].map(c => (
            <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
          ))}
          <div className="ml-2 flex-1 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-1 text-xs text-gray-500 font-mono">
            boxvision.thirdeyedata.ai/dashboard
          </div>
          <div className="live-badge text-[10px]">LIVE</div>
        </div>

        {/* Mock dashboard — intentionally dark to show product */}
        <div className="p-4 flex gap-3 bg-gray-950" style={{ minHeight: 320 }}>
          <div className="w-36 flex flex-col gap-1">
            {['Conveyor', 'Static Image', 'Multi-CCTV', 'CCTV Live', 'Qty Count Pro'].map((m, i) => (
              <div key={m} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium ${i === 0 ? 'bg-brand-500/15 text-brand-300 border border-brand-500/25' : 'text-gray-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-brand-400' : 'bg-gray-700'}`} />
                {m}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total Bags', v: '247',  color: '#22c55e' },
                { label: 'In ROI',     v: '12',   color: '#3b82f6' },
                { label: 'Accuracy',   v: '99.8%', color: '#8b5cf6' },
              ].map(s => (
                <div key={s.label} className="bg-black/40 rounded-xl p-2.5 border border-white/5">
                  <div className="text-gray-600 text-[9px] mb-0.5">{s.label}</div>
                  <div className="font-black text-sm" style={{ color: s.color }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="flex-1 bg-black/50 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-500/20 border-2 border-brand-500/40 flex items-center justify-center mx-auto mb-2 animate-pulse">
                  <Camera size={20} className="text-brand-400" />
                </div>
                <div className="text-[10px] text-gray-600 font-mono">Live Feed 01</div>
              </div>
              <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent animate-scan" style={{ top: '50%' }} />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-brand-500/5 to-transparent pointer-events-none" />
      </motion.div>

      <div className="text-center mt-8">
        <Link to="/dashboard">
          <Button size="lg" iconRight={<ChevronRight size={16} />}>
            Open Live Dashboard
          </Button>
        </Link>
      </div>
    </Section>
  )
}

// ─── Tech Stack ───────────────────────────────────────────────────────────
function TechStackSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <Section>
      <SectionHeading eyebrow="Technology" title="Enterprise-Grade Stack" />
      <motion.div
        ref={ref}
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
        className="flex flex-wrap justify-center gap-3"
      >
        {TECH.map(t => (
          <motion.div
            key={t}
            variants={slideUp}
            whileHover={{ scale: 1.07, borderColor: 'rgba(34,197,94,0.5)' }}
            className="px-5 py-2.5 rounded-xl glass border border-gray-200 dark:border-white/8 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-default transition-colors shadow-sm dark:shadow-none"
          >
            {t}
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <Section>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative glass rounded-3xl border border-brand-500/25 p-12 text-center overflow-hidden shadow-lg"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.07) 0%, rgba(59,130,246,0.04) 100%)' }}
      >
        <div className="blob w-64 h-64 bg-brand-500/15 top-0 left-0 -translate-x-1/2 -translate-y-1/2" />
        <div className="blob w-48 h-48 bg-blue-500/10 bottom-0 right-0 translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <span className="text-xs font-bold text-brand-500 tracking-widest uppercase">Ready?</span>
          <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mt-2 mb-4">
            Transform Your
            <br />
            <span className="text-gradient-green">Operations Today</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
            Join hundreds of facilities already using VisionCount AI for accurate, real-time object counting.
          </p>
          <motion.div {...glowPulse}>
            <Link to="/dashboard">
              <Button size="xl" className="btn-glow-green">
                Start Counting for Free
                <ArrowRight size={20} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </Section>
  )
}
