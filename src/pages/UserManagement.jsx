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

// ── Field Input helper ───────────────────────────────────────
function FInput({ label, value, onChange, type='text', options, half }) {
  const cls = `w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]`
  return (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {options ? (
        <select value={value||''} onChange={e=>onChange(e.target.value)} className={cls}>
          <option value="">—</option>
          {options.map(o => <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
        </select>
      ) : (
        <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} className={cls}/>
      )}
    </div>
  )
}

// ── Edit Employee Modal (full fields) ────────────────────────
function EditUserModal({ user, employees, onClose, onSaved, lang }) {
  const emp = user.hr_employees || {}
  const [tab, setTab] = useState('personal')
  const [profileForm, setProfileForm] = useState({
    role: user.role || 'employee',
    display_name: user.display_name || '',
    employee_id: user.employee_id || '',
  })
  const [empForm, setEmpForm] = useState({
    // Personal
    prefix_th: emp.prefix_th || '',
    first_name_th: emp.first_name_th || '',
    last_name_th: emp.last_name_th || '',
    prefix_en: emp.prefix_en || '',
    first_name_en: emp.first_name_en || '',
    last_name_en: emp.last_name_en || '',
    nickname: emp.nickname || '',
    gender: emp.gender || '',
    date_of_birth: emp.date_of_birth || '',
    national_id: emp.national_id || '',
    blood_type: emp.blood_type || '',
    nationality: emp.nationality || '',
    religion: emp.religion || '',
    marital_status: emp.marital_status || '',
    // Work
    position_th: emp.position_th || '',
    position_en: emp.position_en || '',
    department_name_th: emp.department_name_th || '',
    department_name_en: emp.department_name_en || '',
    bu: emp.bu || '',
    level: emp.level || '',
    employment_type: emp.employment_type || '',
    hire_date: emp.hire_date || '',
    work_schedule: emp.work_schedule || '',
    company_entity: emp.company_entity || '',
    // Contact
    email: emp.email || '',
    phone: emp.phone || '',
    personal_email: emp.personal_email || '',
    address: emp.address || '',
    // Education
    education_level: emp.education_level || '',
    education_major: emp.education_major || '',
    education_faculty: emp.education_faculty || '',
    education_university: emp.education_university || '',
    // Financial
    base_salary: emp.base_salary || '',
    bank_name: emp.bank_name || '',
    bank_account: emp.bank_account || '',
    bank_code: emp.bank_code || '',
    payment_method: emp.payment_method || '',
    payroll_cycle: emp.payroll_cycle || '',
    salary_effective_date: emp.salary_effective_date || '',
    tax_calculation_method: emp.tax_calculation_method || '',
    tax_salary_multiplier: emp.tax_salary_multiplier || '',
    // Personal extra
    badge_number: emp.badge_number || '',
    id_card_expiry: emp.id_card_expiry || '',
    id_card_issued_at: emp.id_card_issued_at || '',
    hometown: emp.hometown || '',
    ethnicity: emp.ethnicity || '',
    height: emp.height || '',
    weight: emp.weight || '',
    // Work extra
    branch: emp.branch || '',
    employee_status: emp.employee_status || '',
    payroll_start_date: emp.payroll_start_date || '',
    // Family
    father_name: emp.father_name || '',
    father_occupation: emp.father_occupation || '',
    mother_name: emp.mother_name || '',
    mother_occupation: emp.mother_occupation || '',
    emergency_contact_name: emp.emergency_contact_name || '',
    emergency_contact_relation: emp.emergency_contact_relation || '',
    // SSO
    sso_deduct: emp.sso_deduct || '',
    social_security_no: emp.social_security_no || '',
    sso_start_date: emp.sso_start_date || '',
    sso_method: emp.sso_method || '',
    sso_hospital: emp.sso_hospital || '',
    // PVD
    pvd_method: emp.pvd_method || '',
    pvd_start_date: emp.pvd_start_date || '',
    pvd_account: emp.pvd_account || '',
    pvd_employee_rate: emp.pvd_employee_rate || '',
    pvd_prev_employee_amount: emp.pvd_prev_employee_amount || '',
    pvd_prev_employer_amount: emp.pvd_prev_employer_amount || '',
    // Offboarding
    resignation_date: emp.resignation_date || '',
    resignation_reason: emp.resignation_reason || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const sf = (k) => (v) => setEmpForm(p=>({...p,[k]:v}))

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      // Save profile
      const { error: pe } = await supabase.from('hr_user_profiles')
        .update({ role: profileForm.role, display_name: profileForm.display_name || null, employee_id: profileForm.employee_id || null })
        .eq('id', user.id)
      if (pe) throw pe

      // Save employee data if linked
      const empId = profileForm.employee_id || user.employee_id
      if (empId) {
        const empData = {
          prefix_th: empForm.prefix_th || null,
          first_name_th: empForm.first_name_th || null,
          last_name_th: empForm.last_name_th || null,
          prefix_en: empForm.prefix_en || null,
          first_name_en: empForm.first_name_en || null,
          last_name_en: empForm.last_name_en || null,
          nickname: empForm.nickname || null,
          gender: empForm.gender || null,
          date_of_birth: empForm.date_of_birth || null,
          national_id: empForm.national_id || null,
          blood_type: empForm.blood_type || null,
          nationality: empForm.nationality || null,
          religion: empForm.religion || null,
          marital_status: empForm.marital_status || null,
          position_th: empForm.position_th || null,
          position_en: empForm.position_en || null,
          department_name_th: empForm.department_name_th || null,
          department_name_en: empForm.department_name_en || null,
          bu: empForm.bu || null,
          level: empForm.level || null,
          employment_type: empForm.employment_type || null,
          hire_date: empForm.hire_date || null,
          work_schedule: empForm.work_schedule || null,
          company_entity: empForm.company_entity || null,
          email: empForm.email || null,
          phone: empForm.phone || null,
          personal_email: empForm.personal_email || null,
          address: empForm.address || null,
          education_level: empForm.education_level || null,
          education_major: empForm.education_major || null,
          education_faculty: empForm.education_faculty || null,
          education_university: empForm.education_university || null,
          base_salary: empForm.base_salary ? parseFloat(empForm.base_salary) : null,
          bank_name: empForm.bank_name || null,
          bank_account: empForm.bank_account || null,
          bank_code: empForm.bank_code || null,
          payment_method: empForm.payment_method || null,
          payroll_cycle: empForm.payroll_cycle || null,
          salary_effective_date: empForm.salary_effective_date || null,
          tax_calculation_method: empForm.tax_calculation_method || null,
          tax_salary_multiplier: empForm.tax_salary_multiplier ? parseFloat(empForm.tax_salary_multiplier) : null,
          badge_number: empForm.badge_number || null,
          id_card_expiry: empForm.id_card_expiry || null,
          id_card_issued_at: empForm.id_card_issued_at || null,
          hometown: empForm.hometown || null,
          ethnicity: empForm.ethnicity || null,
          height: empForm.height ? parseFloat(empForm.height) : null,
          weight: empForm.weight ? parseFloat(empForm.weight) : null,
          branch: empForm.branch || null,
          employee_status: empForm.employee_status || null,
          payroll_start_date: empForm.payroll_start_date || null,
          father_name: empForm.father_name || null,
          father_occupation: empForm.father_occupation || null,
          mother_name: empForm.mother_name || null,
          mother_occupation: empForm.mother_occupation || null,
          emergency_contact_name: empForm.emergency_contact_name || null,
          emergency_contact_relation: empForm.emergency_contact_relation || null,
          sso_deduct: empForm.sso_deduct || null,
          social_security_no: empForm.social_security_no || null,
          sso_start_date: empForm.sso_start_date || null,
          sso_method: empForm.sso_method || null,
          sso_hospital: empForm.sso_hospital || null,
          pvd_method: empForm.pvd_method || null,
          pvd_start_date: empForm.pvd_start_date || null,
          pvd_account: empForm.pvd_account || null,
          pvd_employee_rate: empForm.pvd_employee_rate ? parseFloat(empForm.pvd_employee_rate) : null,
          pvd_prev_employee_amount: empForm.pvd_prev_employee_amount ? parseFloat(empForm.pvd_prev_employee_amount) : null,
          pvd_prev_employer_amount: empForm.pvd_prev_employer_amount ? parseFloat(empForm.pvd_prev_employer_amount) : null,
          resignation_date: empForm.resignation_date || null,
          resignation_reason: empForm.resignation_reason || null,
        }
        const { error: ee } = await supabase.from('hr_employees').update(empData).eq('id', empId)
        if (ee) throw ee
      }
      onSaved(); onClose()
    } catch(e) { setError(e.message || 'เกิดข้อผิดพลาด'); setSaving(false) }
  }

  const TABS = [
    { key:'account', label:'บัญชี/Role' },
    { key:'personal', label:'ข้อมูลส่วนตัว' },
    { key:'work', label:'ข้อมูลงาน' },
    { key:'contact', label:'ติดต่อ' },
    { key:'education', label:'การศึกษา' },
    { key:'financial', label:'การเงิน' },
    { key:'family', label:'ครอบครัว' },
    { key:'sso', label:'ประกันสังคม' },
    { key:'pvd', label:'กองทุนสำรอง' },
  ]

  const hasEmp = !!(profileForm.employee_id || user.employee_id)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Av name={user.display_name || user.email} size={38}/>
            <div>
              <p className="font-bold text-gray-900">{user.display_name || user.email}</p>
              <p className="text-xs text-gray-400">{emp.employee_code ? `รหัส: ${emp.employee_code}` : 'ไม่ได้เชื่อมพนักงาน'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400"/></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${tab===t.key ? 'border-[#00A651] text-[#007A3D]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg mb-3">{error}</div>}

          {/* Tab: Account */}
          {tab === 'account' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">ชื่อแสดง</label>
                <input className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                  value={profileForm.display_name} onChange={e=>setProfileForm(p=>({...p,display_name:e.target.value}))}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">สิทธิ์การเข้าถึง (Role)</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <button key={r.key} onClick={()=>setProfileForm(p=>({...p,role:r.key}))}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${profileForm.role===r.key ? 'border-[#00A651] bg-[#E6F9F0]' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="text-base leading-none mt-0.5">{r.icon}</span>
                      <div><div className="text-xs font-semibold text-gray-800">{r.label}</div>
                      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{r.desc}</div></div>
                      {profileForm.role===r.key && <Check className="w-3.5 h-3.5 text-[#00A651] ml-auto shrink-0 mt-0.5"/>}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">เชื่อมกับพนักงาน</label>
                <select value={profileForm.employee_id} onChange={e=>setProfileForm(p=>({...p,employee_id:e.target.value}))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                  <option value="">— ไม่เชื่อม —</option>
                  {employees.map(e2 => {
                    const n = `${e2.first_name_th||''} ${e2.last_name_th||''}`.trim()
                    return <option key={e2.id} value={e2.id}>{e2.employee_code} — {n}</option>
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Tab: Personal */}
          {tab === 'personal' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="คำนำหน้า (TH)" value={empForm.prefix_th} onChange={sf('prefix_th')} half options={['นาย','นาง','นางสาว','น.ส.','ดร.']}/>
              <FInput label="ชื่อ (TH)" value={empForm.first_name_th} onChange={sf('first_name_th')} half/>
              <FInput label="นามสกุล (TH)" value={empForm.last_name_th} onChange={sf('last_name_th')} half/>
              <FInput label="ชื่อเล่น" value={empForm.nickname} onChange={sf('nickname')} half/>
              <FInput label="Prefix (EN)" value={empForm.prefix_en} onChange={sf('prefix_en')} half options={['Mr.','Mrs.','Ms.','Dr.']}/>
              <FInput label="First Name (EN)" value={empForm.first_name_en} onChange={sf('first_name_en')} half/>
              <FInput label="Last Name (EN)" value={empForm.last_name_en} onChange={sf('last_name_en')} half/>
              <FInput label="เลขที่บัตรพนักงาน" value={empForm.badge_number} onChange={sf('badge_number')} half/>
              <FInput label="เพศ" value={empForm.gender} onChange={sf('gender')} half options={[{value:'male',label:'ชาย'},{value:'female',label:'หญิง'}]}/>
              <FInput label="วันเกิด" value={empForm.date_of_birth} onChange={sf('date_of_birth')} type="date" half/>
              <FInput label="เลขบัตรประชาชน" value={empForm.national_id} onChange={sf('national_id')} half/>
              <FInput label="วันหมดอายุบัตร" value={empForm.id_card_expiry} onChange={sf('id_card_expiry')} type="date" half/>
              <FInput label="ออกให้ ณ" value={empForm.id_card_issued_at} onChange={sf('id_card_issued_at')} half/>
              <FInput label="ภูมิลำเนา" value={empForm.hometown} onChange={sf('hometown')} half/>
              <FInput label="เชื้อชาติ" value={empForm.ethnicity} onChange={sf('ethnicity')} half/>
              <FInput label="สัญชาติ" value={empForm.nationality} onChange={sf('nationality')} half/>
              <FInput label="ศาสนา" value={empForm.religion} onChange={sf('religion')} half options={['พุทธ','คริสต์','อิสลาม','อื่นๆ']}/>
              <FInput label="สถานภาพสมรส" value={empForm.marital_status} onChange={sf('marital_status')} half options={[{value:'single',label:'โสด'},{value:'married',label:'สมรส'},{value:'divorced',label:'หย่าร้าง'},{value:'widowed',label:'หม้าย'}]}/>
              <FInput label="หมู่เลือด" value={empForm.blood_type} onChange={sf('blood_type')} half options={['A','B','AB','O','เอ','บี','เอบี','โอ']}/>
              <FInput label="ส่วนสูง (ซม.)" value={empForm.height} onChange={sf('height')} type="number" half/>
              <FInput label="น้ำหนัก (กก.)" value={empForm.weight} onChange={sf('weight')} type="number" half/>
            </div>
          )}

          {/* Tab: Work */}
          {tab === 'work' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="บริษัท" value={empForm.company_entity} onChange={sf('company_entity')} half options={['ONL','EFINX','ATESS','SMT']}/>
              <FInput label="BU/หน่วยงานหลัก" value={empForm.bu} onChange={sf('bu')} half/>
              <FInput label="แผนก" value={empForm.department_name_th} onChange={sf('department_name_th')} half/>
              <FInput label="Department (EN)" value={empForm.department_name_en} onChange={sf('department_name_en')} half/>
              <FInput label="ตำแหน่ง (TH)" value={empForm.position_th} onChange={sf('position_th')} half/>
              <FInput label="Position (EN)" value={empForm.position_en} onChange={sf('position_en')} half/>
              <FInput label="สังกัดสาขา" value={empForm.branch} onChange={sf('branch')} half/>
              <FInput label="สถานภาพพนักงาน" value={empForm.employee_status} onChange={sf('employee_status')} half options={['พนักงาน','ทดลองงาน','ลาออก','เลิกจ้าง']}/>
              <FInput label="ระดับ (Grade)" value={empForm.level} onChange={sf('level')} half options={['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12']}/>
              <FInput label="ประเภทการจ้าง" value={empForm.employment_type} onChange={sf('employment_type')} half options={['ประจำ','สัญญาจ้าง 1 ปี','รายวัน','Part-time','Outsource']}/>
              <FInput label="วันเริ่มงาน" value={empForm.hire_date} onChange={sf('hire_date')} type="date" half/>
              <FInput label="วันที่บรรจุ" value={empForm.confirmed_date} onChange={sf('confirmed_date')} type="date" half/>
              <FInput label="วันที่เริ่มคำนวณเงินเดือน" value={empForm.payroll_start_date} onChange={sf('payroll_start_date')} type="date" half/>
              <FInput label="เวลาทำงาน" value={empForm.work_schedule} onChange={sf('work_schedule')} half options={['09.00-18.00','08.30-17.30','08.00-17.00']}/>
              <FInput label="วันที่ลาออก" value={empForm.resignation_date} onChange={sf('resignation_date')} type="date" half/>
              <FInput label="สาเหตุลาออก" value={empForm.resignation_reason} onChange={sf('resignation_reason')} half options={['ลาออก','เลิกจ้าง','ไม่ผ่านทดลองงาน','เกษียณ']}/>
            </div>
          )}

          {/* Tab: Contact */}
          {tab === 'contact' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="Email บริษัท" value={empForm.email} onChange={sf('email')} type="email"/>
              <FInput label="Email ส่วนตัว" value={empForm.personal_email} onChange={sf('personal_email')} type="email"/>
              <FInput label="เบอร์โทรศัพท์" value={empForm.phone} onChange={sf('phone')} half/>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">ที่อยู่</label>
                <textarea value={empForm.address||''} onChange={e=>sf('address')(e.target.value)} rows={3}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651] resize-none"/>
              </div>
            </div>
          )}

          {/* Tab: Education */}
          {tab === 'education' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="ระดับการศึกษา" value={empForm.education_level} onChange={sf('education_level')} half options={['ป.ตรี','ป.โท','ป.เอก','ปวส.','ปวช.','มัธยม']}/>
              <FInput label="สาขาวิชา" value={empForm.education_major} onChange={sf('education_major')} half/>
              <FInput label="คณะ" value={empForm.education_faculty} onChange={sf('education_faculty')} half/>
              <FInput label="มหาวิทยาลัย" value={empForm.education_university} onChange={sf('education_university')} half/>
            </div>
          )}

          {/* Tab: Financial */}
          {tab === 'financial' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="อัตราเงินเดือน (บาท)" value={empForm.base_salary} onChange={sf('base_salary')} type="number" half/>
              <FInput label="รอบจ่าย" value={empForm.payroll_cycle} onChange={sf('payroll_cycle')} half options={['ทุกสิ้นเดือน','ทุกครึ่งเดือน','ทุกสัปดาห์']}/>
              <FInput label="วิธีจ่าย" value={empForm.payment_method} onChange={sf('payment_method')} half options={['ผ่านธนาคาร','เงินสด']}/>
              <FInput label="รหัสธนาคาร" value={empForm.bank_code} onChange={sf('bank_code')} half/>
              <FInput label="ธนาคาร" value={empForm.bank_name} onChange={sf('bank_name')} half/>
              <FInput label="เลขที่บัญชี" value={empForm.bank_account} onChange={sf('bank_account')} half/>
              <FInput label="วันที่ปรับเงินเดือนล่าสุด" value={empForm.salary_effective_date} onChange={sf('salary_effective_date')} type="date" half/>
              <FInput label="วิธีคำนวณภาษี" value={empForm.tax_calculation_method} onChange={sf('tax_calculation_method')} half options={['หัก ณ ที่จ่าย','เหมาจ่าย']}/>
              <FInput label="ตัวคูณเงินเดือน (ภาษี)" value={empForm.tax_salary_multiplier} onChange={sf('tax_salary_multiplier')} type="number" half/>
            </div>
          )}
          {tab === 'family' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="ชื่อบิดา" value={empForm.father_name} onChange={sf('father_name')} half/>
              <FInput label="อาชีพบิดา" value={empForm.father_occupation} onChange={sf('father_occupation')} half/>
              <FInput label="ชื่อมารดา" value={empForm.mother_name} onChange={sf('mother_name')} half/>
              <FInput label="อาชีพมารดา" value={empForm.mother_occupation} onChange={sf('mother_occupation')} half/>
              <FInput label="ผู้ติดต่อฉุกเฉิน" value={empForm.emergency_contact_name} onChange={sf('emergency_contact_name')} half/>
              <FInput label="ความสัมพันธ์" value={empForm.emergency_contact_relation} onChange={sf('emergency_contact_relation')} half/>
            </div>
          )}
          {tab === 'sso' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="หักประกันสังคม" value={empForm.sso_deduct} onChange={sf('sso_deduct')} half options={['หัก','ไม่หัก']}/>
              <FInput label="เลขที่บัตรประกันสังคม" value={empForm.social_security_no} onChange={sf('social_security_no')} half/>
              <FInput label="วันที่สมัครประกันสังคม" value={empForm.sso_start_date} onChange={sf('sso_start_date')} type="date" half/>
              <FInput label="วิธีหักประกันสังคม" value={empForm.sso_method} onChange={sf('sso_method')} half/>
              <FInput label="สถานพยาบาล" value={empForm.sso_hospital} onChange={sf('sso_hospital')}/>
            </div>
          )}
          {tab === 'pvd' && (
            <div className="grid grid-cols-2 gap-3">
              <FInput label="วิธีหักกองทุน" value={empForm.pvd_method} onChange={sf('pvd_method')} half options={['%คงที่ของเงินเดือนเต็มเดือน','ไม่หัก']}/>
              <FInput label="วันที่สมัครกองทุน" value={empForm.pvd_start_date} onChange={sf('pvd_start_date')} type="date" half/>
              <FInput label="เลขที่บัญชีกองทุน" value={empForm.pvd_account} onChange={sf('pvd_account')} half/>
              <FInput label="% หักพนักงานเข้ากองทุน" value={empForm.pvd_employee_rate} onChange={sf('pvd_employee_rate')} type="number" half/>
              <FInput label="เงินสะสมก่อนปีปัจจุบัน" value={empForm.pvd_prev_employee_amount} onChange={sf('pvd_prev_employee_amount')} type="number" half/>
              <FInput label="เงินสมทบบริษัทก่อนปีปัจจุบัน" value={empForm.pvd_prev_employer_amount} onChange={sf('pvd_prev_employer_amount')} type="number" half/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">{hasEmp ? `ID: ${emp.employee_code}` : 'ยังไม่เชื่อมพนักงาน'}</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
              style={{background:G.primary}}>
              <Save className="w-4 h-4"/>{saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
            </button>
          </div>
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
        .select('*, hr_employees(id, employee_code, badge_number, prefix_th, first_name_th, last_name_th, prefix_en, first_name_en, last_name_en, nickname, gender, date_of_birth, national_id, id_card_expiry, id_card_issued_at, blood_type, nationality, ethnicity, religion, marital_status, hometown, height, weight, phone, email, personal_email, address, emergency_contact_name, emergency_contact_relation, position_th, position_en, department_name_th, department_name_en, bu, branch, level, employment_type, employee_status, hire_date, confirmed_date, payroll_start_date, payroll_cycle, payment_method, work_schedule, company_entity, education_level, education_major, education_faculty, education_university, base_salary, bank_code, bank_name, bank_account, salary_effective_date, tax_calculation_method, tax_salary_multiplier, father_name, father_occupation, mother_name, mother_occupation, sso_deduct, social_security_no, sso_start_date, sso_method, sso_hospital, pvd_method, pvd_start_date, pvd_account, pvd_employee_rate, pvd_prev_employee_amount, pvd_prev_employer_amount, resignation_date, resignation_reason, status)')
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
        <div className="bg-white rounded-xl border overflow-hidden" style={{borderColor:'#D8EDE3'}}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor:G.primary}}/>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="text-xs whitespace-nowrap" style={{minWidth:'2400px'}}>
                  <thead>
                    <tr style={{background:'#F4F7F5',borderBottom:'1px solid #D8EDE3'}}>
                      {/* Sticky name col */}
                      <th className="sticky left-0 z-10 text-left py-3 px-3 font-semibold text-gray-500 bg-[#F4F7F5] border-r border-gray-200" style={{minWidth:180}}>ชื่อ-นามสกุล</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:90}}>รหัส</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:70}}>ชื่อเล่น</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:160}}>Name (EN)</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:60}}>เพศ</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:95}}>วันเกิด</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:130}}>เลขบัตร</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:70}}>หมู่เลือด</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:80}}>สมรส</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:70}}>บริษัท</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:100}}>BU</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:200}}>แผนก</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:160}}>ตำแหน่ง</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:60}}>ระดับ</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:100}}>ประเภทจ้าง</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:95}}>วันเริ่มงาน</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:95}}>วันที่ลาออก</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:180}}>Email บริษัท</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:110}}>เบอร์โทร</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:180}}>Email ส่วนตัว</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:80}}>วุฒิ</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:160}}>มหาวิทยาลัย</th>
                      <th className="text-right py-3 px-3 font-semibold text-gray-500" style={{minWidth:90}}>เงินเดือน</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:130}}>ธนาคาร</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:120}}>เลขบัญชี</th>
                      <th className="text-left py-3 px-3 font-semibold text-gray-500" style={{minWidth:95}}>Role</th>
                      <th className="py-3 px-3 sticky right-0 bg-[#F4F7F5] border-l border-gray-200" style={{minWidth:70}}/>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={27} className="text-center py-12 text-gray-400">ไม่พบข้อมูล</td></tr>
                    ) : filtered.map((u, ri) => {
                      const emp = u.hr_employees
                      const fullName = emp ? `${emp.prefix_th||''} ${emp.first_name_th||''} ${emp.last_name_th||''}`.trim() : (u.display_name || '-')
                      const nameEn = emp ? `${emp.prefix_en||''} ${emp.first_name_en||''} ${emp.last_name_en||''}`.trim() : '-'
                      const genderLabel = emp?.gender === 'male' ? 'ชาย' : emp?.gender === 'female' ? 'หญิง' : '-'
                      const maritalMap = {single:'โสด',married:'สมรส',divorced:'หย่า',widowed:'หม้าย'}
                      const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}) : '-'
                      const fmtSalary = (s) => s ? Number(s).toLocaleString('th-TH') : '-'
                      const rowBg = ri % 2 === 0 ? '#fff' : '#FAFDFB'

                      const TD = ({children, right, mono}) => (
                        <td className={`py-2 px-3 text-gray-700 border-b border-gray-50 ${right?'text-right':''} ${mono?'font-mono':''}`}
                          style={{background:rowBg}}>
                          {children ?? <span className="text-gray-300">—</span>}
                        </td>
                      )

                      return (
                        <tr key={u.id} className="hover:bg-[#F0FBF5] transition-colors group">
                          {/* Sticky: Name */}
                          <td className="sticky left-0 z-10 py-2 px-3 border-b border-r border-gray-100 group-hover:bg-[#F0FBF5]"
                            style={{background:rowBg, minWidth:180}}>
                            <div className="flex items-center gap-2">
                              <Av name={fullName} size={28}/>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-xs truncate">{fullName}</p>
                                <p className="text-[10px] text-gray-400 truncate">{u.email||'-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-gray-700 border-b border-gray-50 font-mono"
                            style={{background:rowBg}}>
                            {emp?.employee_code ? (
                              <span onClick={()=>nav&&nav('employees',{employeeCode:emp.employee_code})}
                                className="cursor-pointer text-[#7DC242] hover:underline underline-offset-2">
                                {emp.employee_code}
                              </span>
                            ) : '-'}
                          </td>
                          <TD>{emp?.nickname||'-'}</TD>
                          <TD>{nameEn||'-'}</TD>
                          <TD>{genderLabel}</TD>
                          <TD>{fmtDate(emp?.date_of_birth)}</TD>
                          <TD mono>{emp?.national_id||'-'}</TD>
                          <TD>{emp?.blood_type||'-'}</TD>
                          <TD>{maritalMap[emp?.marital_status]||'-'}</TD>
                          <TD>
                            {emp?.company_entity ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{background:G.light,color:G.dark}}>
                                {emp.company_entity}
                              </span>
                            ) : '-'}
                          </TD>
                          <TD>{emp?.bu||'-'}</TD>
                          <TD><span className="truncate block max-w-[190px]">{emp?.department_name_th||'-'}</span></TD>
                          <TD><span className="truncate block max-w-[150px]">{emp?.position_th||'-'}</span></TD>
                          <TD>
                            {emp?.level ? (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px]">{emp.level}</span>
                            ) : '-'}
                          </TD>
                          <TD>{emp?.employment_type||'-'}</TD>
                          <TD>{fmtDate(emp?.hire_date)}</TD>
                          <TD>{fmtDate(emp?.resignation_date)}</TD>
                          <TD><span className="truncate block max-w-[170px] text-[10px]">{emp?.email||'-'}</span></TD>
                          <TD mono>{emp?.phone||'-'}</TD>
                          <TD><span className="truncate block max-w-[170px] text-[10px]">{emp?.personal_email||'-'}</span></TD>
                          <TD>{emp?.education_level||'-'}</TD>
                          <TD><span className="truncate block max-w-[150px]">{emp?.education_university||'-'}</span></TD>
                          <TD right>{fmtSalary(emp?.base_salary)}</TD>
                          <TD><span className="truncate block max-w-[120px]">{emp?.bank_name||'-'}</span></TD>
                          <TD mono>{emp?.bank_account||'-'}</TD>
                          <td className="py-2 px-3 border-b border-gray-50" style={{background:rowBg}}>
                            <div className="relative inline-block">
                              <RoleBadge role={u.role}/>
                              {myRole === 'superuser' && (
                                <select value={u.role} onChange={e=>handleRoleQuickChange(u.id,e.target.value)}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full" title="เปลี่ยน Role">
                                  {ROLES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
                                </select>
                              )}
                            </div>
                          </td>
                          {/* Sticky: Actions */}
                          <td className="sticky right-0 z-10 py-2 px-2 border-b border-l border-gray-100 group-hover:bg-[#F0FBF5]"
                            style={{background:rowBg}}>
                            <div className="flex items-center gap-1">
                              <button onClick={()=>setEditUser(u)}
                                className="p-1.5 rounded hover:bg-[#E6F9F0] text-gray-400 hover:text-[#007A3D]" title="แก้ไข">
                                <Edit3 className="w-3.5 h-3.5"/>
                              </button>
                              {myRole==='superuser' && (
                                <button onClick={()=>handleDelete(u.id)} disabled={deleting===u.id}
                                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="ลบ">
                                  <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t text-xs text-gray-400 flex items-center gap-3" style={{borderColor:'#EEF5F0'}}>
                <span>แสดง {filtered.length} จาก {users.length} บัญชี</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-400">เลื่อนซ้าย-ขวาเพื่อดูทุกคอลัมน์ · คลิก ✏️ เพื่อแก้ไข</span>
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
