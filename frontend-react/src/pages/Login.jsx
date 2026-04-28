import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, Activity } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import useAppStore from '../store/useAppStore'
import { staggerContainer, slideUp } from '../components/animations/variants'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAppStore(s => s.login)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname ?? '/dashboard'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    const result = login({ email, password })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    navigate(from, { replace: true })
  }

  return (
    <AuthLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="auth-card rounded-3xl p-8"
      >
        {/* Header */}
        <motion.div variants={slideUp} className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
            <Activity size={24} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome Back</h1>
          <p className="text-slate-500 dark:text-gray-500 text-sm mt-1">Sign in to your VisionCount AI workspace</p>
        </motion.div>

        <motion.form variants={staggerContainer} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <motion.div variants={slideUp}>
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              autoComplete="email"
            />
          </motion.div>

          <motion.div variants={slideUp}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="current-password"
            />
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}

          <motion.div variants={slideUp} className="pt-1">
            <Button type="submit" size="lg" className="w-full btn-glow-green" loading={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </motion.div>
        </motion.form>

        <motion.p variants={slideUp} className="text-center text-sm text-slate-500 dark:text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Create one
          </Link>
        </motion.p>

        <motion.div
          variants={slideUp}
          className="mt-6 rounded-2xl border border-brand-500/15 bg-brand-500/6 px-4 py-3 text-xs text-slate-600 dark:text-gray-400"
        >
          Demo sign-in: `demo@visioncount.ai` / `demo123`
        </motion.div>
      </motion.div>
    </AuthLayout>
  )
}
