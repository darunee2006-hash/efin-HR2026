import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import {
  FileText, Plus, Search, Filter, Download, Eye, Edit3, Check,
  ChevronRight, ChevronDown, Sparkles, Save, Send, X, Star,
  Users, Building2, BarChart3, Clock, AlertTriangle, CheckCircle,
  Copy, History, Printer
} from 'lucide-react'

const G = { primary:'#00A651', dark:'#007A3D', light:'#E6F9F0', light2:'#CCF0DE' }
const BLUE = { primary:'#1565C0', light:'#E3F2FD', dark:'#0D47A1' }

const STATUS_COLORS = {
  draft:           { bg:'#F5F5F5', color:'#616161', label:'Draft' },
  pending_hr:      { bg:'#FFF9C4', color:'#F57F17', label:'รอ HR ตรวจสอบ' },
  pending_approval:{ bg:'#E3F2FD', color:'#1565C0', label:'รออนุมัติ' },
  approved:        { bg:'#E8F5E9', color:'#2E7D32', label:'อนุมัติแล้ว' },
  active:          { bg:'#E6F9F0', color:'#00875A', label:'Active' },
  rejected:        { bg:'#FEECEC', color:'#C62828', label:'Rejected' },
  archived:        { bg:'#ECEFF1', color:'#546E7A', label:'Archived' },
}

const CORE_VALUES = [
  { key:'E', label:'Empathy', desc:'เข้าใจและใส่ใจผู้อื่น ลูกค้าและเพื่อนร่วมงาน' },
  { key:'F', label:'Focus', desc:'มุ่งมั่น ตั้งใจ และทุ่มเทกับเป้าหมายที่กำหนด' },
  { key:'I', label:'Innovative', desc:'คิดสร้างสรรค์ ริเริ่มสิ่งใหม่ พัฒนาอย่างต่อเนื่อง' },
  { key:'N', label:'Noble', desc:'มีคุณธรรม ซื่อสัตย์ และรับผิดชอบต่อสังคม' },
  { key:'S', label:'Synergy', desc:'ร่วมมือร่วมใจ สร้างพลังทีมเพื่อผลลัพธ์ที่ดีกว่า' },
]

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.draft
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:s.bg,color:s.color}}>{s.label}</span>
}

function AiGenerateModal({ employee, onClose, onGenerate }) {
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const positionTh = employee?.position_th || ''
  const grade = employee?.level || employee?.job_grade || ''
  const dept = employee?.department_name_th || employee?.bu || ''

  const generateJD = async () => {
    setLoading(true)
    // Simulate AI generation (in production: call Claude API / Supabase Edge Function)
    await new Promise(r => setTimeout(r, 1500))
    const generated = {
      position_th: positionTh,
      position_en: employee?.position_en || '',
      grade, department: dept,
      job_summary: `ตำแหน่ง ${positionTh} มีหน้าที่รับผิดชอบในการ${prompt || `บริหารจัดการงานด้านที่เกี่ยวข้องกับ ${dept}`} โดยมุ่งเน้นการสร้างผลลัพธ์ที่มีคุณภาพ สอดคล้องกับเป้าหมายองค์กรและค่านิยม efin`,
      responsibilities: [
        { order_no:1, responsibility_text:`วางแผนและบริหารจัดการงาน ${positionTh} ให้บรรลุเป้าหมายที่กำหนด`, expected_outcome:`งานเสร็จตามกำหนด คุณภาพผ่านมาตรฐาน` },
        { order_no:2, responsibility_text:`ประสานงานกับทีมและหน่วยงานที่เกี่ยวข้องเพื่อให้งานดำเนินไปได้อย่างราบรื่น`, expected_outcome:`ลดข้อขัดแย้ง เพิ่มประสิทธิภาพการทำงานร่วมกัน` },
        { order_no:3, responsibility_text:`พัฒนาและปรับปรุงกระบวนการทำงานให้มีประสิทธิภาพมากขึ้นอย่างต่อเนื่อง`, expected_outcome:`ลดขั้นตอนที่ไม่จำเป็น เพิ่ม productivity อย่างน้อย 10%` },
        { order_no:4, responsibility_text:`จัดทำรายงานผลการปฏิบัติงานและนำเสนอต่อผู้บังคับบัญชาตามกำหนด`, expected_outcome:`รายงานครบถ้วน ถูกต้อง ส่งตรงเวลา` },
        { order_no:5, responsibility_text:`พัฒนาทักษะและความรู้ตนเองให้สอดคล้องกับทิศทางองค์กรและเทคโนโลยีที่เปลี่ยนแปลง`, expected_outcome:`มีทักษะและความรู้ที่อัพเดทอยู่เสมอ` },
      ],
      kpis: [
        { kpi_metric:'คุณภาพงาน', formula_unit:'%', target_value:'≥ 90%', reporting_frequency:'รายเดือน', metric_owner:'หัวหน้างาน' },
        { kpi_metric:'ความตรงต่อเวลา', formula_unit:'%', target_value:'≥ 95%', reporting_frequency:'รายเดือน', metric_owner:'หัวหน้างาน' },
        { kpi_metric:'ความพึงพอใจภายใน', formula_unit:'คะแนน', target_value:'≥ 4.0/5.0', reporting_frequency:'รายไตรมาส', metric_owner:'HR' },
      ],
      competencies: [
        { competency_type:'knowledge', competency_name:`ความรู้เฉพาะด้าน ${dept}`, core_or_nice:'core', proficiency_level: parseInt(grade?.replace('G',''))||3 >= 7 ? 3 : 2, behavior_indicator:'สามารถอธิบายและนำความรู้ไปใช้ได้อย่างถูกต้อง' },
        { competency_type:'skill', competency_name:'การสื่อสารและนำเสนอ', core_or_nice:'core', proficiency_level:2, behavior_indicator:'สื่อสารชัดเจน ตรงประเด็น เข้าใจง่าย' },
        { competency_type:'skill', competency_name:'การวิเคราะห์และแก้ปัญหา', core_or_nice:'core', proficiency_level:2, behavior_indicator:'วิเคราะห์สาเหตุได้ถูกต้อง เสนอแนวทางแก้ไขได้' },
        { competency_type:'mental', competency_name:'ความรับผิดชอบและความมุ่งมั่น', core_or_nice:'core', proficiency_level:3, behavior_indicator:'รับผิดชอบงานตลอด ทำงานเชิงรุก' },
      ],
      qualification: {
        education: 'ปริญญาตรี ขึ้นไป สาขาที่เกี่ยวข้อง',
        experience: `ประสบการณ์ทำงาน ${parseInt(grade?.replace('G',''))||3 >= 7 ? '5 ปีขึ้นไป' : parseInt(grade?.replace('G',''))||3 >= 5 ? '3-5 ปี' : '1-3 ปี'} ในสายงานที่เกี่ยวข้อง`,
        tools_systems: 'Microsoft Office, Google Workspace, ระบบ efin',
      },
      ojt: [
        { ojt_topic:'ความรู้ผลิตภัณฑ์และบริการ efin', description:'เข้าใจผลิตภัณฑ์หลักของบริษัท', required_timeline:'เดือนที่ 1' },
        { ojt_topic:'กระบวนการทำงานภายในฝ่าย', description:'เรียนรู้ workflow และ SOP ของฝ่าย', required_timeline:'เดือนที่ 1-2' },
        { ojt_topic:'ระบบเทคโนโลยีที่ใช้งาน', description:'การใช้งาน tools และ systems ขององค์กร', required_timeline:'เดือนที่ 2' },
      ],
    }
    onGenerate(generated)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-600"/></div>
          <div><h3 className="font-bold text-gray-900">AI สร้าง JD อัตโนมัติ</h3><p className="text-xs text-gray-400">สำหรับ: {employee?.prefix_th}{employee?.first_name_th} {employee?.last_name_th} · {positionTh}</p></div>
          <button onClick={onClose} className="ml-auto p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700 space-y-1">
            <div>📋 <b>ตำแหน่ง:</b> {positionTh}</div>
            <div>🏢 <b>ฝ่าย:</b> {dept}</div>
            <div>⭐ <b>Grade:</b> {grade}</div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">เพิ่มข้อมูลเพื่อให้ AI สร้าง JD ได้ตรงกว่า (ไม่บังคับ)</label>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={3} placeholder="เช่น: ดูแลระบบ CRM, บริหารทีม 5 คน, รับผิดชอบ revenue 10M..."
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"/>
          </div>
          <p className="text-[11px] text-gray-400">AI จะสร้าง JD Draft ตามโครงสร้างมาตรฐาน efin ท่านสามารถแก้ไขได้ภายหลัง</p>
        </div>
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">ยกเลิก</button>
          <button onClick={generateJD} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
            style={{background:'#7C3AED'}}>
            <Sparkles className="w-4 h-4"/>{loading ? 'กำลังสร้าง...' : 'สร้าง JD Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}

function JDBuilderModal({ jd, employee, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('header')
  const [form, setForm] = useState({
    position_th: jd?.position_th || employee?.position_th || '',
    position_en: jd?.position_en || employee?.position_en || '',
    grade: jd?.grade || employee?.level || '',
    department: jd?.department || employee?.department_name_th || employee?.bu || '',
    reports_to: jd?.reports_to || '',
    subordinates_count: jd?.subordinates_count || 0,
    work_location: jd?.work_location || 'สำนักงานใหญ่',
    job_summary: jd?.job_summary || '',
    effective_date: jd?.effective_date || new Date().toISOString().slice(0,10),
    confidentiality_level: jd?.confidentiality_level || 'internal',
  })
  const [responsibilities, setResponsibilities] = useState(jd?.responsibilities || [{ order_no:1, responsibility_text:'', expected_outcome:'' }])
  const [kpis, setKpis] = useState(jd?.kpis || [{ kpi_metric:'', formula_unit:'', target_value:'', reporting_frequency:'รายเดือน', metric_owner:'' }])
  const [competencies, setCompetencies] = useState(jd?.competencies || [])
  const [ojt, setOjt] = useState(jd?.ojt || [{ ojt_topic:'', description:'', required_timeline:'' }])
  const [qualification, setQualification] = useState(jd?.qualification || { education:'', experience:'', tools_systems:'', prerequisite_qualifications:'', licenses:'' })

  const sf = k => v => setForm(p=>({...p,[k]:v}))

  const handleSave = async (submitStatus = 'draft') => {
    setSaving(true)
    try {
      const docCode = `JD-${(employee?.employee_code||'EMP').toUpperCase()}-${new Date().getFullYear()}`
      const jdData = { ...form, employee_id: employee?.id, document_code: jd?.id ? undefined : docCode, status: submitStatus, updated_at: new Date().toISOString() }
      
      let jdId = jd?.id
      if (jdId) {
        await supabase.from('hr_job_descriptions').update(jdData).eq('id', jdId)
      } else {
        const { data } = await supabase.from('hr_job_descriptions').insert(jdData).select('id').single()
        jdId = data?.id
      }
      if (!jdId) throw new Error('ไม่สามารถบันทึก JD ได้')

      // Save sub-tables
      await supabase.from('hr_jd_responsibilities').delete().eq('jd_id', jdId)
      if (responsibilities.filter(r=>r.responsibility_text).length > 0)
        await supabase.from('hr_jd_responsibilities').insert(responsibilities.filter(r=>r.responsibility_text).map(r=>({...r, jd_id:jdId})))

      await supabase.from('hr_jd_kpis').delete().eq('jd_id', jdId)
      if (kpis.filter(k=>k.kpi_metric).length > 0)
        await supabase.from('hr_jd_kpis').insert(kpis.filter(k=>k.kpi_metric).map(k=>({...k, jd_id:jdId})))

      await supabase.from('hr_jd_competencies').delete().eq('jd_id', jdId)
      if (competencies.filter(c=>c.competency_name).length > 0)
        await supabase.from('hr_jd_competencies').insert(competencies.filter(c=>c.competency_name).map(c=>({...c, jd_id:jdId})))

      await supabase.from('hr_jd_ojt').delete().eq('jd_id', jdId)
      if (ojt.filter(o=>o.ojt_topic).length > 0)
        await supabase.from('hr_jd_ojt').insert(ojt.filter(o=>o.ojt_topic).map(o=>({...o, jd_id:jdId})))

      await supabase.from('hr_jd_qualifications').delete().eq('jd_id', jdId)
      if (Object.values(qualification).some(v=>v))
        await supabase.from('hr_jd_qualifications').insert({...qualification, jd_id:jdId})

      onSaved()
      onClose()
    } catch(e) { alert('เกิดข้อผิดพลาด: ' + e.message) }
    setSaving(false)
  }

  const SECTIONS = [
    { key:'header', label:'Header' }, { key:'summary', label:'Job Summary' },
    { key:'responsibilities', label:'ความรับผิดชอบ' }, { key:'kpi', label:'KPI' },
    { key:'qualification', label:'คุณสมบัติ' }, { key:'competency', label:'Competency' },
    { key:'ojt', label:'OJT' }, { key:'corevalues', label:'Core Values' },
  ]

  const FI = ({label, value, onChange, type='text', half, options}) => (
    <div className={half ? '' : 'col-span-2'}>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {options ? (
        <select value={value||''} onChange={e=>onChange(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-400">
          {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-400"/>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" style={{color:G.primary}}/>
            <div>
              <h3 className="font-bold text-gray-900">{jd?.id ? 'แก้ไข JD' : 'สร้าง JD ใหม่'}</h3>
              <p className="text-xs text-gray-400">{employee?.prefix_th}{employee?.first_name_th} {employee?.last_name_th} · {form.position_th}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400"/></button>
        </div>

        {/* Section tabs */}
        <div className="flex gap-0 border-b border-gray-100 overflow-x-auto px-4">
          {SECTIONS.map(s => (
            <button key={s.key} onClick={()=>setActiveSection(s.key)}
              className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition ${activeSection===s.key ? 'border-green-500 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {activeSection === 'header' && (
            <div className="grid grid-cols-2 gap-4">
              <FI label="ตำแหน่งภาษาไทย" value={form.position_th} onChange={sf('position_th')}/>
              <FI label="Position (EN)" value={form.position_en} onChange={sf('position_en')}/>
              <FI label="Grade" value={form.grade} onChange={sf('grade')} half/>
              <FI label="ฝ่าย/สังกัด" value={form.department} onChange={sf('department')} half/>
              <FI label="รายงานตรงต่อ" value={form.reports_to} onChange={sf('reports_to')} half/>
              <FI label="จำนวนผู้ใต้บังคับบัญชา" value={form.subordinates_count} onChange={sf('subordinates_count')} type="number" half/>
              <FI label="สถานที่ปฏิบัติงาน" value={form.work_location} onChange={sf('work_location')} half/>
              <FI label="วันที่บังคับใช้" value={form.effective_date} onChange={sf('effective_date')} type="date" half/>
              <FI label="ระดับความลับ" value={form.confidentiality_level} onChange={sf('confidentiality_level')} half
                options={[{value:'public',label:'สาธารณะ'},{value:'internal',label:'ภายในองค์กร'},{value:'confidential',label:'ลับ'},{value:'strictly_confidential',label:'ลับมาก'}]}/>
            </div>
          )}

          {activeSection === 'summary' && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Job Summary (3-5 บรรทัด)</label>
              <textarea value={form.job_summary} onChange={e=>sf('job_summary')(e.target.value)} rows={6}
                placeholder="สรุปบทบาทหน้าที่ เป้าหมาย ผลลัพธ์ที่คาดหวัง และความเชื่อมโยงกับองค์กร..."
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-green-400 resize-none"/>
            </div>
          )}

          {activeSection === 'responsibilities' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">ความรับผิดชอบหลัก (6-10 ข้อ)</h4>
                <button onClick={()=>setResponsibilities(p=>[...p,{order_no:p.length+1,responsibility_text:'',expected_outcome:''}])}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white" style={{background:G.primary}}>
                  <Plus className="w-3 h-3"/>เพิ่มข้อ
                </button>
              </div>
              {responsibilities.map((r,i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-5">{i+1}.</span>
                    <input value={r.responsibility_text} onChange={e=>setResponsibilities(p=>p.map((x,j)=>j===i?{...x,responsibility_text:e.target.value}:x))}
                      placeholder="ความรับผิดชอบหลัก..." className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-400"/>
                    <button onClick={()=>setResponsibilities(p=>p.filter((_,j)=>j!==i))} className="p-1 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400"/></button>
                  </div>
                  <input value={r.expected_outcome} onChange={e=>setResponsibilities(p=>p.map((x,j)=>j===i?{...x,expected_outcome:e.target.value}:x))}
                    placeholder="ผลที่คาดหวัง..." className="w-full text-xs border border-gray-100 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-300 bg-gray-50"/>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'kpi' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">KPI / Performance Indicators</h4>
                <button onClick={()=>setKpis(p=>[...p,{kpi_metric:'',formula_unit:'',target_value:'',reporting_frequency:'รายเดือน',metric_owner:''}])}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white" style={{background:G.primary}}>
                  <Plus className="w-3 h-3"/>เพิ่ม KPI
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="bg-gray-50">
                    <th className="px-2 py-2 text-left font-semibold text-gray-500">KPI/Metric</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500">สูตร/หน่วย</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500">ค่าเป้าหมาย</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500">ความถี่</th>
                    <th className="px-2 py-2 text-left font-semibold text-gray-500">เจ้าของ</th>
                    <th className="px-2 py-2"/>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {kpis.map((k,i) => (
                      <tr key={i}>
                        {['kpi_metric','formula_unit','target_value','reporting_frequency','metric_owner'].map(field => (
                          <td key={field} className="px-1 py-1">
                            <input value={k[field]||''} onChange={e=>setKpis(p=>p.map((x,j)=>j===i?{...x,[field]:e.target.value}:x))}
                              className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-300"/>
                          </td>
                        ))}
                        <td className="px-1 py-1"><button onClick={()=>setKpis(p=>p.filter((_,j)=>j!==i))} className="p-1 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400"/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'qualification' && (
            <div className="grid grid-cols-1 gap-4">
              {[['education','วุฒิการศึกษา'],['experience','ประสบการณ์ทำงาน'],['prerequisite_qualifications','คุณสมบัติที่ต้องมีก่อนสมัคร'],['tools_systems','เครื่องมือ/ระบบที่ใช้'],['licenses','ใบอนุญาต/มาตรฐานวิชาชีพ']].map(([field,label]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                  <input value={qualification[field]||''} onChange={e=>setQualification(p=>({...p,[field]:e.target.value}))}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-400"/>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'competency' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">Job Competencies</h4>
                <button onClick={()=>setCompetencies(p=>[...p,{competency_type:'knowledge',competency_name:'',core_or_nice:'core',proficiency_level:2,behavior_indicator:''}])}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white" style={{background:G.primary}}>
                  <Plus className="w-3 h-3"/>เพิ่ม
                </button>
              </div>
              {['knowledge','skill','mental'].map(type => (
                <div key={type}>
                  <h5 className="text-xs font-bold text-gray-500 mb-2 uppercase">{{knowledge:'Knowledge',skill:'Skills',mental:'Mental Skills'}[type]}</h5>
                  {competencies.filter(c=>c.competency_type===type).map((c,i) => {
                    const idx = competencies.indexOf(c)
                    return (
                      <div key={i} className="grid grid-cols-4 gap-2 mb-2 items-start">
                        <input value={c.competency_name} placeholder="ชื่อ Competency" onChange={e=>setCompetencies(p=>p.map((x,j)=>j===idx?{...x,competency_name:e.target.value}:x))}
                          className="col-span-2 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"/>
                        <select value={c.core_or_nice} onChange={e=>setCompetencies(p=>p.map((x,j)=>j===idx?{...x,core_or_nice:e.target.value}:x))}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
                          <option value="core">Core</option><option value="nice">Nice</option>
                        </select>
                        <select value={c.proficiency_level} onChange={e=>setCompetencies(p=>p.map((x,j)=>j===idx?{...x,proficiency_level:parseInt(e.target.value)}:x))}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5">
                          <option value={1}>Lv.1 พื้นฐาน</option><option value={2}>Lv.2 คล่องมือ</option><option value={3}>Lv.3 เชี่ยวชาญ</option>
                        </select>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {activeSection === 'ojt' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold text-gray-700">On-the-Job Training (OJT)</h4>
                <button onClick={()=>setOjt(p=>[...p,{ojt_topic:'',description:'',required_timeline:''}])}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white" style={{background:G.primary}}>
                  <Plus className="w-3 h-3"/>เพิ่ม
                </button>
              </div>
              {ojt.map((o,i) => (
                <div key={i} className="grid grid-cols-3 gap-2 border border-gray-200 rounded-xl p-3">
                  <input value={o.ojt_topic} placeholder="หัวข้อ OJT" onChange={e=>setOjt(p=>p.map((x,j)=>j===i?{...x,ojt_topic:e.target.value}:x))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"/>
                  <input value={o.description} placeholder="รายละเอียด" onChange={e=>setOjt(p=>p.map((x,j)=>j===i?{...x,description:e.target.value}:x))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"/>
                  <div className="flex gap-1">
                    <input value={o.required_timeline} placeholder="ระยะเวลา" onChange={e=>setOjt(p=>p.map((x,j)=>j===i?{...x,required_timeline:e.target.value}:x))}
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"/>
                    <button onClick={()=>setOjt(p=>p.filter((_,j)=>j!==i))} className="p-1 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'corevalues' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-2">Core Values efin ประจำ JD นี้ (กำหนดตายตัวตามองค์กร)</p>
              {CORE_VALUES.map(cv => (
                <div key={cv.key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{background:G.primary}}>{cv.key}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{cv.label}</p>
                    <p className="text-xs text-gray-500">{cv.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">ยกเลิก</button>
          <div className="flex gap-2">
            <button onClick={()=>handleSave('draft')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
              <Save className="w-4 h-4"/>บันทึก Draft
            </button>
            <button onClick={()=>handleSave('pending_hr')} disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-50"
              style={{background:G.primary}}>
              <Send className="w-4 h-4"/>{saving ? 'กำลังบันทึก...' : 'ส่งให้ HR ตรวจสอบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JDManagement({ lang, onNavigate, navContext = {} }) {
  const { role } = useAuth()
  const [jdList, setJdList] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAI, setShowAI] = useState(null) // employee object
  const [showBuilder, setShowBuilder] = useState(null) // {jd, employee}
  const [toast, setToast] = useState('')

  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(''),3000) }

  const load = async () => {
    setLoading(true)
    const [jdRes, empRes] = await Promise.all([
      supabase.from('hr_job_descriptions').select('*, hr_employees(id,employee_code,prefix_th,first_name_th,last_name_th,position_th,bu,level,company_entity)').eq('hr_employees.company_entity','ONL').order('created_at',{ascending:false}),
      supabase.from('hr_employees').select('id,employee_code,prefix_th,first_name_th,last_name_th,position_th,position_en,bu,level,department_name_th,company_entity').eq('status','active').eq('company_entity','ONL').order('first_name_th'),
    ])
    setJdList(jdRes.data||[])
    setEmployees(empRes.data||[])
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const filtered = useMemo(() => {
    return jdList.filter(jd => {
      const emp = jd.hr_employees
      const name = emp ? `${emp.first_name_th||''} ${emp.last_name_th||''}` : ''
      const matchSearch = !search || name.toLowerCase().includes(search.toLowerCase()) || (jd.document_code||'').includes(search) || (jd.position_th||'').includes(search)
      const matchStatus = filterStatus === 'all' || jd.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [jdList, search, filterStatus])

  const stats = useMemo(() => ({
    total: jdList.length,
    active: jdList.filter(j=>j.status==='active').length,
    pending: jdList.filter(j=>j.status?.includes('pending')).length,
    draft: jdList.filter(j=>j.status==='draft').length,
    noJD: employees.length - jdList.length,
  }), [jdList, employees])

  const empWithoutJD = useMemo(() => {
    const jdEmpIds = new Set(jdList.map(j=>j.employee_id))
    return employees.filter(e => !jdEmpIds.has(e.id))
  }, [employees, jdList])

  const handleAIGenerate = (employee) => setShowAI(employee)
  const handleAIResult = async (aiData) => {
    const emp = showAI
    setShowBuilder({ jd: aiData, employee: emp })
  }

  const handleAcknowledge = async (jdId) => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('hr_jd_acknowledgements').insert({ jd_id: jdId, employee_id: user?.id, version_no: 'v1.0', status: 'acknowledged' })
    showToast('รับทราบ JD สำเร็จแล้ว')
  }

  return (
    <div className="space-y-5 p-6">
      {toast && <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2" style={{background:G.primary}}><Check className="w-4 h-4"/>{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-6 h-6" style={{color:G.primary}}/>JD Management System</h1>
          <p className="text-sm text-gray-400 mt-0.5">จัดการ Job Description รายบุคคล · Online Asset</p>
        </div>
        {(role==='admin'||role==='superuser') && (
          <div className="flex gap-2">
            <button onClick={()=>setShowBuilder({jd:null,employee:employees[0]})}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-xl" style={{background:G.primary}}>
              <Plus className="w-4 h-4"/>สร้าง JD ใหม่
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:'JD ทั้งหมด', value: stats.total, icon: FileText, color: G.primary, onClick: ()=>setFilterStatus('all') },
          { label:'Active', value: stats.active, icon: CheckCircle, color: '#00875A', onClick: ()=>setFilterStatus('active') },
          { label:'รออนุมัติ', value: stats.pending, icon: Clock, color: '#F57F17', onClick: ()=>setFilterStatus('pending_approval') },
          { label:'Draft', value: stats.draft, icon: Edit3, color: '#6554C0', onClick: ()=>setFilterStatus('draft') },
          { label:'ยังไม่มี JD', value: stats.noJD, icon: AlertTriangle, color: '#DE350B', onClick: ()=>setFilterStatus('all') },
        ].map((s,i) => (
          <button key={i} onClick={s.onClick} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition text-left">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{color:s.color}}/>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อพนักงาน, ตำแหน่ง, Document Code..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-green-400"/>
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="all">ทุกสถานะ</option>
          {Object.entries(STATUS_COLORS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* JD List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 grid grid-cols-12 gap-3 text-xs font-semibold text-gray-400 uppercase">
          <span className="col-span-3">พนักงาน</span>
          <span className="col-span-2">ตำแหน่ง / Grade</span>
          <span className="col-span-2">Document Code</span>
          <span className="col-span-2">Version / วันบังคับใช้</span>
          <span className="col-span-1">สถานะ</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderColor:G.primary}}/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30"/>
            <p className="text-sm">ไม่พบ JD</p>
          </div>
        ) : filtered.map(jd => {
          const emp = jd.hr_employees
          const name = emp ? `${emp.prefix_th||''}${emp.first_name_th||''} ${emp.last_name_th||''}` : '-'
          return (
            <div key={jd.id} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 grid grid-cols-12 gap-3 items-center text-sm">
              <div className="col-span-3">
                <p className="font-medium text-gray-900 text-sm">{name}</p>
                <p className="text-xs text-gray-400">{emp?.employee_code}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-700 font-medium">{jd.position_th||emp?.position_th||'-'}</p>
                <p className="text-xs text-gray-400">{jd.grade||emp?.level}</p>
              </div>
              <div className="col-span-2 font-mono text-xs text-gray-500">{jd.document_code||'-'}</div>
              <div className="col-span-2">
                <p className="text-xs font-medium text-gray-700">{jd.version||'v1.0'}</p>
                <p className="text-xs text-gray-400">{jd.effective_date ? new Date(jd.effective_date).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}) : '-'}</p>
              </div>
              <div className="col-span-1"><StatusBadge status={jd.status}/></div>
              <div className="col-span-2 flex items-center gap-1 justify-end">
                <button onClick={()=>setShowBuilder({jd,employee:emp})} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-400 hover:text-green-600" title="แก้ไข">
                  <Edit3 className="w-4 h-4"/>
                </button>
                <button onClick={()=>handleAcknowledge(jd.id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600" title="รับทราบ">
                  <Check className="w-4 h-4"/>
                </button>
              </div>
            </div>
          )
        })}
        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-50">แสดง {filtered.length} จาก {jdList.length} JD</div>
      </div>

      {/* Employees without JD */}
      {empWithoutJD.length > 0 && (role==='admin'||role==='superuser') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600"/>
            <span className="text-sm font-semibold text-amber-700">พนักงาน {empWithoutJD.length} คน ยังไม่มี JD</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {empWithoutJD.slice(0,12).map(emp => (
              <div key={emp.id} className="flex items-center gap-2 bg-white border border-amber-100 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-700">{emp.prefix_th}{emp.first_name_th} {emp.last_name_th}</span>
                <button onClick={()=>handleAIGenerate(emp)} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md text-white" style={{background:'#7C3AED'}}>
                  <Sparkles className="w-3 h-3"/>AI สร้าง
                </button>
              </div>
            ))}
            {empWithoutJD.length > 12 && <span className="text-xs text-amber-600 self-center">+{empWithoutJD.length-12} คน</span>}
          </div>
        </div>
      )}

      {/* Modals */}
      {showAI && <AiGenerateModal employee={showAI} onClose={()=>setShowAI(null)} onGenerate={handleAIResult}/>}
      {showBuilder && <JDBuilderModal jd={showBuilder.jd} employee={showBuilder.employee||employees[0]} onClose={()=>setShowBuilder(null)} onSaved={()=>{load();showToast('บันทึก JD สำเร็จ')}}/>}
    </div>
  )
}
