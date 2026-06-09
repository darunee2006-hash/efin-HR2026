import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  FileText, Plus, Search, Download, Eye, Edit3, Check,
  ChevronRight, Sparkles, Save, Send, X, Star,
  Users, Building2, BarChart3, Clock, AlertTriangle, CheckCircle,
  Filter, ChevronDown, TrendingUp
} from 'lucide-react'

const G = { primary:'#00A651', dark:'#007A3D', light:'#E6F9F0', light2:'#CCF0DE' }

const STATUS_CFG = {
  active:          { bg:'#E6F9F0', color:'#00875A', label:'Active', dot:'#00875A' },
  approved:        { bg:'#E8F5E9', color:'#2E7D32', label:'อนุมัติแล้ว', dot:'#2E7D32' },
  draft:           { bg:'#F5F5F5', color:'#616161', label:'Draft', dot:'#9E9E9E' },
  pending_hr:      { bg:'#FFF9C4', color:'#F57F17', label:'รอ HR ตรวจสอบ', dot:'#FFA000' },
  pending_approval:{ bg:'#E3F2FD', color:'#1565C0', label:'รออนุมัติ', dot:'#1565C0' },
  rejected:        { bg:'#FEECEC', color:'#C62828', label:'Rejected', dot:'#E53935' },
  archived:        { bg:'#ECEFF1', color:'#546E7A', label:'Archived', dot:'#78909C' },
}

const CORE_VALUES = [
  { key:'E', label:'Empathy', desc:'เข้าใจและใส่ใจผู้อื่น' },
  { key:'F', label:'Focus', desc:'มุ่งมั่นตั้งใจกับเป้าหมาย' },
  { key:'I', label:'Innovative', desc:'คิดสร้างสรรค์ริเริ่มสิ่งใหม่' },
  { key:'N', label:'Noble', desc:'มีคุณธรรมซื่อสัตย์' },
  { key:'S', label:'Synergy', desc:'ร่วมมือสร้างพลังทีม' },
]

function StatusDot({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.draft
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full" style={{background:s.bg,color:s.color}}>
    <span className="w-1.5 h-1.5 rounded-full" style={{background:s.dot}}/>
    {s.label}
  </span>
}

// ─── JD Viewer Modal ──────────────────────────────────────────
function JDViewModal({ jdId, empName, onClose }) {
  const [jd, setJd] = useState(null)
  const [resp, setResp] = useState([])
  const [kpis, setKpis] = useState([])
  const [comp, setComp] = useState([])
  const [ojt, setOjt] = useState([])
  const [rel, setRel] = useState([])
  const [qual, setQual] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    const load = async () => {
      const [jdR,rR,kR,cR,oR,relR,qR] = await Promise.all([
        supabase.from('hr_job_descriptions').select('*').eq('id',jdId).single(),
        supabase.from('hr_jd_responsibilities').select('*').eq('jd_id',jdId).order('order_no'),
        supabase.from('hr_jd_kpis').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_competencies').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_ojt').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_relationships').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_qualifications').select('*').eq('jd_id',jdId).maybeSingle(),
      ])
      setJd(jdR.data); setResp(rR.data||[]); setKpis(kR.data||[])
      setComp(cR.data||[]); setOjt(oR.data||[]); setRel(relR.data||[]); setQual(qR.data)
      setLoading(false)
    }
    load()
  }, [jdId])

  const TABS = [{key:'overview',label:'ภาพรวม'},{key:'resp',label:'ความรับผิดชอบ'},{key:'kpi',label:'KPI'},{key:'comp',label:'Competency'},{key:'rel',label:'Working Rel.'},{key:'ojt',label:'OJT'},{key:'corevalues',label:'Core Values'}]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3" style={{background:'linear-gradient(135deg,#E6F9F0,#f0faf5)'}}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{background:G.primary}}>
            {jd?.grade||'G?'}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{jd?.position_th||empName}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-sm text-gray-500">{empName}</span>
              {jd && <StatusDot status={jd.status}/>}
              {jd?.effective_date && <span className="text-xs text-gray-400">บังคับใช้: {new Date(jd.effective_date).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})}</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/70 rounded-xl"><X className="w-5 h-5 text-gray-500"/></button>
        </div>

        <div className="flex gap-0 border-b border-gray-100 overflow-x-auto px-4 bg-gray-50/50">
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition ${tab===t.key?'border-green-500 text-green-700 bg-white':'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor:G.primary}}/></div> : (
            <>
              {tab==='overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    {[['ฝ่าย/สังกัด',jd?.department],['รายงานต่อ',jd?.reports_to],['สถานที่',jd?.work_location||'สำนักงานใหญ่']].map(([k,v])=>(
                      <div key={k} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 mb-1">{k}</p>
                        <p className="text-sm font-medium text-gray-800">{v||'-'}</p>
                      </div>
                    ))}
                  </div>
                  {jd?.job_summary && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-green-800 mb-2">Job Summary</h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{jd.job_summary}</p>
                    </div>
                  )}
                  {qual && (
                    <div className="border border-gray-100 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-gray-800 mb-3">คุณสมบัติผู้ดำรงตำแหน่ง</h4>
                      {[['วุฒิการศึกษา',qual.education],['ประสบการณ์',qual.experience],['เครื่องมือ/ระบบ',qual.tools_systems]].filter(([,v])=>v).map(([k,v])=>(
                        <div key={k} className="mb-2"><span className="text-xs font-semibold text-gray-500">{k}: </span><span className="text-sm text-gray-700">{v}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {tab==='resp' && (
                <div className="space-y-3">
                  {resp.map((r,i)=>(
                    <div key={i} className="flex gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{background:G.primary}}>{r.order_no}</span>
                      <div>
                        <p className="text-sm text-gray-800">{r.responsibility_text}</p>
                        {r.expected_outcome && <p className="text-xs text-gray-400 mt-1">ผลที่คาดหวัง: {r.expected_outcome}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab==='kpi' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50">
                      {['KPI/Metric','สูตร/หน่วย','ค่าเป้าหมาย','ความถี่','เจ้าของ'].map(h=><th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {kpis.map((k,i)=>(
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{k.kpi_metric}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{k.formula_unit}</td>
                          <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">{k.target_value}</span></td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{k.reporting_frequency}</td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{k.metric_owner}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab==='comp' && (
                <div className="space-y-4">
                  {['knowledge','skill','mental'].map(type=>{
                    const items = comp.filter(c=>c.competency_type===type)
                    if(!items.length) return null
                    return (
                      <div key={type}>
                        <h5 className="text-xs font-bold uppercase text-gray-400 mb-2">{{knowledge:'Knowledge',skill:'Skills',mental:'Mental Skills'}[type]}</h5>
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50"><th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-400">Competency</th><th className="px-3 py-1.5 text-center text-xs font-semibold text-gray-400">Core/Nice</th><th className="px-3 py-1.5 text-center text-xs font-semibold text-gray-400">Level</th><th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-400">ตัวชี้วัด</th></tr></thead>
                          <tbody className="divide-y divide-gray-50">
                            {items.map((c,i)=>(
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-800">{c.competency_name}</td>
                                <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.core_or_nice==='core'?'bg-green-50 text-green-700':'bg-gray-100 text-gray-500'}`}>{c.core_or_nice==='core'?'Core':'Nice'}</span></td>
                                <td className="px-3 py-2 text-center"><span className="text-xs font-bold text-blue-600">Lv.{c.proficiency_level}</span></td>
                                <td className="px-3 py-2 text-xs text-gray-500">{c.behavior_indicator}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )}
              {tab==='rel' && (
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">{['หน่วยงาน','ภายใน/ภายนอก','งานที่ประสาน','ความถี่'].map(h=><th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {rel.map((r,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{r.org_team}</td>
                        <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${r.internal_external==='internal'?'bg-blue-50 text-blue-700':'bg-orange-50 text-orange-700'}`}>{r.internal_external==='internal'?'ภายใน':'ภายนอก'}</span></td>
                        <td className="px-3 py-2 text-sm text-gray-600">{r.coordination_work}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">{r.frequency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab==='ojt' && (
                <div className="space-y-3">
                  {ojt.map((o,i)=>(
                    <div key={i} className="flex gap-3 p-3 border border-gray-100 rounded-xl">
                      <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 flex-shrink-0">{i+1}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{o.ojt_topic}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{o.description}</p>
                        {o.required_timeline && <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full mt-1 inline-block">{o.required_timeline}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab==='corevalues' && (
                <div className="space-y-3">
                  {CORE_VALUES.map(cv=>(
                    <div key={cv.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base flex-shrink-0" style={{background:G.primary}}>{cv.key}</div>
                      <div><p className="text-sm font-bold text-gray-900">{cv.label}</p><p className="text-xs text-gray-500">{cv.desc}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function JDManagement({ lang, onNavigate, navContext = {} }) {
  const { role } = useAuth()
  const [jdList, setJdList] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBU, setFilterBU] = useState('all')
  const [viewMode, setViewMode] = useState('dashboard') // dashboard | list
  const [expandedBU, setExpandedBU] = useState({})
  const [viewingJD, setViewingJD] = useState(null) // {jdId, empName}
  const [toast, setToast] = useState('')

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const load = async () => {
    setLoading(true)
    const [jdRes, empRes] = await Promise.all([
      supabase.from('hr_job_descriptions')
        .select('id,employee_id,document_code,version,status,position_th,position_en,grade,effective_date,department')
        .order('created_at',{ascending:false}),
      supabase.from('hr_employees')
        .select('id,employee_code,prefix_th,first_name_th,last_name_th,position_th,bu,level,department_name_th,company_entity')
        .eq('status','active').eq('company_entity','ONL').order('first_name_th'),
    ])
    setJdList(jdRes.data||[])
    setEmployees(empRes.data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  // Map employee_id → JD
  const jdByEmpId = useMemo(() => {
    const m = {}
    jdList.forEach(j => { m[j.employee_id] = j })
    return m
  }, [jdList])

  // Group employees by BU
  const buGroups = useMemo(() => {
    const m = {}
    employees.forEach(e => {
      const bu = e.bu || 'ไม่ระบุ BU'
      if (!m[bu]) m[bu] = []
      m[bu].push(e)
    })
    return Object.entries(m).sort((a,b) => b[1].length - a[1].length)
  }, [employees])

  const buList = useMemo(() => buGroups.map(([bu])=>bu), [buGroups])

  // Stats per BU
  const buStats = useMemo(() => {
    const s = {}
    buGroups.forEach(([bu, emps]) => {
      const withJD = emps.filter(e => jdByEmpId[e.id])
      const active = emps.filter(e => jdByEmpId[e.id]?.status === 'active')
      s[bu] = {
        total: emps.length,
        withJD: withJD.length,
        active: active.length,
        pct: Math.round((withJD.length / emps.length) * 100),
      }
    })
    return s
  }, [buGroups, jdByEmpId])

  // Filtered employees for search
  const filteredEmps = useMemo(() => {
    let list = employees
    if (filterBU !== 'all') list = list.filter(e => e.bu === filterBU)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        `${e.first_name_th} ${e.last_name_th}`.toLowerCase().includes(q) ||
        (e.employee_code||'').includes(q) ||
        (e.position_th||'').toLowerCase().includes(q)
      )
    }
    return list
  }, [employees, filterBU, search])

  // Overall stats
  const totalStats = useMemo(() => {
    const withJD = employees.filter(e => jdByEmpId[e.id]).length
    const active = employees.filter(e => jdByEmpId[e.id]?.status === 'active').length
    const noJD = employees.length - withJD
    return { total: employees.length, withJD, active, noJD, pct: Math.round((withJD/Math.max(1,employees.length))*100) }
  }, [employees, jdByEmpId])

  const toggleBU = bu => setExpandedBU(p => ({...p,[bu]:!p[bu]}))

  const BU_COLORS = ['#00875A','#1565C0','#6A1B9A','#E65100','#00838F','#558B2F','#AD1457','#4527A0']

  return (
    <div className="min-h-screen p-6" style={{background:'#F8FAFB'}}>
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2" style={{background:G.primary}}><Check className="w-4 h-4"/>{toast}</div>}

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:G.primary}}><FileText className="w-4 h-4 text-white"/></div>
            <h1 className="text-xl font-bold text-gray-900">JD Management Dashboard</h1>
          </div>
          <p className="text-sm text-gray-400">ภาพรวม Job Description รายบุคคล · Online Asset Co., Ltd.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden">
            {[{k:'dashboard',label:'Dashboard',icon:BarChart3},{k:'list',label:'รายชื่อ',icon:Users}].map(m=>(
              <button key={m.k} onClick={()=>setViewMode(m.k)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition ${viewMode===m.k?'text-white':'text-gray-500 hover:bg-gray-50'}`}
                style={viewMode===m.k?{background:G.primary}:{}}>
                <m.icon className="w-4 h-4"/>{m.label}
              </button>
            ))}
          </div>
          {(role==='admin'||role==='superuser') && (
            <button onClick={()=>onNavigate&&onNavigate('jdBuilder')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl" style={{background:G.primary}}>
              <Plus className="w-4 h-4"/>สร้าง JD
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {label:'พนักงานทั้งหมด',value:totalStats.total,unit:'คน',icon:Users,color:G.primary,bg:G.light},
          {label:'มี JD แล้ว',value:totalStats.withJD,unit:`คน (${totalStats.pct}%)`,icon:FileText,color:'#1565C0',bg:'#E3F2FD'},
          {label:'JD Active',value:totalStats.active,unit:'คน',icon:CheckCircle,color:'#00875A',bg:'#E8F5E9'},
          {label:'ยังไม่มี JD',value:totalStats.noJD,unit:'คน',icon:AlertTriangle,color:'#E65100',bg:'#FFF3E0'},
        ].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:s.bg}}>
                <s.icon className="w-5 h-5" style={{color:s.color}}/>
              </div>
              <span className="text-xs text-gray-400 font-medium">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.unit}</span></div>
            {i===1 && <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{width:`${totalStats.pct}%`,background:'#1565C0'}}/>
            </div>}
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3 flex-wrap mb-5">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน, รหัส, ตำแหน่ง..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-400"/>
        </div>
        <select value={filterBU} onChange={e=>setFilterBU(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white">
          <option value="all">ทุก BU ({employees.length} คน)</option>
          {buList.map(bu=><option key={bu} value={bu}>{bu} ({buStats[bu]?.total||0} คน)</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{borderColor:G.primary}}/></div>
      ) : viewMode === 'dashboard' ? (
        /* ─── DASHBOARD VIEW ─── */
        <div className="space-y-4">
          {(filterBU === 'all' ? buGroups : buGroups.filter(([bu])=>bu===filterBU)).map(([bu, emps], buIdx) => {
            const stats = buStats[bu]
            const isOpen = expandedBU[bu] !== false // default open
            const color = BU_COLORS[buIdx % BU_COLORS.length]
            const filteredBUEmps = search ? emps.filter(e => `${e.first_name_th} ${e.last_name_th}`.toLowerCase().includes(search.toLowerCase()) || (e.employee_code||'').includes(search)) : emps

            return (
              <div key={bu} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* BU Header */}
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition" onClick={()=>toggleBU(bu)}>
                  <div className="w-3 h-10 rounded-full flex-shrink-0" style={{background:color}}/>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-gray-900">{bu}</span>
                      <span className="text-sm text-gray-400">{stats.total} คน</span>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden" style={{maxWidth:200}}>
                        <div className="h-full rounded-full transition-all" style={{width:`${stats.pct}%`,background:color}}/>
                      </div>
                      <span className="text-xs font-medium" style={{color}}>{stats.pct}% มี JD</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{stats.withJD}</div>
                      <div className="text-[10px] text-gray-400">มี JD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold" style={{color:'#E65100'}}>{stats.total - stats.withJD}</div>
                      <div className="text-[10px] text-gray-400">ยังไม่มี</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{stats.active}</div>
                      <div className="text-[10px] text-gray-400">Active</div>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
                  </div>
                </div>

                {/* Employee list */}
                {isOpen && (
                  <div className="border-t border-gray-50">
                    <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase">
                      <span className="col-span-4">ชื่อพนักงาน</span>
                      <span className="col-span-3">ตำแหน่ง</span>
                      <span className="col-span-2">Grade</span>
                      <span className="col-span-2">สถานะ JD</span>
                      <span className="col-span-1 text-right">Action</span>
                    </div>
                    {filteredBUEmps.map((emp, i) => {
                      const jd = jdByEmpId[emp.id]
                      return (
                        <div key={emp.id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-gray-50 hover:bg-gray-50 transition ${i%2===1?'bg-gray-50/30':''}`}>
                          <div className="col-span-4 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background:color}}>
                              {(emp.first_name_th||'?')[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{emp.prefix_th}{emp.first_name_th} {emp.last_name_th}</p>
                              <p className="text-[10px] text-gray-400">{emp.employee_code}</p>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <p className="text-xs text-gray-600 truncate">{emp.position_th||'-'}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs font-mono text-gray-500">{emp.level||'-'}</span>
                          </div>
                          <div className="col-span-2">
                            {jd ? <StatusDot status={jd.status}/> : (
                              <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3"/>ยังไม่มี JD
                              </span>
                            )}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {jd ? (
                              <button onClick={()=>setViewingJD({jdId:jd.id,empName:`${emp.first_name_th} ${emp.last_name_th}`})}
                                className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600 transition" title="ดู JD">
                                <Eye className="w-4 h-4"/>
                              </button>
                            ) : (role==='admin'||role==='superuser') ? (
                              <button className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-300 hover:text-purple-500 transition" title="สร้าง JD">
                                <Plus className="w-4 h-4"/>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                    {filteredBUEmps.length === 0 && (
                      <div className="py-6 text-center text-gray-400 text-sm">ไม่พบพนักงานที่ค้นหา</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        /* ─── LIST VIEW ─── */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-400 uppercase">
            <span className="col-span-3">ชื่อพนักงาน</span>
            <span className="col-span-2">ตำแหน่ง</span>
            <span className="col-span-2">BU</span>
            <span className="col-span-1">Grade</span>
            <span className="col-span-2">Document Code</span>
            <span className="col-span-1">สถานะ</span>
            <span className="col-span-1 text-right">Action</span>
          </div>
          {filteredEmps.map((emp,i) => {
            const jd = jdByEmpId[emp.id]
            return (
              <div key={emp.id} className={`grid grid-cols-12 gap-2 px-5 py-3 items-center border-b border-gray-50 hover:bg-gray-50 ${i%2===1?'bg-gray-50/30':''}`}>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{background:G.primary}}>
                    {(emp.first_name_th||'?')[0]}
                  </div>
                  <div><p className="text-xs font-medium text-gray-900">{emp.prefix_th}{emp.first_name_th} {emp.last_name_th}</p><p className="text-[10px] text-gray-400">{emp.employee_code}</p></div>
                </div>
                <div className="col-span-2 text-xs text-gray-600 truncate">{emp.position_th||'-'}</div>
                <div className="col-span-2 text-xs text-gray-500 truncate">{emp.bu||'-'}</div>
                <div className="col-span-1 text-xs font-mono text-gray-400">{emp.level}</div>
                <div className="col-span-2 text-[10px] font-mono text-gray-400">{jd?.document_code||'-'}</div>
                <div className="col-span-1">{jd ? <StatusDot status={jd.status}/> : <span className="text-[10px] text-orange-500">ไม่มี JD</span>}</div>
                <div className="col-span-1 flex justify-end">
                  {jd && <button onClick={()=>setViewingJD({jdId:jd.id,empName:`${emp.first_name_th} ${emp.last_name_th}`})}
                    className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600" title="ดู JD">
                    <Eye className="w-3.5 h-3.5"/>
                  </button>}
                </div>
              </div>
            )
          })}
          <div className="px-5 py-2.5 text-xs text-gray-400 border-t">แสดง {filteredEmps.length} คน</div>
        </div>
      )}

      {/* JD Viewer */}
      {viewingJD && <JDViewModal jdId={viewingJD.jdId} empName={viewingJD.empName} onClose={()=>setViewingJD(null)}/>}
    </div>
  )
}
