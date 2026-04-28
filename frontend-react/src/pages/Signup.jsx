import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import AuthLayout from '../layouts/AuthLayout'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import useAppStore from '../store/useAppStore'
import { staggerContainer, slideUp } from '../components/animations/variants'

export default function Signup() {
  const navigate = useNavigate()
  const signup = useAppStore(s => s.signup)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) { setError('All fields are required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    signup(form)
    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="auth-card rounded-3xl p-8"
      >
        <motion.div variants={slideUp} className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs text-brand-400 font-semibold mb-4">
            Free Forever
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Create Account</h1>
          <p className="text-slate-500 dark:text-gray-500 text-sm mt-1">Start counting smarter today</p>
        </motion.div>

        <motion.form variants={staggerContainer} onSubmit={handleSubmit} className="flex flex-col gap-4">
          <motion.div variants={slideUp}>
            <Input label="Full Name" type="text" placeholder="John Doe" value={form.name} onChange={set('name')} icon={<User size={16} />} autoComplete="name" />
          </motion.div>
          <motion.div variants={slideUp}>
            <Input label="Work Email" type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} icon={<Mail size={16} />} autoComplete="email" />
          </motion.div>
          <motion.div variants={slideUp}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set('password')}
              icon={<Lock size={16} />}
              iconRight={
                <button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-500 dark:text-gray-500 hover:text-slate-800 dark:hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete="new-password"
            />
          </motion.div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </motion.p>
          )}

          <motion.div variants={slideUp} className="pt-1">
            <Button type="submit" size="lg" className="w-full btn-glow-green" loading={loading}>
              {loading ? 'Creating account…' : 'Create Free Account'}
            </Button>
          </motion.div>
        </motion.form>

        <motion.p variants={slideUp} className="text-center text-xs text-slate-600 dark:text-gray-600 mt-4">
          By signing up you agree to our{' '}
          <a href="#" className="text-brand-500/70 hover:text-brand-400">Terms</a> &amp;{' '}
          <a href="#" className="text-brand-500/70 hover:text-brand-400">Privacy Policy</a>
        </motion.p>

        <motion.p variants={slideUp} className="text-center text-sm text-slate-500 dark:text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Sign in
          </Link>
        </motion.p>
      </motion.div>
    </AuthLayout>
  )
}
