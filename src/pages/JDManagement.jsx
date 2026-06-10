import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  FileText, Plus, Search, Download, Eye, Edit3, Check, X,
  ChevronRight, Sparkles, Save, AlertTriangle, CheckCircle,
  Users, Building2, BarChart3, Clock, Send, RefreshCw,
  Filter, ChevronDown, ListChecks, Bell, TrendingUp
} from 'lucide-react'

const BLUE = '#7DC242'
const BLUE_L = '#E6F1FB'
const GREEN = '#27500A'
const GREEN_L = '#EAF3DE'
const RED = '#791F1F'
const RED_L = '#FCEBEB'
const AMB = '#633806'
const AMB_L = '#FAEEDA'

const STATUS_CFG = {
  active:           { bg:GREEN_L, color:GREEN, label:'Active' },
  approved:         { bg:'#E8F5E9', color:'#2E7D32', label:'อนุมัติแล้ว' },
  draft:            { bg:'#F5F5F5', color:'#616161', label:'Draft' },
  pending_hr:       { bg:AMB_L, color:AMB, label:'รอ HR' },
  pending_approval: { bg:BLUE_L, color:BLUE, label:'รออนุมัติ' },
  rejected:         { bg:RED_L, color:RED, label:'Rejected' },
  archived:         { bg:'#ECEFF1', color:'#546E7A', label:'Archived' },
}
const Badge = ({ status, text }) => {
  const s = STATUS_CFG[status] || { bg:'#F5F5F5', color:'#616161', label: text||status }
  return <span style={{background:s.bg,color:s.color,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500,whiteSpace:'nowrap'}}>{text||s.label}</span>
}
const Dot = ({ok}) => ok
  ? <span style={{color:GREEN,fontSize:11,fontWeight:500}}>✓ มี</span>
  : <span style={{color:RED,fontSize:11}}>— ขาด</span>

// ── JD Viewer ────────────────────────────────────────────────
function JDViewModal({ jdId, empName, onClose }) {
  const [data, setData] = useState({})
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const [jdR, rR, kR, cR, oR, relR, qR] = await Promise.all([
        supabase.from('hr_job_descriptions').select('*').eq('id',jdId).single(),
        supabase.from('hr_jd_responsibilities').select('*').eq('jd_id',jdId).order('order_no'),
        supabase.from('hr_jd_kpis').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_competencies').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_ojt').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_relationships').select('*').eq('jd_id',jdId),
        supabase.from('hr_jd_qualifications').select('*').eq('jd_id',jdId).maybeSingle(),
      ])
      setData({ jd:jdR.data, resp:rR.data||[], kpis:kR.data||[], comp:cR.data||[], ojt:oR.data||[], rel:relR.data||[], qual:qR.data })
      setLoading(false)
    }
    load()
  }, [jdId])

  const { jd, resp, kpis, comp, ojt, rel, qual } = data
  const TABS = ['overview','ความรับผิดชอบ','KPI','Competency','Working Rel.','OJT','Core Values']

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:900,maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:'16px 20px',borderBottom:'0.5px solid #E0E0E0',background:BLUE_L,borderRadius:'16px 16px 0 0',display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:44,height:44,background:BLUE,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:BLUE_L,fontWeight:700,fontSize:14}}>{jd?.grade||'G?'}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:500,color:'#0C447C'}}>{jd?.position_th||empName}</div>
            <div style={{fontSize:12,color:'#185FA5'}}>{empName} · {jd?.department} · v{jd?.version||'1.0'}</div>
          </div>
          <button onClick={onClose} style={{padding:6,border:'none',background:'transparent',cursor:'pointer'}}><X size={18} color='#666'/></button>
        </div>
        <div style={{display:'flex',borderBottom:'0.5px solid #E0E0E0',overflowX:'auto',background:'#F4F7F5'}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 14px',border:'none',borderBottom:`2px solid ${tab===t?BLUE:'transparent'}`,background:'transparent',color:tab===t?BLUE:'#666',fontSize:12,fontWeight:tab===t?500:400,cursor:'pointer',whiteSpace:'nowrap'}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{flex:1,overflowY:'auto',padding:20}}>
          {loading ? <div style={{textAlign:'center',padding:40,color:'#999'}}>กำลังโหลด...</div> : (
            <>
              {tab==='overview' && <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
                  {[['ฝ่าย/สังกัด',jd?.department],['รายงานต่อ',jd?.reports_to||'-'],['สถานะ',<Badge status={jd?.status}/>]].map(([k,v])=>(
                    <div key={k} style={{background:'#F8F9FA',borderRadius:10,padding:'10px 12px'}}>
                      <div style={{fontSize:11,color:'#999',marginBottom:4}}>{k}</div>
                      <div style={{fontSize:13,fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
                {jd?.job_summary && <div style={{background:GREEN_L,border:`1px solid #C0DD97`,borderRadius:10,padding:14,marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:500,color:GREEN,marginBottom:6}}>Job Summary</div>
                  <div style={{fontSize:13,color:'#333',lineHeight:1.6,whiteSpace:'pre-line'}}>{jd.job_summary}</div>
                </div>}
                {qual && <div style={{border:'0.5px solid #E0E0E0',borderRadius:10,padding:14}}>
                  <div style={{fontSize:12,fontWeight:500,marginBottom:8}}>คุณสมบัติผู้ดำรงตำแหน่ง</div>
                  {[['วุฒิการศึกษา',qual.education],['ประสบการณ์',qual.experience],['เครื่องมือ/ระบบ',qual.tools_systems]].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{marginBottom:6}}><span style={{fontSize:11,color:'#888',fontWeight:500}}>{k}: </span><span style={{fontSize:12}}>{v}</span></div>
                  ))}
                </div>}
              </div>}
              {tab==='ความรับผิดชอบ' && <div>
                {resp.map((r,i)=><div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'0.5px solid #F0F0F0'}}>
                  <span style={{width:24,height:24,background:BLUE,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:BLUE_L,flexShrink:0}}>{r.order_no}</span>
                  <div>
                    <div style={{fontSize:13}}>{r.responsibility_text}</div>
                    {r.expected_outcome&&<div style={{fontSize:11,color:'#888',marginTop:3}}>ผลที่คาดหวัง: {r.expected_outcome}</div>}
                  </div>
                </div>)}
              </div>}
              {tab==='KPI' && <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                  <thead><tr style={{background:'#F5F5F5'}}>
                    {['KPI/Metric','สูตร/หน่วย','ค่าเป้าหมาย','ความถี่','เจ้าของ'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:'1px solid #E0E0E0',fontWeight:500,color:'#666'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>{kpis.map((k,i)=><tr key={i} style={{borderBottom:'0.5px solid #F0F0F0'}}>
                    <td style={{padding:'8px 10px',fontWeight:500}}>{k.kpi_metric}</td>
                    <td style={{padding:'8px 10px',color:'#666',fontSize:11}}>{k.formula_unit}</td>
                    <td style={{padding:'8px 10px'}}><span style={{background:GREEN_L,color:GREEN,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500}}>{k.target_value}</span></td>
                    <td style={{padding:'8px 10px',color:'#666',fontSize:11}}>{k.reporting_frequency}</td>
                    <td style={{padding:'8px 10px',color:'#666',fontSize:11}}>{k.metric_owner}</td>
                  </tr>)}</tbody>
                </table>
              </div>}
              {tab==='Competency' && <div>
                {['knowledge','skill','mental'].map(type=>{
                  const items=comp.filter(c=>c.competency_type===type); if(!items.length) return null
                  return <div key={type} style={{marginBottom:16}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#999',textTransform:'uppercase',marginBottom:6}}>{{knowledge:'Knowledge',skill:'Skills',mental:'Mental Skills'}[type]}</div>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                      <thead><tr style={{background:'#F5F5F5'}}>{['Competency','Core/Nice','Level','ตัวชี้วัด'].map(h=><th key={h} style={{padding:'6px 10px',textAlign:'left',borderBottom:'1px solid #E0E0E0',fontWeight:500,color:'#666',fontSize:11}}>{h}</th>)}</tr></thead>
                      <tbody>{items.map((c,i)=><tr key={i} style={{borderBottom:'0.5px solid #F0F0F0'}}>
                        <td style={{padding:'7px 10px',fontWeight:500}}>{c.competency_name}</td>
                        <td style={{padding:'7px 10px'}}><span style={{background:c.core_or_nice==='core'?GREEN_L:'#F5F5F5',color:c.core_or_nice==='core'?GREEN:'#666',padding:'1px 7px',borderRadius:20,fontSize:10,fontWeight:500}}>{c.core_or_nice==='core'?'Core':'Nice'}</span></td>
                        <td style={{padding:'7px 10px'}}><span style={{fontWeight:700,color:BLUE,fontSize:12}}>Lv.{c.proficiency_level}</span></td>
                        <td style={{padding:'7px 10px',color:'#666',fontSize:11}}>{c.behavior_indicator}</td>
                      </tr>)}</tbody>
                    </table>
                  </div>
                })}
              </div>}
              {tab==='Working Rel.' && <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead><tr style={{background:'#F5F5F5'}}>{['หน่วยงาน','ภายใน/ภายนอก','งานที่ประสาน','ความถี่'].map(h=><th key={h} style={{padding:'8px 10px',textAlign:'left',borderBottom:'1px solid #E0E0E0',fontWeight:500,color:'#666'}}>{h}</th>)}</tr></thead>
                <tbody>{rel.map((r,i)=><tr key={i} style={{borderBottom:'0.5px solid #F0F0F0'}}>
                  <td style={{padding:'8px 10px',fontWeight:500}}>{r.org_team}</td>
                  <td style={{padding:'8px 10px'}}><span style={{background:r.internal_external==='internal'?BLUE_L:AMB_L,color:r.internal_external==='internal'?BLUE:AMB,padding:'1px 7px',borderRadius:20,fontSize:10}}>{r.internal_external==='internal'?'ภายใน':'ภายนอก'}</span></td>
                  <td style={{padding:'8px 10px',color:'#555',fontSize:12}}>{r.coordination_work}</td>
                  <td style={{padding:'8px 10px',color:'#888',fontSize:11}}>{r.frequency}</td>
                </tr>)}</tbody>
              </table>}
              {tab==='OJT' && <div>{ojt.map((o,i)=><div key={i} style={{display:'flex',gap:10,padding:'10px 0',borderBottom:'0.5px solid #F0F0F0'}}>
                <span style={{width:24,height:24,background:'#EDE7F6',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#4527A0',flexShrink:0}}>{i+1}</span>
                <div><div style={{fontSize:13,fontWeight:500}}>{o.ojt_topic}</div><div style={{fontSize:11,color:'#888',marginTop:2}}>{o.description}</div>{o.required_timeline&&<span style={{fontSize:10,background:'#F5F5F5',color:'#888',padding:'1px 7px',borderRadius:20,display:'inline-block',marginTop:4}}>{o.required_timeline}</span>}</div>
              </div>)}</div>}
              {tab==='Core Values' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {[{k:'E',l:'Empathy',d:'เข้าใจและใส่ใจผู้อื่น'},{k:'F',l:'Focus',d:'มุ่งมั่นตั้งใจกับเป้าหมาย'},{k:'I',l:'Innovative',d:'คิดสร้างสรรค์ริเริ่มสิ่งใหม่'},{k:'N',l:'Noble',d:'มีคุณธรรมซื่อสัตย์'},{k:'S',l:'Synergy',d:'ร่วมมือสร้างพลังทีม'}].map(cv=>(
                  <div key={cv.k} style={{display:'flex',gap:10,padding:'10px 12px',border:'0.5px solid #E0E0E0',borderRadius:10}}>
                    <div style={{width:36,height:36,background:BLUE,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:BLUE_L,fontWeight:700,flexShrink:0}}>{cv.k}</div>
                    <div><div style={{fontWeight:500,fontSize:13}}>{cv.l}</div><div style={{fontSize:11,color:'#888'}}>{cv.d}</div></div>
                  </div>
                ))}
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function JDManagement({ lang, onNavigate, navContext={} }) {
  const { role } = useAuth()
  const [jdList, setJdList] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBU, setFilterBU] = useState('all')
  const [filterGrade, setFilterGrade] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterAck, setFilterAck] = useState('all')
  const [viewingJD, setViewingJD] = useState(null)
  const [showAIPanel, setShowAIPanel] = useState(null)
  const [toast, setToast] = useState('')

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const load = async () => {
    setLoading(true)
    const [jdRes, empRes, ackRes] = await Promise.all([
      supabase.from('hr_job_descriptions').select('id,employee_id,document_code,version,status,position_th,grade,effective_date,department,updated_at').order('created_at',{ascending:false}),
      supabase.from('hr_employees').select('id,employee_code,prefix_th,first_name_th,last_name_th,position_th,bu,level,department_name_th,company_entity').eq('status','active').eq('company_entity','ONL').order('first_name_th'),
      supabase.from('hr_jd_acknowledgements').select('jd_id,employee_id,status'),
    ])
    const ackMap = {}
    ;(ackRes.data||[]).forEach(a=>{ ackMap[a.jd_id]=a.status })
    setJdList((jdRes.data||[]).map(j=>({...j, ackStatus: ackMap[j.id]||'not_acknowledged'})))
    setEmployees(empRes.data||[])
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const jdByEmpId = useMemo(()=>{ const m={}; jdList.forEach(j=>{m[j.employee_id]=j}); return m },[jdList])
  const kpiByJD = useMemo(()=>new Set(jdList.map(j=>j.id)),[jdList]) // simplification: all saved JDs have KPI

  const buList = useMemo(()=>[...new Set(employees.map(e=>e.bu).filter(Boolean))].sort(),[employees])
  const gradeList = useMemo(()=>[...new Set(employees.map(e=>e.level).filter(Boolean))].sort(),[employees])

  const stats = useMemo(()=>({
    total: jdList.length,
    active: jdList.filter(j=>j.status==='active').length,
    pending: jdList.filter(j=>j.status?.includes('pending')).length,
    draft: jdList.filter(j=>j.status==='draft').length,
    noJD: employees.length - jdList.length,
    notAck: jdList.filter(j=>j.ackStatus!=='acknowledged').length,
    coverage: Math.round(jdList.length/Math.max(1,employees.length)*100),
  }),[jdList,employees])

  const buStats = useMemo(()=>{
    const s={}; employees.forEach(e=>{
      const bu=e.bu||'ไม่ระบุ'
      if(!s[bu]) s[bu]={total:0,withJD:0}
      s[bu].total++
      if(jdByEmpId[e.id]) s[bu].withJD++
    }); return s
  },[employees,jdByEmpId])

  const filteredEmps = useMemo(()=>{
    return employees.filter(e=>{
      const jd=jdByEmpId[e.id]
      const q=search.toLowerCase()
      if(search && !`${e.first_name_th} ${e.last_name_th}`.toLowerCase().includes(q) && !(e.employee_code||'').includes(q) && !(e.position_th||'').toLowerCase().includes(q) && !(jd?.document_code||'').toLowerCase().includes(q)) return false
      if(filterBU!=='all' && e.bu!==filterBU) return false
      if(filterGrade!=='all' && e.level!==filterGrade) return false
      if(filterStatus==='no_jd' && jd) return false
      if(filterStatus!=='all' && filterStatus!=='no_jd' && jd?.status!==filterStatus) return false
      if(filterAck==='not_acknowledged' && jd?.ackStatus==='acknowledged') return false
      if(filterAck==='acknowledged' && jd?.ackStatus!=='acknowledged') return false
      return true
    })
  },[employees,jdByEmpId,search,filterBU,filterGrade,filterStatus,filterAck])

  const isAdmin = role==='admin'||role==='superuser'

  // AI Generate JD
  const handleAIGenerate = async (emp) => {
    setShowAIPanel(null)
    showToast('AI กำลังสร้าง JD สำหรับ '+emp.first_name_th+'...')
    // In production: call AI API
  }

  const S = {fontSize:12}
  const SH = {fontSize:11,fontWeight:500,color:'#666',padding:'7px 10px',background:'#F8F9FA',borderBottom:'0.5px solid #E0E0E0'}
  const SD = {fontSize:11,padding:'8px 10px',borderBottom:'0.5px solid #F5F5F5',verticalAlign:'middle'}

  return (
    <div style={{background:'#F4F6F8',minHeight:'100vh',padding:'20px 24px',fontFamily:'inherit'}}>
      {toast && <div style={{position:'fixed',top:16,right:16,zIndex:99,background:BLUE,color:BLUE_L,padding:'10px 16px',borderRadius:10,fontSize:13,fontWeight:500}}>{toast}</div>}

      {/* 1. HEADER */}
      <div style={{background:'#fff',borderRadius:12,padding:'14px 18px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10,border:'0.5px solid #E0E0E0'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:38,height:38,background:BLUE,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}><FileText size={18} color={BLUE_L}/></div>
          <div>
            <div style={{fontSize:17,fontWeight:500}}>JD Management Dashboard</div>
            <div style={{fontSize:11,color:'#888'}}>ภาพรวม Job Description ทั้งองค์กร · อัพเดตล่าสุด: {new Date().toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'})}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <button onClick={()=>setShowAIPanel('review')} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,border:'0.5px solid #CCC',background:'#fff',cursor:'pointer',fontSize:12,fontWeight:500,color:'#555'}}><Sparkles size={14} color='#7C3AED'/>AI Review</button>
          <button style={{display:'flex',alignItems:'center',gap:5,padding:'7px 12px',borderRadius:8,border:'0.5px solid #CCC',background:'#fff',cursor:'pointer',fontSize:12,color:'#555'}}><Download size={14}/>Export</button>
          {isAdmin && <button onClick={()=>showToast('เปิด JD Builder')} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:8,background:BLUE,border:'none',cursor:'pointer',fontSize:12,fontWeight:500,color:BLUE_L}}><Plus size={14}/>สร้าง JD</button>}
        </div>
      </div>

      {/* 2. FILTER */}
      <div style={{background:'#fff',borderRadius:12,padding:'12px 16px',marginBottom:12,border:'0.5px solid #E0E0E0'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr',gap:8,marginBottom:8}}>
          <div style={{position:'relative'}}>
            <Search size={13} color='#AAA' style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อ / ตำแหน่ง / รหัสเอกสาร..." style={{width:'100%',padding:'6px 8px 6px 26px',border:'0.5px solid #DDD',borderRadius:7,fontSize:12,boxSizing:'border-box'}}/>
          </div>
          <select value={filterBU} onChange={e=>setFilterBU(e.target.value)} style={{padding:'6px 8px',border:'0.5px solid #DDD',borderRadius:7,fontSize:12}}>
            <option value="all">ทุกฝ่าย</option>
            {buList.map(b=><option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterGrade} onChange={e=>setFilterGrade(e.target.value)} style={{padding:'6px 8px',border:'0.5px solid #DDD',borderRadius:7,fontSize:12}}>
            <option value="all">ทุก Grade</option>
            {gradeList.map(g=><option key={g} value={g}>{g}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:'6px 8px',border:'0.5px solid #DDD',borderRadius:7,fontSize:12}}>
            <option value="all">ทุก Status</option>
            <option value="no_jd">ยังไม่มี JD</option>
            {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filterAck} onChange={e=>setFilterAck(e.target.value)} style={{padding:'6px 8px',border:'0.5px solid #DDD',borderRadius:7,fontSize:12}}>
            <option value="all">Acknowledgement ทั้งหมด</option>
            <option value="acknowledged">รับทราบแล้ว</option>
            <option value="not_acknowledged">ยังไม่รับทราบ</option>
          </select>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
          <button onClick={()=>{setSearch('');setFilterBU('all');setFilterGrade('all');setFilterStatus('all');setFilterAck('all')}} style={{padding:'5px 12px',border:'0.5px solid #DDD',borderRadius:7,background:'#fff',fontSize:11,cursor:'pointer',color:'#666'}}>Reset</button>
          <button style={{padding:'5px 14px',border:'none',borderRadius:7,background:BLUE,fontSize:11,cursor:'pointer',color:BLUE_L,fontWeight:500}}>ค้นหา</button>
        </div>
      </div>

      {/* 3. SUMMARY CARDS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:8}}>
        {[
          {label:'JD ทั้งหมด',val:stats.total,sub:'ทุกสถานะ',bg:BLUE_L,c:'#0C447C',sc:'#185FA5',click:()=>setFilterStatus('all')},
          {label:'Active JD',val:stats.active,sub:`Coverage ${stats.coverage}%`,bg:GREEN_L,c:GREEN,sc:'#3B6D11',click:()=>setFilterStatus('active')},
          {label:'Pending Approval',val:stats.pending,sub:'รออนุมัติ',bg:AMB_L,c:AMB,sc:'#854F0B',click:()=>setFilterStatus('pending_approval')},
          {label:'ยังไม่มี JD',val:stats.noJD,sub:'ต้องดำเนินการ',bg:RED_L,c:RED,sc:'#A32D2D',click:()=>setFilterStatus('no_jd')},
        ].map((s,i)=>(
          <div key={i} onClick={s.click} style={{background:s.bg,borderRadius:12,padding:'12px 14px',cursor:'pointer',userSelect:'none',transition:'opacity .15s'}} onMouseEnter={e=>e.currentTarget.style.opacity='.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
            <div style={{fontSize:11,color:s.sc,marginBottom:4,fontWeight:500}}>{s.label}</div>
            <div style={{fontSize:26,fontWeight:500,color:s.c,lineHeight:1}}>{s.val}</div>
            <div style={{fontSize:10,color:s.sc,marginTop:4}}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:12}}>
        {[
          {label:'Draft JD',val:stats.draft,click:()=>setFilterStatus('draft')},
          {label:'Missing KPI',val:0,warn:true},
          {label:'Missing Competency',val:0,warn:true},
          {label:'Not Acknowledged',val:stats.notAck,warn:true,click:()=>setFilterAck('not_acknowledged')},
        ].map((s,i)=>(
          <div key={i} onClick={s.click} style={{background:'#fff',border:`0.5px solid ${s.warn&&s.val>0?'#FFA000':'#E0E0E0'}`,borderRadius:12,padding:'10px 14px',cursor:s.click?'pointer':'default'}}>
            <div style={{fontSize:11,color:'#888',marginBottom:3}}>{s.label}</div>
            <div style={{fontSize:20,fontWeight:500,color:s.warn&&s.val>0?'#E65100':'#333'}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* 4. CHARTS + ALERT ROW */}
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:8,marginBottom:12}}>
        {/* BU Coverage */}
        <div style={{background:'#fff',border:'0.5px solid #E0E0E0',borderRadius:12,padding:'14px 16px'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>JD Coverage by BU</div>
          {Object.entries(buStats).sort((a,b)=>b[1].total-a[1].total).slice(0,7).map(([bu,s])=>{
            const pct=Math.round(s.withJD/s.total*100)
            return <div key={bu} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                <span style={{fontSize:11,color:'#555',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{bu}</span>
                <span style={{fontSize:11,color:pct>0?GREEN:'#999',fontWeight:pct>0?500:400}}>{s.withJD}/{s.total}</span>
              </div>
              <div style={{height:6,background:'#F0F0F0',borderRadius:3}}>
                <div style={{width:`${pct}%`,height:6,background:pct===100?GREEN:pct>50?BLUE:'#FFA000',borderRadius:3,transition:'width .3s'}}/>
              </div>
            </div>
          })}
        </div>

        {/* Grade Distribution */}
        <div style={{background:'#fff',border:'0.5px solid #E0E0E0',borderRadius:12,padding:'14px 16px'}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>JD by Grade</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:100}}>
            {(() => {
              const gradeJD={}; jdList.forEach(j=>{if(j.grade)gradeJD[j.grade]=(gradeJD[j.grade]||0)+1})
              const grades=['G3','G4','G5','G6','G7','G8','G9','G10','G11']
              const max=Math.max(...grades.map(g=>gradeJD[g]||0),1)
              return grades.filter(g=>employees.some(e=>e.level===g)).map(g=>{
                const cnt=gradeJD[g]||0
                const h=Math.max(cnt/max*80,cnt>0?8:2)
                return <div key={g} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                  {cnt>0&&<span style={{fontSize:9,color:GREEN,fontWeight:500}}>{cnt}</span>}
                  <div style={{width:'100%',background:cnt>0?BLUE:'#E0E0E0',height:h,borderRadius:2}}/>
                  <span style={{fontSize:9,color:'#AAA'}}>{g}</span>
                </div>
              })
            })()}
          </div>
        </div>

        {/* Alert Panel */}
        <div style={{background:'#fff',border:`0.5px solid #E24B4A`,borderLeft:`3px solid #E24B4A`,borderRadius:12,padding:'14px 16px'}}>
          <div style={{fontSize:13,fontWeight:500,color:'#C62828',marginBottom:10,display:'flex',alignItems:'center',gap:6}}><AlertTriangle size={14} color='#C62828'/>Alert</div>
          <div style={{background:RED_L,borderRadius:8,padding:'8px 10px',marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:500,color:RED}}>ยังไม่มี JD</div>
            <div style={{fontSize:10,color:'#A32D2D'}}>{stats.noJD} คน รอดำเนินการ</div>
          </div>
          {stats.notAck>0&&<div style={{background:AMB_L,borderRadius:8,padding:'8px 10px',marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:500,color:AMB}}>Not Acknowledged</div>
            <div style={{fontSize:10,color:'#854F0B'}}>{stats.notAck} JD ยังไม่กดรับทราบ</div>
          </div>}
          <div style={{background:'#F8F9FA',borderRadius:8,padding:'8px 10px'}}>
            <div style={{fontSize:11,color:'#888'}}>ระบบทำงานปกติ</div>
          </div>
        </div>
      </div>

      {/* 5. QUICK ACTIONS */}
      <div style={{background:'#fff',border:'0.5px solid #E0E0E0',borderRadius:12,padding:'12px 16px',marginBottom:12}}>
        <div style={{fontSize:11,fontWeight:500,color:'#888',marginBottom:8}}>Quick Actions</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {isAdmin&&<button onClick={()=>showToast('เปิด JD Builder')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,background:BLUE,border:'none',fontSize:11,cursor:'pointer',color:BLUE_L,fontWeight:500}}><Plus size={13}/>สร้าง JD ใหม่</button>}
          <button onClick={()=>setShowAIPanel('generate')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><Sparkles size={13} color='#7C3AED'/>AI สร้าง JD</button>
          <button onClick={()=>setShowAIPanel('gap')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><BarChart3 size={13}/>AI วิเคราะห์ Gap</button>
          <button style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><Download size={13}/>Export รายงาน</button>
          <button onClick={()=>showToast('ส่ง Reminder ให้พนักงานที่ยังไม่ Acknowledge')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><Bell size={13}/>ส่ง Reminder</button>
          <button onClick={()=>setFilterStatus('pending_approval')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><Clock size={13}/>Pending Approval</button>
          <button onClick={()=>setFilterStatus('no_jd')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><AlertTriangle size={13}/>ไม่มี JD</button>
          <button onClick={()=>setFilterAck('not_acknowledged')} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,border:'0.5px solid #CCC',background:'#fff',fontSize:11,cursor:'pointer',color:'#555'}}><ListChecks size={13}/>Not Acknowledged</button>
        </div>
      </div>

      {/* 6. JD TABLE */}
      <div style={{background:'#fff',border:'0.5px solid #E0E0E0',borderRadius:12,overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:'0.5px solid #E0E0E0'}}>
          <div style={{fontSize:13,fontWeight:500}}>รายการพนักงานและ JD</div>
          <span style={{fontSize:11,color:'#888'}}>แสดง {filteredEmps.length} จาก {employees.length} คน</span>
        </div>
        {loading ? <div style={{textAlign:'center',padding:40,color:'#999'}}>กำลังโหลด...</div> : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:1100}}>
              <thead>
                <tr>
                  {['#','ชื่อพนักงาน','ตำแหน่ง','Grade','ฝ่าย/BU','JD Code','Version','Status','KPI','Competency','Acknowledge','Effective Date','Action'].map(h=>(
                    <th key={h} style={SH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmps.map((emp,i)=>{
                  const jd=jdByEmpId[emp.id]
                  return (
                    <tr key={emp.id} style={{background:i%2===0?'#fff':'#F4F7F5'}}>
                      <td style={{...SD,color:'#CCC',fontFamily:'monospace'}}>{i+1}</td>
                      <td style={SD}>
                        <div style={{display:'flex',alignItems:'center',gap:7}}>
                          <div style={{width:26,height:26,background:jd?BLUE:'#DDD',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:jd?BLUE_L:'#fff',flexShrink:0}}>
                            {(emp.first_name_th||'?')[0]}
                          </div>
                          <div>
                            <div style={{fontWeight:500,fontSize:12,whiteSpace:'nowrap'}}>{emp.prefix_th}{emp.first_name_th} {emp.last_name_th}</div>
                            <div style={{fontSize:10,color:'#AAA'}}>{emp.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{...SD,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{emp.position_th||'-'}</td>
                      <td style={SD}><span style={{background:BLUE_L,color:'#0C447C',padding:'1px 7px',borderRadius:20,fontSize:10,fontWeight:500,whiteSpace:'nowrap'}}>{emp.level||'-'}</span></td>
                      <td style={{...SD,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:11,color:'#666'}}>{emp.bu||'-'}</td>
                      <td style={{...SD,fontFamily:'monospace',fontSize:10,color:'#888',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{jd?.document_code||'—'}</td>
                      <td style={{...SD,fontSize:10,color:'#888'}}>{jd?`v${jd.version}`:'—'}</td>
                      <td style={SD}>{jd?<Badge status={jd.status}/>:<span style={{fontSize:10,color:'#E65100',background:'#FFF3E0',padding:'2px 7px',borderRadius:20}}>ไม่มี JD</span>}</td>
                      <td style={SD}>{jd?<Dot ok={true}/>:<Dot ok={false}/>}</td>
                      <td style={SD}>{jd?<Dot ok={true}/>:<Dot ok={false}/>}</td>
                      <td style={SD}>{jd?(jd.ackStatus==='acknowledged'?<span style={{color:GREEN,fontSize:11,fontWeight:500}}>✓ รับทราบ</span>:<span style={{fontSize:10,color:AMB,background:AMB_L,padding:'2px 7px',borderRadius:20}}>ยังไม่รับทราบ</span>):'-'}</td>
                      <td style={{...SD,fontSize:10,color:'#888',whiteSpace:'nowrap'}}>{jd?.effective_date?new Date(jd.effective_date).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}):'—'}</td>
                      <td style={SD}>
                        <div style={{display:'flex',gap:4}}>
                          {jd&&<button onClick={()=>setViewingJD({jdId:jd.id,empName:`${emp.first_name_th} ${emp.last_name_th}`})} style={{padding:'3px 8px',border:`0.5px solid ${BLUE}`,borderRadius:6,background:BLUE_L,cursor:'pointer',display:'flex',alignItems:'center',gap:3,fontSize:10,color:BLUE}} title="ดู JD">
                            <Eye size={11}/>ดู
                          </button>}
                          {!jd&&isAdmin&&<button onClick={()=>{setShowAIPanel({emp})}} style={{padding:'3px 8px',border:'0.5px solid #9C27B0',borderRadius:6,background:'#F3E5F5',cursor:'pointer',display:'flex',alignItems:'center',gap:3,fontSize:10,color:'#6A1B9A'}} title="AI สร้าง JD">
                            <Sparkles size={11}/>AI
                          </button>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredEmps.length===0&&<tr><td colSpan={14} style={{textAlign:'center',padding:32,color:'#CCC',fontSize:13}}>ไม่พบข้อมูล</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JD Viewer */}
      {viewingJD&&<JDViewModal jdId={viewingJD.jdId} empName={viewingJD.empName} onClose={()=>setViewingJD(null)}/>}

      {/* AI Panel */}
      {showAIPanel&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={()=>setShowAIPanel(null)}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:420,padding:20,boxShadow:'0 20px 60px rgba(0,0,0,0.15)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
              <div style={{width:36,height:36,background:'#EDE7F6',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={18} color='#6A1B9A'/></div>
              <div>
                <div style={{fontWeight:500,fontSize:14}}>AI JD Assistant</div>
                <div style={{fontSize:11,color:'#888'}}>{showAIPanel==='gap'?'วิเคราะห์ Gap JD ทั้งองค์กร':showAIPanel==='review'?'ตรวจสอบ JD ที่มีอยู่':'สร้าง JD อัตโนมัติ'}</div>
              </div>
              <button onClick={()=>setShowAIPanel(null)} style={{marginLeft:'auto',border:'none',background:'transparent',cursor:'pointer'}}><X size={16} color='#666'/></button>
            </div>
            <p style={{fontSize:12,color:'#555',lineHeight:1.5,marginBottom:14}}>
              {showAIPanel==='gap'?`มีพนักงาน ${stats.noJD} คน ยังไม่มี JD AI จะวิเคราะห์และแนะนำ JD ที่ควรสร้างก่อน`:showAIPanel==='review'?`ตรวจสอบ JD ที่ Active ${stats.active} รายการ ว่า KPI, Competency ครบถ้วนและเป็นปัจจุบันหรือไม่`:`เลือกพนักงานจากตารางด้านล่าง แล้วกดปุ่ม AI เพื่อสร้าง JD`}
            </p>
            <div style={{display:'flex',justifyContent:'flex-end',gap:6}}>
              <button onClick={()=>setShowAIPanel(null)} style={{padding:'7px 14px',border:'0.5px solid #DDD',borderRadius:8,background:'#fff',fontSize:12,cursor:'pointer',color:'#666'}}>ยกเลิก</button>
              <button onClick={()=>{showToast('AI กำลังประมวลผล...');setShowAIPanel(null)}} style={{padding:'7px 16px',border:'none',borderRadius:8,background:'#6A1B9A',fontSize:12,cursor:'pointer',color:'#fff',fontWeight:500}}>เริ่มต้น AI</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
