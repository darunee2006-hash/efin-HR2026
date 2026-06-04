import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { Users, Mail, Lock, Eye, EyeOff, AlertCircle, Shield, CheckCircle, Globe } from 'lucide-react'

export default function Login({ lang: initialLang }) {
  const { signIn, signUp } = useAuth()
  const [lang, setLang] = useState(initialLang || 'th')
  const [mode, setMode] = useState('login') // 'login' or 'setup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasUsers, setHasUsers] = useState(true) // assume yes until checked
  const [checking, setChecking] = useState(true)

  // Check if any users exist (for first-time setup)
  useEffect(() => {
    async function check() {
      const { count } = await supabase
        .from('hr_user_profiles')
        .select('id', { count: 'exact', head: true })
      setHasUsers(count > 0)
      if (count === 0) setMode('setup')
      setChecking(false)
    }
    check()
  }, [])

  const L = {
    // Login
    title: lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In',
    subtitle: lang === 'th' ? 'ระบบบริหารทรัพยากรบุคคล' : 'HR Management System',
    email: lang === 'th' ? 'อีเมล' : 'Email',
    password: lang === 'th' ? 'รหัสผ่าน' : 'Password',
    confirmPassword: lang === 'th' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password',
    displayName: lang === 'th' ? 'ชื่อที่แสดง' : 'Display Name',
    signin: lang === 'th' ? 'เข้าสู่ระบบ' : 'Sign In',
    signingIn: lang === 'th' ? 'กำลังเข้าสู่ระบบ...' : 'Signing in...',
    invalidCreds: lang === 'th' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password',
    contactAdmin: lang === 'th' ? 'ติดต่อผู้ดูแลระบบเพื่อขอบัญชีใช้งาน' : 'Contact admin for an account',
    // Setup
    setupTitle: lang === 'th' ? 'ตั้งค่าระบบครั้งแรก' : 'First-Time Setup',
    setupDesc: lang === 'th' ? 'สร้างบัญชี Admin เพื่อเริ่มใช้งาน' : 'Create an Admin account to get started',
    createAdmin: lang === 'th' ? 'สร้างบัญชี Admin' : 'Create Admin Account',
    creating: lang === 'th' ? 'กำลังสร้าง...' : 'Creating...',
    passMin: lang === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters',
    passMismatch: lang === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match',
    setupSuccess: lang === 'th' ? 'สร้างบัญชี Admin สำเร็จ! กำลังเข้าสู่ระบบ...' : 'Admin account created! Signing in...',
    backToLogin: lang === 'th' ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Sign In',
    firstTimeSetup: lang === 'th' ? 'ยังไม่มีผู้ใช้? ตั้งค่าระบบ' : "No users yet? Set up system",
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signIn(email, password)
    } catch {
      setError(L.invalidCreds)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetup(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (password.length < 6) { setError(L.passMin); return }
    if (password !== confirmPass) { setError(L.passMismatch); return }
    setLoading(true)
    try {
      await signUp(email, password, { display_name: displayName || email.split('@')[0], role: 'admin' })
      setSuccess(L.setupSuccess)
      // Auto sign-in after short delay
      setTimeout(async () => {
        try { await signIn(email, password) } catch {}
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E6F9F0] via-white to-[#f0fce8]">
        <div className="w-8 h-8 border-3 border-[#C5E888] border-t-[#7DC242] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F9F0] via-white to-[#f0fce8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white text-sm font-medium text-gray-600 transition-colors border border-gray-200"
          >
            <Globe className="w-4 h-4" />
            {lang === 'th' ? 'EN' : 'TH'}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7DC242] shadow-lg shadow-[#C5E888] mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">EFIN HR</h1>
          <p className="text-gray-500 text-sm mt-1">{L.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">

          {/* ===== SETUP MODE ===== */}
          {mode === 'setup' && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-[#7DC242]" />
                <h2 className="text-xl font-semibold text-gray-900">{L.setupTitle}</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">{L.setupDesc}</p>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
                </div>
              )}

              <form onSubmit={handleSetup} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{L.displayName}</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder={lang === 'th' ? 'เช่น Admin HR' : 'e.g. Admin HR'}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{L.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{L.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••" minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] outline-none" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{L.confirmPassword}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required
                      placeholder="••••••••" minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#7DC242] text-white rounded-lg font-medium text-sm hover:bg-[#5A9020] transition-colors disabled:opacity-60 shadow-sm shadow-[#C5E888]">
                  {loading ? L.creating : L.createAdmin}
                </button>
              </form>

              {hasUsers && (
                <button onClick={() => setMode('login')} className="w-full mt-4 text-sm text-[#7DC242] hover:text-[#4E7F1A]">
                  {L.backToLogin}
                </button>
              )}
            </>
          )}

          {/* ===== LOGIN MODE ===== */}
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{L.title}</h2>

              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.email}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] focus:border-transparent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.password}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#7DC242] focus:border-transparent outline-none" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-2.5 bg-[#7DC242] text-white rounded-lg font-medium text-sm hover:bg-[#5A9020] transition-colors disabled:opacity-60 shadow-sm shadow-[#C5E888]">
                  {loading ? L.signingIn : L.signin}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-6">{L.contactAdmin}</p>

              {!hasUsers && (
                <button onClick={() => setMode('setup')} className="w-full mt-2 text-sm text-[#7DC242] hover:text-[#4E7F1A]">
                  {L.firstTimeSetup}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
