import React, { useState, useEffect, useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  Users, UserPlus, Briefcase, CalendarX, TrendingUp, TrendingDown,
  ChevronRight, Megaphone, Gift, ShieldCheck,
  BookOpen, Bell, Search, ChevronDown,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useCompanyFilter } from '../lib/CompanyFilterContext'

// ── Brand palette ──────────────────────────────────────────────────
const G = {
  primary: '#7DC242',
  dark:    '#5A9020',
  darker:  '#4E7F1A',
  light:   '#E8F5D0',
  light2:  '#C5E888',
  mid:     '#8FCC4A',
  accent:  '#F5A623',
  text:    '#4E7F1A',
}

const BU_COLORS = ['#7DC242','#5A9020','#8FCC4A','#C5E888','#F5A623','#B8DC80','#D8EDE3']

// ── Helpers ────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString('th-TH')

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Stat Card ─────────────────────────────────────────────────────
function StatCard({ icon: Icon, iconStyle, label, value, unit, change, changeUp }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #D8EDE3', padding:'13px', display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ width:36, height:36, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:3, ...iconStyle }}>
        <Icon style={{ width:20, height:20 }} />
      </div>
      <div style={{ fontSize:11, color:'#7A9E8A' }}>{label}</div>
      <div>
        <span style={{ fontSize:22, fontWeight:500, color:'#1a2e1a', lineHeight:1 }}>{value}</span>
        {unit && <span style={{ fontSize:12, color:'#7A9E8A', marginLeft:2 }}>{unit}</span>}
      </div>
      {change && (
        <div style={{ fontSize:11, display:'flex', alignItems:'center', gap:3, color: changeUp ? G.dark : '#c62828' }}>
          {changeUp ? <TrendingUp style={{width:12,height:12}}/> : <TrendingDown style={{width:12,height:12}}/>}
          {change}
        </div>
      )}
    </div>
  )
}

// ── Section Card ──────────────────────────────────────────────────
function Card({ title, action, onAction, children }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:'0.5px solid #D8EDE3', padding:15, height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:11 }}>
        <span style={{ fontSize:14, fontWeight:500, color:'#1a2e1a' }}>{title}</span>
        {action && (
          <span onClick={onAction}
            style={{ fontSize:12, color:G.primary, fontWeight:500, cursor: onAction ? 'pointer' : 'default',
              padding:'2px 8px', borderRadius:6, transition:'background .15s' }}
            onMouseEnter={e => onAction && (e.target.style.background='#E6F9F0')}
            onMouseLeave={e => onAction && (e.target.style.background='transparent')}>
            {action} {onAction ? '→' : ''}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────────────
function Av({ name = '' }) {
  const initials = name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() || '?'
  return (
    <div style={{ width:26, height:26, borderRadius:'50%', background:G.light2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:500, color:G.text, flexShrink:0 }}>
      {initials}
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────

// ── DrillDown Panel ─────────────────────────────────────────────────
function DrillDownPanel({ title, rows, columns, onClose, onNavigate, navPage, lang }) {
  const [search, setSearch] = React.useState('')
  if (!rows) return null
  const filtered = search
    ? rows.filter(r => columns.some(c => String(c.get(r)||'').toLowerCase().includes(search.toLowerCase())))
    : rows
  return (
    <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.35)' }}/>
      <div style={{ position:'relative', width:'min(640px,95vw)', background:'#fff', height:'100vh', display:'flex', flexDirection:'column', boxShadow:'-4px 0 24px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #E8F5D0', display:'flex', alignItems:'center', justifyContent:'space-between', background:G.light }}>
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:G.darker }}>{title}</div>
            <div style={{ fontSize:12, color:G.dark, marginTop:2 }}>{filtered.length} รายการ</div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {navPage && (
              <button onClick={() => { onClose(); onNavigate && onNavigate(navPage) }}
                style={{ fontSize:12, color:G.primary, border:`1px solid ${G.light2}`, borderRadius:6, padding:'4px 12px', background:'#fff', cursor:'pointer' }}>
                ดูหน้าเต็ม →
              </button>
            )}
            <button onClick={onClose} style={{ fontSize:20, color:'#999', background:'none', border:'none', cursor:'pointer', lineHeight:1 }}>×</button>
          </div>
        </div>
        {/* Search */}
        <div style={{ padding:'10px 20px', borderBottom:'1px solid #F0F7F0' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา..."
            style={{ width:'100%', border:'1px solid #D8EDE3', borderRadius:8, padding:'6px 12px', fontSize:13, outline:'none', boxSizing:'border-box' }} />
        </div>
        {/* Table */}
        <div style={{ flex:1, overflowY:'auto' }}>
          <table style={{ width:'100%', fontSize:12, borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#F8FDF4', position:'sticky', top:0 }}>
                {columns.map(c => (
                  <th key={c.key} style={{ textAlign:'left', padding:'8px 12px', color:'#7A9E8A', fontWeight:600, borderBottom:'1px solid #E8F5D0', whiteSpace:'nowrap' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={columns.length} style={{ textAlign:'center', padding:24, color:'#A0B8A8' }}>ไม่พบข้อมูล</td></tr>
              ) : filtered.map((row, i) => (
                <tr key={i} style={{ borderBottom:'1px solid #F4F9F0', background: i%2===0?'#fff':'#FAFDF7' }}>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding:'7px 12px', color:'#2a4a2a', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {c.render ? c.render(row) : (c.get ? c.get(row) : row[c.key]) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ lang = 'th', setPage, onNavigate }) {
  const nav = onNavigate || setPage || (() => {})
  const { profile, role } = useAuth()
  const { filterByCompany } = useCompanyFilter()

  const [empTotal, setEmpTotal]         = useState(0)
  const [empNew, setEmpNew]             = useState(0)
  const [openPositions, setOpenPositions] = useState(0)
  const [leaveCount, setLeaveCount]     = useState(0)
  const [recentLeave, setRecentLeave]   = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [upcomingTraining, setUpcomingTraining] = useState([])
  const [buData, setBuData]             = useState([])
  const [trendData, setTrendData]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [drillDown, setDrillDown]       = useState(null)
  const [allEmployees, setAllEmployees] = useState([])
  const [empResigned, setEmpResigned]   = useState(0)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const today = new Date()
    const thisMonthStart = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`

    const [empRes, newEmpRes, openRes, leaveRes, recentLeaveRes, annRes, trainRes, buRes, resignedRes] = await Promise.all([
      supabase.from('hr_employees').select('id', { count:'exact', head:true }).eq('status','active'),
      supabase.from('hr_employees').select('id', { count:'exact', head:true }).eq('status','active').gte('hire_date', `${today.getFullYear()}-01-01`),
      supabase.from('hr_recruitment').select('id', { count:'exact', head:true }).eq('status','open'),
      supabase.from('hr_leave_requests').select('id', { count:'exact', head:true }).eq('status','pending'),
      supabase.from('hr_leave_requests').select(`
        id, employee_id, leave_type_id, start_date, end_date, status,
        hr_employees(first_name_th, last_name_th, first_name_en, last_name_en),
        hr_leave_types(name_th, name_en)
      `).order('created_at', { ascending:false }).limit(4),
      supabase.from('hr_announcements').select('*').eq('is_active', true).order('created_at', { ascending:false }).limit(3),
      supabase.from('hr_training').select('*').gte('start_date', today.toISOString().split('T')[0]).order('start_date').limit(3),
      supabase.from('hr_employees').select('bu, company_entity').eq('status','active'),
      supabase.from('hr_employees').select('id', { count:'exact', head:true }).eq('status','resigned').gte('resignation_date', `${today.getFullYear()}-01-01`),
    ])

    setEmpTotal(empRes.count || 0)
    setEmpNew(newEmpRes.count || 0)
    setEmpResigned(resignedRes.count || 0)
    setOpenPositions(openRes.count || 0)
    setLeaveCount(leaveRes.count || 0)
    setRecentLeave(recentLeaveRes.data || [])
    setAnnouncements(annRes.data || [])
    setUpcomingTraining(trainRes.data || [])

    // BU breakdown from employees
    if (buRes.data && buRes.data.length > 0) {
      const map = {}
      buRes.data.forEach(e => {
        const key = e.bu || e.company_entity || 'อื่น ๆ'
        map[key] = (map[key] || 0) + 1
      })
      const total = buRes.data.length || 1
      const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,7)
      setBuData(sorted.map(([name, count]) => ({ name, value: Math.round((count/total)*1000)/10 })))
    } else {
      setBuData([])
    }

    // Employee trend — load from hr_monthly_headcount snapshot table
    const { data: headcountData } = await supabase
      .from('hr_monthly_headcount')
      .select('snapshot_month, headcount, new_hires')
      .order('snapshot_month', { ascending: true })
      .limit(12)
    if (headcountData && headcountData.length > 0) {
      setTrendData(headcountData.map(row => {
        const d = new Date(row.snapshot_month)
        const label = lang === 'th' ? MONTHS_TH[d.getMonth()] + String(d.getFullYear()).slice(2) : MONTHS_EN[d.getMonth()] + String(d.getFullYear()).slice(2)
        return { month: label, employees: row.headcount, newJoin: row.new_hires || 0 }
      }))
    } else {
      setTrendData([])
    }

    const { data: empAll } = await supabase
      .from('hr_employees')
      .select('employee_code,prefix_th,first_name_th,last_name_th,nickname,position_th,department_name_th,bu,level,hire_date,resignation_date,status,company_entity')
      .in('status',['active','resigned'])
      .order('first_name_th')
    setAllEmployees(empAll || [])
    setLoading(false)
  }

  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'HR Manager'
  const roleLabel = { superuser:'Super Admin', admin:'ผู้ดูแลระบบ', manager:'ผู้จัดการฝ่ายบุคคล', employee:'พนักงาน' }[role] || 'HR Manager'

  const todayStr = new Date().toLocaleDateString(lang==='th' ? 'th-TH' : 'en-US', { day:'numeric', month:'long', year:'numeric' })

  const annIcons = [
    { bg:'#E3F2FD', color:'#1565C0', icon: Megaphone },
    { bg:'#FCE4EC', color:'#C62828', icon: Gift },
    { bg:G.light,   color:G.primary, icon: ShieldCheck },
  ]

  const STATUS_PILL = {
    pending:  { bg:'#FFF3E0', color:'#BF6000', label: lang==='th' ? 'รออนุมัติ' : 'Pending'  },
    approved: { bg:G.light,   color:G.dark,    label: lang==='th' ? 'อนุมัติแล้ว' : 'Approved' },
    rejected: { bg:'#FEECEC', color:'#c62828', label: lang==='th' ? 'ไม่อนุมัติ' : 'Rejected' },
  }


  const fmtHireDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'2-digit'}) : '—'
  const empCols = [
    { key:'employee_code', label:'รหัส', get: r => r.employee_code },
    { key:'name', label:'ชื่อ-นามสกุล', get: r => `${r.first_name_th||''} ${r.last_name_th||''}${r.nickname?' ('+r.nickname+')':''}`.trim() },
    { key:'position_th', label:'ตำแหน่ง', get: r => r.position_th || '—' },
    { key:'bu', label:'BU', get: r => r.bu || '—' },
    { key:'company_entity', label:'บริษัท', get: r => r.company_entity || '—' },
    { key:'hire_date', label:'วันเริ่มงาน', get: r => fmtHireDate(r.hire_date) },
  ]

  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
  const newEmps = allEmployees.filter(e => e.hire_date && new Date(e.hire_date) >= thisMonth)

  const openDrill = (type) => {
    if (type === 'total') setDrillDown({ title: `พนักงานทั้งหมด (${allEmployees.length} คน)`, rows: allEmployees, columns: empCols, navPage: 'employees' })
    else if (type === 'new') setDrillDown({ title: `พนักงานใหม่เดือนนี้ (${newEmps.length} คน)`, rows: newEmps, columns: empCols, navPage: 'onboarding' })
    else if (type === 'resigned') {
      const resignedEmps = allEmployees.filter(e => e.status === 'resigned' && e.resignation_date && new Date(e.resignation_date).getFullYear() === new Date().getFullYear())
      setDrillDown({ title: `พนักงานลาออกปี ${new Date().getFullYear()+543} (${resignedEmps.length} คน)`, rows: resignedEmps, columns: [
        { key:'code', label:'รหัส', get: r => r.employee_code },
        { key:'name', label:'ชื่อ-นามสกุล', get: r => `${r.first_name_th||''} ${r.last_name_th||''}`.trim() },
        { key:'bu', label:'BU', get: r => r.bu || '—' },
        { key:'date', label:'วันที่ลาออก', get: r => r.resignation_date ? new Date(r.resignation_date).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}) : '—' },
      ], navPage: 'employees' })
    }
    else if (type === 'leave') setDrillDown({
      title: `คำขอลา รออนุมัติ (${recentLeave.length} รายการ)`,
      rows: recentLeave,
      columns: [
        { key:'name', label:'ชื่อ', get: r => { const e=r.hr_employees; return e?`${e.first_name_th||''} ${e.last_name_th||''}`.trim():'—' } },
        { key:'type', label:'ประเภท', get: r => r.hr_leave_types?.name_th || '—' },
        { key:'start', label:'วันที่', get: r => r.start_date || '—' },
        { key:'status', label:'สถานะ', get: r => ({pending:'รออนุมัติ',approved:'อนุมัติ',rejected:'ไม่อนุมัติ'})[r.status]||r.status },
      ],
      navPage: 'leave'
    })
    else if (type === 'attendance') setDrillDown({ title: 'อัตราการเข้างาน', rows: [], columns: [], navPage: 'timeAttendance' })
    else if (type === 'open') setDrillDown({ title: 'ตำแหน่งงานว่าง', rows: [], columns: [], navPage: 'recruitment' })
    else if (type.startsWith('bu:')) {
      const buName = type.slice(3)
      const buEmps = allEmployees.filter(e => e.bu === buName)
      setDrillDown({ title: `${buName} (${buEmps.length} คน)`, rows: buEmps, columns: empCols, navPage: 'staffList' })
    }
    else if (type.startsWith('announce')) setDrillDown({ title: 'ประกาศภายใน', rows: announcements, columns: [
      { key:'title', label:'หัวข้อ', get: a => a.title_th || a.title_en || '—' },
      { key:'date', label:'วันที่', get: a => a.created_at ? new Date(a.created_at).toLocaleDateString('th-TH') : '—' },
    ], navPage: 'announcements' })
    else if (type.startsWith('training')) setDrillDown({ title: 'กิจกรรม/อบรม', rows: upcomingTraining, columns: [
      { key:'course', label:'หลักสูตร', get: t => t.course_name || '—' },
      { key:'date', label:'วันที่', get: t => t.start_date || '—' },
      { key:'count', label:'ผู้เข้าร่วม', get: t => t.participants_count || '—' },
    ], navPage: 'training' })
  }
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:`3px solid ${G.light}`, borderTopColor:G.primary, animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ background:'#F4F7F5', minHeight:'100%', padding:'20px 22px', fontFamily:'inherit' }}>

      {/* Page title */}
      <div style={{ fontSize:22, fontWeight:500, color:'#1a2e1a', marginBottom:3 }}>HR Management System</div>
      <div style={{ fontSize:13, color:'#6B9E84', marginBottom:16, display:'flex', alignItems:'center', gap:6 }}>
        {lang==='th' ? 'ภาพรวมงานบุคคลประจำเดือน' : 'Monthly HR Overview'}
        <span style={{ background:G.light, color:G.dark, borderRadius:6, padding:'3px 9px', fontSize:12, fontWeight:500, display:'flex', alignItems:'center', gap:4, cursor:'pointer', border:`0.5px solid ${G.light2}` }}>
          {todayStr} <ChevronDown style={{width:11,height:11}} />
        </span>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:11, marginBottom:16 }}>
        <div onClick={() => openDrill('total')} style={{ cursor:'pointer' }}>
          <StatCard icon={Users}      iconStyle={{background:G.light,  color:G.primary}} label={lang==='th'?'พนักงานทั้งหมด':'Total Employees'}  value={fmt(empTotal)}  unit={lang==='th'?'คน':'ppl'} change="4.3% จากเดือนที่แล้ว" changeUp />
        </div>
        <div onClick={() => openDrill('new')} style={{ cursor:'pointer' }}>
          <StatCard icon={UserPlus}   iconStyle={{background:'#E0F7EE',color:'#00875A'}} label={lang==='th'?'พนักงานใหม่':'New Employees'}       value={fmt(empNew)}    unit={lang==='th'?'คน':'ppl'} change="12.5% จากเดือนที่แล้ว" changeUp />
        </div>
        <div onClick={() => openDrill('open')} style={{ cursor:'pointer' }}>
          <StatCard icon={Briefcase}  iconStyle={{background:'#FFF3E0',color:'#E07000'}} label={lang==='th'?'ตำแหน่งงานว่าง':'Open Positions'}    value={fmt(openPositions)} unit={lang==='th'?'ตำแหน่ง':'pos'} change="4.0% จากเดือนที่แล้ว" changeUp={false} />
        </div>
        <div onClick={() => openDrill('leave')} style={{ cursor:'pointer' }}>
          <StatCard icon={CalendarX}  iconStyle={{background:'#F3E5F5',color:'#7B1FA2'}} label={lang==='th'?'คำขอลา (รออนุมัติ)':'Leave Requests'}  value={fmt(leaveCount)} unit={lang==='th'?'รายการ':'items'} change="8.7% จากเดือนที่แล้ว" changeUp />
        </div>
        <div onClick={() => openDrill('attendance')} style={{ cursor:'pointer' }}>
          <StatCard icon={TrendingUp} iconStyle={{background:'#E0F7F4',color:'#009688'}} label={lang==='th'?'อัตราการเข้างาน':'Attendance Rate'}   value="96.2" unit="%" change="1.8% จากเดือนที่แล้ว" changeUp />
        </div>
      </div>

      {/* ── Mid Grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1.3fr 1fr', gap:13, marginBottom:16 }}>

        {/* Trend chart */}
        <Card title={lang==='th'?'แนวโน้มจำนวนพนักงาน':'Employee Trend'} action={lang==='th'?'ดูรายงาน':'Reports'} onAction={() => nav('reports')}>
          <div style={{ display:'flex', gap:16, marginBottom:10, fontSize:11, color:'#6B9E84' }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:10, height:10, borderRadius:2, background:'#B2E5C8', display:'inline-block' }}/>
              {lang==='th'?'พนักงานทั้งหมด (คน)':'Total Employees'}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ width:18, borderTop:`2px dashed ${G.accent}`, display:'inline-block' }}/>
              {lang==='th'?'พนักงานใหม่ (คน)':'New Employees'}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <ComposedChart data={trendData} margin={{ top:5, right:10, left:-15, bottom:20 }}>
              <XAxis dataKey="month" tick={{ fontSize:9 }} angle={-35} textAnchor="end" interval={0} />
              <YAxis yAxisId="left"  tick={{ fontSize:9 }} domain={['auto','auto']} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize:9 }} domain={[0,10]} />
              <Tooltip contentStyle={{ fontSize:11 }} />
              <Bar    yAxisId="left"  dataKey="employees" fill="#B2E5C8" radius={[3,3,0,0]} name={lang==='th'?'พนักงานทั้งหมด':'Total'} />
              <Line   yAxisId="right" dataKey="newJoin" stroke={G.accent} strokeDasharray="4 3" dot={{ fill:G.accent, r:3 }} strokeWidth={1.5} name={lang==='th'?'พนักงานใหม่':'New'} />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        {/* Donut chart — BU breakdown */}
        <Card title={lang==='th'?'สัดส่วนพนักงานตามแผนก':'Employees by BU'} action={lang==='th'?'ดูโครงสร้าง':'OrgChart'} onAction={() => nav('orgChart')}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ position:'relative', width:110, height:110, flexShrink:0 }}>
              <PieChart width={110} height={110}>
                <Pie data={buData} cx={55} cy={55} innerRadius={36} outerRadius={52} dataKey="value" strokeWidth={1} stroke="#fff">
                  {buData.map((_, i) => <Cell key={i} fill={BU_COLORS[i % BU_COLORS.length]} />)}
                </Pie>
              </PieChart>
              <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:500, color:'#1a2e1a' }}>{fmt(empTotal)}</div>
                <div style={{ fontSize:9, color:'#7A9E8A' }}>{lang==='th'?'ทั้งหมด':'Total'}</div>
              </div>
            </div>
            <div style={{ flex:1 }}>
              {buData.map((d, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); if(nav) nav('staffList',{bu:d.name}); else openDrill(`bu:${d.name}`) }}
                  style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#6B9E84', marginBottom:5, cursor:'pointer', padding:'2px 4px', borderRadius:4, transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#E6F9F0'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{ width:10, height:10, borderRadius:2, background:BU_COLORS[i%BU_COLORS.length], flexShrink:0 }}/>
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                  <span style={{ marginLeft:'auto', fontWeight:500, color:'#1a2e1a' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Welcome panel + quick actions */}
        <div style={{ background:'linear-gradient(140deg,#E6F9F0 0%,#CCEFDD 100%)', borderRadius:12, border:`0.5px solid #B2E0C8`, padding:15 }}>
          <div style={{ fontSize:12, color:'#00875A', marginBottom:3 }}>{lang==='th'?'สวัสดีตอนเข้า':'Good morning,'}</div>
          <div style={{ fontSize:16, fontWeight:500, color:G.darker }}>{displayName}</div>
          <div style={{ fontSize:11, color:'#00875A', marginBottom:13 }}>{roleLabel}</div>

          {/* Quick actions */}
          {[
            { icon:UserPlus, iconStyle:{background:G.light,color:G.primary}, title:lang==='th'?'เพิ่มพนักงาน':'Add Employee', sub:lang==='th'?'บันทึกข้อมูลพนักงานใหม่':'Register new employee', page:'employees', badge:null },
            { icon:CalendarX, iconStyle:{background:'#E3F2FD',color:'#1565C0'}, title:lang==='th'?'อนุมัติลา':'Approve Leave', sub:lang==='th'?'ตรวจสอบคำขอลา':'Review leave requests', page:'leave', badge: leaveCount || null },
            { icon:TrendingUp, iconStyle:{background:'#FCE4EC',color:'#C62828'}, title:lang==='th'?'ออกรายงาน':'Reports', sub:lang==='th'?'สร้างรายงานวิเคราะห์':'Generate analytics', page:'reports', badge:null },
          ].map((qa, i) => (
            <div key={i} onClick={() => nav(qa.page)}
              style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,.75)', borderRadius:8, padding:'9px 11px', marginBottom: i<2 ? 8 : 0, cursor:'pointer', border:`0.5px solid rgba(0,166,81,.2)` }}
              onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,.95)'}
              onMouseOut={e  => e.currentTarget.style.background='rgba(255,255,255,.75)'}
            >
              <div style={{ width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, ...qa.iconStyle }}>
                <qa.icon style={{ width:16, height:16 }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:500, color:G.darker }}>{qa.title}</div>
                <div style={{ fontSize:10, color:'#5A8A6A' }}>{qa.sub}</div>
              </div>
              {qa.badge
                ? <span style={{ background:'#E84040', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:500 }}>{qa.badge}</span>
                : <ChevronRight style={{ width:14, height:14, color:G.primary }} />
              }
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:13 }}>

        {/* Recent leave requests */}
        <Card title={lang==='th'?'คำขอลางานล่าสุด':'Recent Leave Requests'} action={lang==='th'?'ดูทั้งหมด':'View All'} onAction={() => openDrill('leave')}>
          {/* Header row */}
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 80px', gap:8, fontSize:11, color:'#8ABFA3', borderBottom:'0.5px solid #D8EDE3', paddingBottom:7, marginBottom:7 }}>
            <span>{lang==='th'?'ชื่อพนักงาน':'Employee'}</span>
            <span>{lang==='th'?'ประเภทการลา':'Type'}</span>
            <span>{lang==='th'?'วันที่ลา':'Date'}</span>
            <span>{lang==='th'?'สถานะ':'Status'}</span>
          </div>
          {recentLeave.length === 0 ? (
            <p style={{ fontSize:12, color:'#A0B8A8', textAlign:'center', padding:'16px 0' }}>
              {lang==='th'?'ไม่มีคำขอลา':'No leave requests'}
            </p>
          ) : recentLeave.map((r) => {
            const emp = r.hr_employees
            const name = lang==='th'
              ? `${emp?.first_name_th||''} ${emp?.last_name_th||''}`.trim()
              : `${emp?.first_name_en||''} ${emp?.last_name_en||''}`.trim()
            const leaveType = lang==='th' ? r.hr_leave_types?.name_th : r.hr_leave_types?.name_en
            const pill = STATUS_PILL[r.status] || STATUS_PILL.pending
            return (
              <div key={r.id} style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 80px', gap:8, alignItems:'center', padding:'7px 0', borderBottom:'0.5px solid #F0F7F3' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Av name={name || '?'} />
                  <span style={{ fontSize:12, color:'#1a2e1a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{name || '-'}</span>
                </div>
                <span style={{ fontSize:12, color:'#7A9E8A' }}>{leaveType || '-'}</span>
                <span style={{ fontSize:12, color:'#7A9E8A' }}>{r.start_date || '-'}</span>
                <span style={{ borderRadius:20, padding:'3px 9px', fontSize:11, fontWeight:500, whiteSpace:'nowrap', background:pill.bg, color:pill.color }}>
                  {pill.label}
                </span>
              </div>
            )
          })}

        </Card>

        {/* Announcements */}
        <Card title={lang==='th'?'ประกาศภายใน':'Announcements'} action={lang==='th'?'ดูทั้งหมด':'View All'} onAction={() => openDrill('announce')}>
          {announcements.length === 0 ? (
            <p style={{ fontSize:12, color:'#A0B8A8', textAlign:'center', padding:'16px 0' }}>
              {lang==='th'?'ไม่มีประกาศ':'No announcements'}
            </p>
          ) : null}
          {announcements.map((a, i) => {
            const ic = annIcons[a._icon ?? (i % 3)]
            const IcComp = ic.icon
            const title = lang==='th' ? (a.title_th || a.title_en) : (a.title_en || a.title_th)
            const sub   = lang==='th' ? (a.body_th  || '')         : (a.body_en  || a.body_th || '')
            const date  = a.created_at ? new Date(a.created_at).toLocaleDateString(lang==='th'?'th-TH':'en-US',{day:'numeric',month:'short'}) : ''
            return (
              <div key={a.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom: i<2 ? '0.5px solid #F0F7F3' : 'none' }}>
                <div style={{ width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:ic.bg, color:ic.color }}>
                  <IcComp style={{ width:17, height:17 }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1a2e1a', lineHeight:1.4 }}>{title}</div>
                  <div style={{ fontSize:11, color:'#7A9E8A', marginTop:2 }}>{sub}</div>
                </div>
                <div style={{ fontSize:11, color:'#A0B8A8', whiteSpace:'nowrap' }}>{date}</div>
              </div>
            )
          })}
        </Card>

        {/* Upcoming training */}
        <Card title={lang==='th'?'กิจกรรม / อบรมที่กำลังจะถึง':'Upcoming Training'} action={lang==='th'?'ดูทั้งหมด':'View All'} onAction={() => openDrill('training')}>
          {upcomingTraining.length === 0 ? (
            <p style={{ fontSize:12, color:'#A0B8A8', textAlign:'center', padding:'16px 0' }}>
              {lang==='th'?'ไม่มีกิจกรรม / อบรม':'No upcoming training'}
            </p>
          ) : null}
          {upcomingTraining.map((t, i) => {
            const d = t.start_date ? new Date(t.start_date) : new Date()
            const dd = d.getDate()
            const mm = lang==='th' ? MONTHS_TH[d.getMonth()] : MONTHS_EN[d.getMonth()].slice(0,3)
            const isReg = t.status === 'registering'
            return (
              <div key={t.id} style={{ display:'flex', gap:10, padding:'7px 0', borderBottom: i<2 ? '0.5px solid #F0F7F3' : 'none', alignItems:'flex-start' }}>
                <div style={{ width:36, textAlign:'center', flexShrink:0, background:G.light, borderRadius:6, padding:'4px 2px' }}>
                  <div style={{ fontSize:15, fontWeight:500, color:G.primary, lineHeight:1 }}>{dd}</div>
                  <div style={{ fontSize:9, color:'#00875A', textTransform:'uppercase' }}>{mm}</div>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:'#1a2e1a', lineHeight:1.3 }}>{t.course_name}</div>
                  <div style={{ fontSize:11, color:'#7A9E8A', marginTop:2 }}>{t.notes || `${t.participants_count||0}/${t.hours||0} คน`}</div>
                  <button style={{
                    fontSize:10, padding:'3px 10px', borderRadius:20, border:'none', cursor:'pointer', marginTop:4, whiteSpace:'nowrap',
                    background: isReg ? G.primary : G.light,
                    color:      isReg ? '#fff'      : G.dark,
                    ...(isReg ? {} : { border:`0.5px solid ${G.light2}` })
                  }}>
                    {isReg
                      ? (lang==='th' ? `ลงทะเบียน ${t.participants_count||0}/${t.hours||40}` : `Register ${t.participants_count||0}/${t.hours||40}`)
                      : (lang==='th' ? `ลงทะเบียนแล้ว ${t.participants_count||0}/${t.hours||40}` : `Registered ${t.participants_count||0}/${t.hours||40}`)
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </Card>
      </div>

      {/* Footer */}
      <div style={{ textAlign:'center', fontSize:11, color:'#A0B8A8', marginTop:18, paddingTop:12, borderTop:'0.5px solid #D8EDE3' }}>
        © {new Date().getFullYear()} efin HR Management System — Online Asset Co., Ltd.
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* DrillDown Panel */}
      {drillDown && (
        <DrillDownPanel
          title={drillDown.title}
          rows={drillDown.rows}
          columns={drillDown.columns}
          onClose={() => setDrillDown(null)}
          onNavigate={nav}
          navPage={drillDown.navPage}
          lang={lang}
        />
      )}
    </div>
  )
}

