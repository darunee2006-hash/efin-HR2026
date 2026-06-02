import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  Users, UserPlus, Shield, Settings, Search, X, Save,
  ChevronDown, Check, AlertTriangle, Eye, EyeOff, RefreshCw,
  UserCheck, UserX, Mail, Link2, Trash2, Edit3, Key,
} from 'lucide-react'

// ── Brand palette ────────────────────────────────────────────
const G = { primary:'#00A651', dark:'#007A3D', light:'#E6F9F0', light2:'#CCF0DE', accent:'#F5A623' }

// ── Role config ──────────────────────────────────────────────
const ROLES = [
  { key:'superuser', label:'Super Admin', color:'bg-red-100 text-red-700',     icon:'👑', desc:'เข้าถึงทุกอย่าง รวมถึงเงินเดือนและข้อมูลลับ' },
  { key:'admin',     label:'Admin',       color:'bg-purple-100 text-purple-700', icon:'🛡️', desc:'จัดการผู้ใช้และบริษัท' },
  { key:'manager',   label:'Manager',     color:'bg-[#E6F9F0] text-[#5A9020]',    icon:'👔', desc:'ดูข้อมูลทีมและอนุมัติคำขอ' },
  { key:'employee',  label:'Employee',    color:'bg-gray-100 text-gray-600',    icon:'👤', desc:'เข้าถึงข้อมูลส่วนตัว' },
]
const roleOf = (key) => ROLES.find(r => r.key === key) || ROLES[3]

// ── Avatar ───────────────────────────────────────────────────
function Av({ name = '', size = 32 }) {
  const txt = (name || '?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()
  const colors = ['#00A651','#007A3D','#00C060','#F5A623','#3b82f6','#8b5cf6','#ec4899']
  const bg = colors[(name.charCodeAt(0)||0) % colors.length]
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:600, flexShrink:0 }}>
      {txt}
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = roleOf(role)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>
      <span>{r.icon}</span>{r.label}
    </span>
  )
}

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ icon, iconBg, label, value, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ background: active ? G.primary : '#fff', border: active ? `1.5px solid ${G.dark}` : '0.5px solid #D8EDE3', borderRadius:12, padding:'13px', display:'flex', flexDirection:'column', gap:5, cursor:'pointer', transition:'all .15s', textAlign:'left' }}>
      <div style={{ width:36, height:36, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background: active ? 'rgba(255,255,255,.2)' : iconBg }}>
        {icon}
      </div>
      <div style={{ fontSize:11, color: active ? 'rgba(255,255,255,.8)' : '#7A9E8A' }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:600, color: active ? '#fff' : '#1a2e1a', lineHeight:1 }}>{value}</div>
    </button>
  )
}

// ── Edit User Modal ──────────────────────────────────────────
function EditUserModal({ user, employees, onClose, onSaved, lang }) {
  const [form, setForm] = useState({
    role:         user.role || 'employee',
    display_name: user.display_name || '',
    employee_id:  user.employee_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    setSaving(true); setError('')
    const { error: err } = await supabase
      .from('hr_user_profiles')
      .update({ role: form.role, display_name: form.display_name || null, employee_id: form.employee_id || null })
      .eq('id', user.id)
    if (err) { setError(err.message); setSaving(false); return }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Av name={user.display_name || user.email} size={36} />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user.display_name || '-'}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400"/></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อแสดง (Display Name)</label>
            <input type="text" value={form.display_name} onChange={e=>setForm(p=>({...p,display_name:e.target.value}))}
              placeholder="ชื่อ-นามสกุล"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:outline-none" style={{'--tw-ring-color':G.primary}} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">สิทธิ์การเข้าถึง (Role)</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <button key={r.key} onClick={()=>setForm(p=>({...p,role:r.key}))}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${form.role===r.key ? 'border-[#00A651] bg-[#E6F9F0]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-base leading-none mt-0.5">{r.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{r.label}</div>
                    <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{r.desc}</div>
                  </div>
                  {form.role===r.key && <Check className="w-3.5 h-3.5 text-[#00A651] ml-auto shrink-0 mt-0.5"/>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เชื่อมกับพนักงาน (Employee)</label>
            <select value={form.employee_id} onChange={e=>setForm(p=>({...p,employee_id:e.target.value}))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="">— ไม่เชื่อม —</option>
              {employees.map(emp => {
                const name = `${emp.first_name_th||emp.first_name_en||''} ${emp.last_name_th||emp.last_name_en||''}`.trim()
                return <option key={emp.id} value={emp.id}>{emp.employee_code} — {name}</option>
              })}
            </select>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{background:G.primary}}>
            <Save className="w-4 h-4"/>{saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create User Profile Modal ────────────────────────────────
function CreateUserModal({ employees, onClose, onSaved }) {
  const [form, setForm] = useState({ email:'', display_name:'', role:'employee', employee_id:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  const handleCreate = async () => {
    if (!form.email) { setError('กรุณากรอก Email'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      // Check if user already has a profile by email
      const { data: existing } = await supabase
        .from('hr_user_profiles')
        .select('id')
        .eq('email', form.email)
        .maybeSingle()

      if (existing) { setError('Email นี้มี profile อยู่แล้ว'); setSaving(false); return }

      // Look up auth user by email via admin (not possible from frontend)
      // Instead: insert profile shell — user needs to sign up first
      // We'll use a "pending" marker in display_name
      const { error: err } = await supabase
        .from('hr_user_profiles')
        .insert({
          // id must match auth.users — we can't create without auth, so we note limitation
          // Instead, store as a note in hr_settings or notify admin
          email:        form.email,
          display_name: form.display_name || form.email,
          role:         form.role,
          employee_id:  form.employee_id || null,
        })

      if (err) {
        // Most likely the user hasn't signed up yet — show clear message
        setError('ไม่พบ Auth User — ผู้ใช้ต้องสมัครด้วย email นี้ก่อนแล้ว admin ค่อยตั้ง Role')
        setSaving(false); return
      }
      setSuccess('สร้าง User Profile สำเร็จ')
      setTimeout(() => { onSaved(); onClose() }, 1200)
    } catch(e) { setError(e.message) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <UserPlus className="w-5 h-5" style={{color:G.primary}}/>เพิ่ม User Profile
          </h3>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400"/></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>{error}</div>}
          {success && <div className="bg-green-50 text-green-700 text-xs px-3 py-2 rounded-lg flex items-center gap-2"><Check className="w-4 h-4"/>{success}</div>}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
            ผู้ใช้ต้อง <strong>สมัครบัญชีผ่านหน้า Login</strong> ก่อน จึงจะสามารถตั้ง Role ให้ได้
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
              placeholder="example@company.com"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อแสดง</label>
            <input type="text" value={form.display_name} onChange={e=>setForm(p=>({...p,display_name:e.target.value}))}
              placeholder="ชื่อ-นามสกุล"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              {ROLES.map(r=><option key={r.key} value={r.key}>{r.icon} {r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">เชื่อมกับพนักงาน</label>
            <select value={form.employee_id} onChange={e=>setForm(p=>({...p,employee_id:e.target.value}))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="">— ไม่เชื่อม —</option>
              {employees.map(emp => {
                const name = `${emp.first_name_th||''} ${emp.last_name_th||''}`.trim() || emp.first_name_en
                return <option key={emp.id} value={emp.id}>{emp.employee_code} — {name}</option>
              })}
            </select>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{background:G.primary}}>
            <UserPlus className="w-4 h-4"/>{saving ? 'กำลังสร้าง...' : 'สร้าง Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function UserManagement({ lang = 'th' }) {
  const { role: myRole } = useAuth()

  const [users, setUsers]           = useState([])
  const [employees, setEmployees]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [activeTab, setActiveTab]   = useState('users')   // 'users' | 'unlinked'
  const [editUser, setEditUser]     = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast]           = useState('')
  const [deleting, setDeleting]     = useState(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [profilesRes, empsRes] = await Promise.all([
      supabase.from('hr_user_profiles')
        .select('*, hr_employees(id, employee_code, first_name_th, last_name_th, first_name_en, last_name_en, position_th, department_id, company_entity, status)')
        .order('created_at', { ascending: false }),
      supabase.from('hr_employees')
        .select('id, employee_code, first_name_th, last_name_th, first_name_en, last_name_en, position_th, company_entity, status')
        .eq('status', 'active')
        .order('first_name_th'),
    ])
    setUsers(profilesRes.data || [])
    setEmployees(empsRes.data || [])
    setLoading(false)
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // employees without user profile
  const linkedEmpIds = new Set(users.map(u => u.employee_id).filter(Boolean))
  const unlinkedEmps = employees.filter(e => !linkedEmpIds.has(e.id))

  // KPI counts
  const counts = useMemo(() => {
    const c = { all: users.length }
    ROLES.forEach(r => { c[r.key] = users.filter(u => u.role === r.key).length })
    return c
  }, [users])

  // Filtered users
  const filtered = useMemo(() => {
    return users.filter(u => {
      const emp   = u.hr_employees
      const name  = u.display_name || ''
      const email = u.email || ''
      const empName = emp ? `${emp.first_name_th||''} ${emp.last_name_th||''}`.trim() : ''
      const code  = emp?.employee_code || ''
      if (search) {
        const q = search.toLowerCase()
        if (!name.toLowerCase().includes(q) && !email.toLowerCase().includes(q)
          && !empName.toLowerCase().includes(q) && !code.toLowerCase().includes(q)) return false
      }
      if (filterRole !== 'all' && u.role !== filterRole) return false
      return true
    })
  }, [users, search, filterRole])

  const handleDelete = async (userId) => {
    if (!window.confirm('ลบ User Profile นี้? (ไม่กระทบบัญชี Supabase Auth)')) return
    setDeleting(userId)
    await supabase.from('hr_user_profiles').delete().eq('id', userId)
    setUsers(prev => prev.filter(u => u.id !== userId))
    showToast('ลบ User Profile สำเร็จ')
    setDeleting(null)
  }

  const handleRoleQuickChange = async (userId, newRole) => {
    await supabase.from('hr_user_profiles').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    showToast('อัปเดต Role สำเร็จ')
  }

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
          style={{background:G.primary}}>
          <Check className="w-4 h-4"/>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-gray-500 mt-0.5">ตั้งค่าสิทธิ์และเชื่อมบัญชีกับข้อมูลพนักงาน</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-lg"
          style={{background:G.primary}}>
          <UserPlus className="w-4 h-4"/>เพิ่ม User Profile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <KpiCard icon={<Users style={{width:18,height:18,color:G.primary}}/>}    iconBg={G.light}          label="ทั้งหมด"    value={counts.all}       active={filterRole==='all'}       onClick={() => setFilterRole('all')} />
        <KpiCard icon={<span className="text-lg">👑</span>}                       iconBg="#FEE2E2"          label="Super Admin" value={counts.superuser}  active={filterRole==='superuser'}  onClick={() => setFilterRole('superuser')} />
        <KpiCard icon={<Shield style={{width:18,height:18,color:'#7c3aed'}}/>}    iconBg="#F3E5F5"          label="Admin"       value={counts.admin}     active={filterRole==='admin'}     onClick={() => setFilterRole('admin')} />
        <KpiCard icon={<Settings style={{width:18,height:18,color:'#1d4ed8'}}/>}  iconBg="#EFF6FF"          label="Manager"     value={counts.manager}   active={filterRole==='manager'}   onClick={() => setFilterRole('manager')} />
        <KpiCard icon={<Users style={{width:18,height:18,color:'#374151'}}/>}     iconBg="#F9FAFB"          label="Employee"    value={counts.employee}  active={filterRole==='employee'}  onClick={() => setFilterRole('employee')} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {[
          { key:'users',    label:`บัญชีผู้ใช้ (${users.length})` },
          { key:'unlinked', label:`พนักงานไม่มีบัญชี (${unlinkedEmps.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab===t.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      {activeTab === 'users' && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ, อีเมล, รหัสพนักงาน..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:outline-none"/>
          </div>
          <select value={filterRole} onChange={e=>setFilterRole(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">ทุก Role</option>
            {ROLES.map(r=><option key={r.key} value={r.key}>{r.icon} {r.label}</option>)}
          </select>
          <button onClick={fetchData} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4"/>
          </button>
        </div>
      )}

      {/* ── Tab: Users ── */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border" style={{borderColor:'#D8EDE3'}}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor:G.primary}}/>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{borderColor:'#D8EDE3',background:'#F4F7F5'}}>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ใช้งาน</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">พนักงานที่เชื่อม</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">บริษัท</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
                    <th className="py-3 px-4"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">ไม่พบข้อมูล</td></tr>
                  ) : filtered.map(u => {
                    const emp = u.hr_employees
                    const empName = emp ? `${emp.first_name_th||emp.first_name_en||''} ${emp.last_name_th||emp.last_name_en||''}`.trim() : null
                    const displayName = u.display_name || u.email || '-'
                    const createdAt = u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}) : '-'

                    return (
                      <tr key={u.id} className="hover:bg-[#F4F7F5] transition-colors">
                        {/* User */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Av name={displayName} size={34}/>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{displayName}</p>
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3"/>{u.email || '-'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role — inline quick-change dropdown */}
                        <td className="py-3 px-4">
                          <div className="relative group inline-block">
                            <RoleBadge role={u.role}/>
                            {myRole === 'superuser' && (
                              <select
                                value={u.role}
                                onChange={e => handleRoleQuickChange(u.id, e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                title="เปลี่ยน Role">
                                {ROLES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Linked employee */}
                        <td className="py-3 px-4">
                          {emp ? (
                            <div className="flex items-center gap-1.5">
                              <Link2 className="w-3 h-3" style={{color:G.primary}}/>
                              <div>
                                <p className="text-sm text-gray-800 font-medium">{empName}</p>
                                <p className="text-xs text-gray-400">{emp.employee_code} · {emp.position_th || '-'}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <UserX className="w-3.5 h-3.5"/>ไม่ได้เชื่อม
                            </span>
                          )}
                        </td>

                        {/* Company */}
                        <td className="py-3 px-4">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{background:G.light,color:G.dark}}>
                            {emp?.company_entity || '-'}
                          </span>
                        </td>

                        {/* Created */}
                        <td className="py-3 px-4 text-xs text-gray-400">{createdAt}</td>

                        {/* Actions */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setEditUser(u)}
                              className="p-1.5 rounded-lg hover:bg-[#E6F9F0] text-gray-400 hover:text-[#007A3D] transition-colors" title="แก้ไข">
                              <Edit3 className="w-4 h-4"/>
                            </button>
                            {myRole === 'superuser' && (
                              <button onClick={() => handleDelete(u.id)} disabled={deleting===u.id}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="ลบ">
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t text-xs text-gray-400" style={{borderColor:'#EEF5F0'}}>
                แสดง {filtered.length} จาก {users.length} บัญชี
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Unlinked Employees ── */}
      {activeTab === 'unlinked' && (
        <div className="bg-white rounded-xl border" style={{borderColor:'#D8EDE3'}}>
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{borderColor:'#D8EDE3',background:'#FFFBF0'}}>
            <AlertTriangle className="w-4 h-4 text-amber-500"/>
            <span className="text-sm text-amber-700 font-medium">
              พนักงาน {unlinkedEmps.length} คน ยังไม่มีบัญชีเข้าระบบ — ให้ลงทะเบียนที่หน้า Login แล้ว admin เพิ่ม Profile
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor:G.primary}}/>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{borderColor:'#D8EDE3',background:'#F4F7F5'}}>
                  {['รหัส','ชื่อ-นามสกุล','ตำแหน่ง','บริษัท','สถานะ'].map(h=>(
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unlinkedEmps.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12">
                    <UserCheck className="w-10 h-10 mx-auto mb-2" style={{color:G.primary}}/>
                    <p className="text-gray-500 text-sm">พนักงานทุกคนมีบัญชีแล้ว</p>
                  </td></tr>
                ) : unlinkedEmps.map(emp => {
                  const name = `${emp.first_name_th||''} ${emp.last_name_th||''}`.trim() || `${emp.first_name_en||''} ${emp.last_name_en||''}`.trim()
                  return (
                    <tr key={emp.id} className="hover:bg-[#F4F7F5] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{emp.employee_code}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Av name={name} size={28}/>
                          <span className="font-medium text-gray-800">{name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{emp.position_th || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{background:G.light,color:G.dark}}>
                          {emp.company_entity || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">{emp.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Role Permission Reference ── */}
      <div className="bg-white rounded-xl border p-4" style={{borderColor:'#D8EDE3'}}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Key className="w-4 h-4" style={{color:G.primary}}/>ตารางสิทธิ์การเข้าถึง
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{borderBottom:'1px solid #D8EDE3'}}>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">ฟีเจอร์</th>
                {ROLES.map(r=><th key={r.key} className="py-2 px-3 text-center font-medium text-gray-500">{r.icon} {r.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['ดูข้อมูลส่วนตัว',    true,  true,  true,  true ],
                ['ดูข้อมูลทีม',         true,  true,  true,  false],
                ['ดูข้อมูลพนักงานทั้งหมด', true,true,true, false],
                ['อนุมัติลา / OT',      true,  true,  true,  false],
                ['แก้ไขข้อมูลพนักงาน', true,  true,  false, false],
                ['ดูเงินเดือน',         true,  false, false, false],
                ['จัดการผู้ใช้งาน',    true,  true,  false, false],
                ['จัดการบริษัท',        true,  true,  false, false],
                ['วิเคราะห์ต้นทุน',    true,  false, false, false],
              ].map(([feat, su, ad, mg, em]) => (
                <tr key={feat} className="hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-700 font-medium">{feat}</td>
                  {[su,ad,mg,em].map((v,i)=>(
                    <td key={i} className="py-2 px-3 text-center">
                      {v ? <Check className="w-4 h-4 mx-auto" style={{color:G.primary}}/> : <X className="w-4 h-4 mx-auto text-gray-200"/>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editUser && (
        <EditUserModal
          user={editUser}
          employees={employees}
          onClose={() => setEditUser(null)}
          onSaved={() => { fetchData(); showToast('อัปเดต User สำเร็จ') }}
          lang={lang}
        />
      )}
      {showCreate && (
        <CreateUserModal
          employees={employees}
          onClose={() => setShowCreate(false)}
          onSaved={() => { fetchData(); showToast('สร้าง User Profile สำเร็จ') }}
        />
      )}
    </div>
  )
}
