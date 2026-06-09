import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'

// ====================================================
// DOCUMENT REQUESTS PAGE
// ฟีเจอร์: สร้าง PDF เอกสาร 4 ประเภท
// 1. หนังสือรับรองการทำงาน (Employment Certificate)
// 2. ใบลา (Leave Request Form)
// 3. ใบเตือน (Warning Letter)
// 4. ใบผ่านงาน (Experience Certificate)
// ====================================================

const DOC_TYPES = [
  {
    id: 'employment_cert',
    label: 'หนังสือรับรองการทำงาน',
    icon: '📋',
    description: 'รับรองการเป็นพนักงาน ตำแหน่ง และเงินเดือน',
    color: 'blue',
  },
  {
    id: 'leave_form',
    label: 'ใบลา',
    icon: '🗓️',
    description: 'แบบฟอร์มขอลางาน (ลาพักร้อน / ลาป่วย / ลากิจ)',
    color: 'green',
  },
  {
    id: 'warning_letter',
    label: 'ใบเตือน',
    icon: '⚠️',
    description: 'หนังสือเตือนพนักงาน (ครั้งที่ 1 / 2 / 3)',
    color: 'yellow',
  },
  {
    id: 'experience_cert',
    label: 'ใบผ่านงาน',
    icon: '🏅',
    description: 'รับรองประสบการณ์การทำงานหลังพ้นสภาพ',
    color: 'purple',
  },
]

const LEAVE_TYPES = ['ลาพักร้อน', 'ลาป่วย', 'ลากิจ', 'ลาคลอด', 'ลาบวช', 'ลาอื่นๆ']

const WARNING_LEVELS = [
  { value: '1', label: 'ครั้งที่ 1 (ตักเตือนด้วยวาจา)' },
  { value: '2', label: 'ครั้งที่ 2 (ตักเตือนเป็นลายลักษณ์อักษร)' },
  { value: '3', label: 'ครั้งที่ 3 (ภาคทัณฑ์ / พักงาน)' },
]

const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]
function toThaiDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
}
function todayThai() { return toThaiDate(new Date().toISOString()) }

function drawHeader(doc, title) {
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Online Asset Co., Ltd. | Group of Companies', 105, 15, { align: 'center' })
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 105, 26, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

function drawFooter(doc, docNo) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setDrawColor(200, 200, 200)
    doc.line(15, 280, 195, 280)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`เลขที่เอกสาร: ${docNo}`, 15, 285)
    doc.text(`พิมพ์วันที่: ${todayThai()}`, 105, 285, { align: 'center' })
    doc.text(`หน้า ${i} / ${pageCount}`, 195, 285, { align: 'right' })
  }
}

function generateDocNumber(type) {
  const prefix = {
    employment_cert: 'OA-HR-CERT',
    leave_form: 'OA-HR-LV',
    warning_letter: 'OA-HR-WRN',
    experience_cert: 'OA-HR-EXP',
  }
  const now = new Date()
  const y = now.getFullYear() + 543
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const rand = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix[type]}-${y}${m}-${rand}`
}

function generateEmploymentCert(emp, options) {
  const doc = new jsPDF()
  const docNo = generateDocNumber('employment_cert')
  drawHeader(doc, 'EMPLOYMENT CERTIFICATE | หนังสือรับรองการทำงาน')
  let y = 50
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const lines = [
    ['วันที่:', todayThai()], ['เลขที่:', docNo], ['', ''],
    ['เรื่อง:', 'หนังสือรับรองการทำงาน'], ['', ''], ['เรียน:', 'ผู้เกี่ยวข้อง'], ['', ''],
  ]
  lines.forEach(([label, value]) => {
    if (label) {
      doc.setFont('helvetica', 'bold'); doc.text(label, 20, y)
      doc.setFont('helvetica', 'normal'); doc.text(value, 55, y)
    }
    y += 7
  })
  const startDate = emp.start_date ? toThaiDate(emp.start_date) : '—'
  const bodyText = [
    `     บริษัท ${emp.company_full || 'ออนไลน์แอสเซท จำกัด'} ขอรับรองว่า`,
    `${emp.first_name_th || emp.full_name || emp.first_name} ${emp.last_name_th || emp.last_name || ''}`,
    `รหัสพนักงาน: ${emp.employee_code || '—'}`,
    `ตำแหน่ง: ${emp.position || emp.job_title || '—'}`,
    `ฝ่าย/ฝ่าย: ${emp.department || '—'}`,
    `เริ่มงานวันที่: ${startDate}`,
    `ปัจจุบันยังคงเป็นพนักงานประจำของบริษัท และมีความประพฤติดีตลอดมา`,
  ]
  bodyText.forEach((line) => { doc.text(line, 20, y); y += 8 })
  if (options.includeSalary) {
    y += 5
    doc.setFont('helvetica', 'bold')
    doc.text(`อัตราเงินเดือนปัจจุบัน: ${emp.salary ? Number(emp.salary).toLocaleString() + ' บาท/เดือน' : '(ตามสัญญา)'}`, 20, y)
    doc.setFont('helvetica', 'normal'); y += 8
  }
  y += 10
  doc.text('หนังสือฉบับนี้ออกให้เพื่อรับรองว่าเป็นพนักงานของบริษัทจริง', 20, y)
  y += 20
  doc.text('ลงชื่อ ......................................', 120, y); y += 8
  doc.text('(............................................)', 120, y); y += 7
  doc.text('ผู้จัดการฝ่ายทรัพยากรบุคคล', 120, y); y += 7
  doc.text(`วันที่ ${todayThai()}`, 120, y)
  drawFooter(doc, docNo)
  return { doc, docNo }
}

function generateLeaveForm(emp, options) {
  const doc = new jsPDF()
  const docNo = generateDocNumber('leave_form')
  drawHeader(doc, 'LEAVE REQUEST FORM | ใบลา')
  let y = 48
  doc.setFontSize(11)
  const fields = [
    ['วันที่:', todayThai(), 'เลขที่:', docNo],
    ['ชื่อพนักงาน:', `${emp.first_name || ''} ${emp.last_name || ''}`, 'รหัส:', emp.employee_code || '—'],
    ['ตำแหน่ง:', emp.position || emp.job_title || '—', 'ฝ่าย:', emp.department || '—'],
    ['BU:', emp.bu || '—', 'บริษัท:', emp.company || '—'],
  ]
  fields.forEach(([l1, v1, l2, v2]) => {
    doc.setFont('helvetica', 'bold'); doc.text(l1, 15, y)
    doc.setFont('helvetica', 'normal'); doc.text(v1, 50, y)
    doc.setFont('helvetica', 'bold'); doc.text(l2, 115, y)
    doc.setFont('helvetica', 'normal'); doc.text(v2, 140, y)
    y += 9
  })
  y += 5
  doc.setFont('helvetica', 'bold'); doc.text('ประเภทการลา:', 15, y)
  doc.setFont('helvetica', 'normal'); doc.text(options.leaveType || '—', 60, y); y += 9
  doc.setFont('helvetica', 'bold'); doc.text('ลาวันที่:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${toThaiDate(options.leaveFrom)} ถึง ${toThaiDate(options.leaveTo)}`, 50, y)
  doc.setFont('helvetica', 'bold'); doc.text('จำนวน:', 130, y)
  doc.setFont('helvetica', 'normal'); doc.text(`${options.leaveDays || '—'} วัน`, 155, y); y += 9
  doc.setFont('helvetica', 'bold'); doc.text('เหตุผล:', 15, y)
  doc.setFont('helvetica', 'normal')
  const reasonLines = doc.splitTextToSize(options.reason || '—', 150)
  doc.text(reasonLines, 50, y); y += reasonLines.length * 7 + 5
  doc.setFont('helvetica', 'bold'); doc.text('ผู้รักษาการแทน:', 15, y)
  doc.setFont('helvetica', 'normal'); doc.text(options.substitute || '—', 60, y); y += 15
  doc.setFillColor(245, 245, 245); doc.rect(15, y, 180, 50, 'F')
  doc.setDrawColor(200, 200, 200); doc.rect(15, y, 180, 50)
  y += 8
  doc.setFont('helvetica', 'bold'); doc.text('ส่วนอนุมัติ', 105, y, { align: 'center' }); y += 10
  const approvalCols = [{ label: 'ลงชื่อผู้ลา', x: 40 }, { label: 'หัวหน้างาน', x: 105 }, { label: 'HR อนุมัติ', x: 170 }]
  approvalCols.forEach(({ label, x }) => {
    doc.setFont('helvetica', 'normal')
    doc.text('..............................', x, y, { align: 'center' })
    doc.text(`(${label})`, x, y + 7, { align: 'center' })
    doc.text('วันที่ ..................', x, y + 14, { align: 'center' })
  })
  drawFooter(doc, docNo)
  return { doc, docNo }
}

function generateWarningLetter(emp, options) {
  const doc = new jsPDF()
  const docNo = generateDocNumber('warning_letter')
  drawHeader(doc, 'WARNING LETTER | หนังสือเตือน')
  let y = 50
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold'); doc.text('วันที่:', 20, y)
  doc.setFont('helvetica', 'normal'); doc.text(todayThai(), 45, y)
  doc.setFont('helvetica', 'bold'); doc.text('เลขที่:', 110, y)
  doc.setFont('helvetica', 'normal'); doc.text(docNo, 130, y); y += 10
  doc.setFont('helvetica', 'bold'); doc.text('เรื่อง:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`หนังสือเตือน ${options.warningLevel ? `(${WARNING_LEVELS.find(w => w.value === options.warningLevel)?.label || ''})` : ''}`, 40, y); y += 10
  doc.setFont('helvetica', 'bold'); doc.text('เรียน:', 20, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${emp.first_name || ''} ${emp.last_name || ''} (รหัส: ${emp.employee_code || '—'})`, 40, y); y += 8
  doc.text(`ตำแหน่ง: ${emp.position || emp.job_title || '—'}  |  ฝ่าย: ${emp.department || '—'}`, 40, y); y += 15
  const reasonText = options.reason || 'ได้กระทำการอันมิบังควร ขัดต่อระเบียบข้อบังคับของบริษัท'
  const bodyLines = doc.splitTextToSize(`     บริษัทฯ ได้รับทราบว่าท่านได้ ${reasonText} ซึ่งถือว่าเป็นการกระทำผิดวินัยของบริษัท บริษัทฯ จึงออกหนังสือเตือนฉบับนี้ เพื่อให้ท่านรับทราบและปรับปรุงพฤติกรรมดังกล่าว`, 170)
  doc.setFont('helvetica', 'normal'); doc.text(bodyLines, 20, y); y += bodyLines.length * 7 + 10
  if (options.details) {
    doc.setFont('helvetica', 'bold'); doc.text('รายละเอียด:', 20, y); y += 7
    const detailLines = doc.splitTextToSize(options.details, 170)
    doc.setFont('helvetica', 'normal'); doc.text(detailLines, 20, y); y += detailLines.length * 7 + 10
  }
  y += 10
  doc.text('ลงชื่อ ......................................', 120, y); y += 8
  doc.text('(............................................)', 120, y); y += 7
  doc.text('ผู้จัดการฝ่ายทรัพยากรบุคคล', 120, y); y += 20
  doc.setDrawColor(200, 200, 200); doc.line(20, y, 190, y); y += 8
  doc.setFont('helvetica', 'bold'); doc.text('รับทราบหนังสือเตือน', 105, y, { align: 'center' }); y += 10
  doc.setFont('helvetica', 'normal')
  doc.text('ลงชื่อ ......................................', 105, y, { align: 'center' }); y += 8
  doc.text(`(${emp.first_name || ''} ${emp.last_name || ''})`, 105, y, { align: 'center' }); y += 7
  doc.text('วันที่ ..........................................', 105, y, { align: 'center' })
  drawFooter(doc, docNo)
  return { doc, docNo }
}

function generateExperienceCert(emp, options) {
  const doc = new jsPDF()
  const docNo = generateDocNumber('experience_cert')
  drawHeader(doc, 'EXPERIENCE CERTIFICATE | ใบผ่านงาน')
  let y = 50
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold'); doc.text('วันที่:', 20, y)
  doc.setFont('helvetica', 'normal'); doc.text(todayThai(), 45, y); y += 10
  doc.setFont('helvetica', 'bold'); doc.text('เรื่อง:', 20, y)
  doc.setFont('helvetica', 'normal'); doc.text('ใบผ่านงาน', 40, y); y += 10
  doc.setFont('helvetica', 'bold'); doc.text('เรียน:', 20, y)
  doc.setFont('helvetica', 'normal'); doc.text('ผู้เกี่ยวข้อง', 40, y); y += 15
  const startDate = emp.start_date ? toThaiDate(emp.start_date) : '—'
  const endDate = emp.resignation_date || emp.termination_date ? toThaiDate(emp.resignation_date || emp.termination_date) : toThaiDate(options.endDate) || '—'
  const bodyLines = doc.splitTextToSize(
    `     บริษัท ${emp.company_full || 'ออนไลน์แอสเซท จำกัด'} ขอรับรองว่า ${emp.first_name || ''} ${emp.last_name || ''} รหัสพนักงาน ${emp.employee_code || '—'} ได้ปฏิบัติงานในตำแหน่ง ${emp.position || emp.job_title || '—'} ฝ่าย/แผนก ${emp.department || '—'} ตั้งแต่วันที่ ${startDate} ถึงวันที่ ${endDate} รวมระยะเวลา ${options.tenure || '—'}`, 170)
  doc.text(bodyLines, 20, y); y += bodyLines.length * 7 + 10
  if (options.performance) {
    const perfLines = doc.splitTextToSize(`ผลการปฏิบัติงาน: ${options.performance}`, 170)
    doc.text(perfLines, 20, y); y += perfLines.length * 7 + 5
  }
  doc.text('หนังสือฉบับนี้ออกให้เพื่อใช้เป็นหลักฐานในการสมัครงาน', 20, y); y += 20
  doc.text('ลงชื่อ ......................................', 120, y); y += 8
  doc.text('(............................................)', 120, y); y += 7
  doc.text('ผู้จัดการฝ่ายทรัพยากรบุคคล', 120, y); y += 7
  doc.text(`วันที่ ${todayThai()}`, 120, y)
  drawFooter(doc, docNo)
  return { doc, docNo }
}

const colorMap = {
  blue:   { bg: 'bg-[#f0fce8]',   border: 'border-[#C5E888]',   btn: 'bg-[#7DC242] hover:bg-[#5A9020]',   icon: 'text-[#7DC242]'   },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  btn: 'bg-green-600 hover:bg-green-700',  icon: 'text-green-600'  },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', btn: 'bg-yellow-600 hover:bg-yellow-700',icon: 'text-yellow-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', btn: 'bg-purple-600 hover:bg-purple-700',icon: 'text-purple-600' },
}

export default function DocumentRequests() {
  const [employees, setEmployees] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState(null)
  const [selectedEmpId, setSelectedEmpId] = useState('')
  const [searchEmp, setSearchEmp] = useState('')
  const [generating, setGenerating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [activeTab, setActiveTab] = useState('create')
  const [options, setOptions] = useState({
    includeSalary: false, leaveType: '', leaveFrom: '', leaveTo: '',
    leaveDays: '', reason: '', substitute: '', warningLevel: '1',
    details: '', endDate: '', tenure: '', performance: '',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: emps } = await supabase
      .from('hr_employees')
      .select('id, employee_code, first_name, last_name, first_name_th, last_name_th, position, job_title, department, company, bu, start_date, resignation_date, termination_date, status, salary')
      .not('company', 'ilike', '%EFIN%')
      .eq('status', 'active')
      .order('first_name')
    const { data: reqs } = await supabase
      .from('hr_document_requests')
      .select('*, hr_employees(first_name, last_name, employee_code)')
      .order('created_at', { ascending: false })
      .limit(50)
    setEmployees(emps || [])
    setRequests(reqs || [])
    setLoading(false)
  }

  const filteredEmps = employees.filter(e => {
    if (!searchEmp) return true
    const q = searchEmp.toLowerCase()
    return (e.first_name || '').toLowerCase().includes(q) ||
      (e.last_name || '').toLowerCase().includes(q) ||
      (e.employee_code || '').toLowerCase().includes(q)
  })

  const selectedEmp = employees.find(e => e.id === selectedEmpId)

  async function handleGenerate() {
    if (!selectedEmp || !selectedType) return
    setGenerating(true)
    let result
    try {
      if (selectedType === 'employment_cert') result = generateEmploymentCert(selectedEmp, options)
      else if (selectedType === 'leave_form') result = generateLeaveForm(selectedEmp, options)
      else if (selectedType === 'warning_letter') result = generateWarningLetter(selectedEmp, options)
      else if (selectedType === 'experience_cert') result = generateExperienceCert(selectedEmp, options)
      if (result) {
        const typeLabel = DOC_TYPES.find(t => t.id === selectedType)?.label || selectedType
        const filename = `${typeLabel}_${selectedEmp.employee_code || selectedEmp.first_name}_${new Date().toISOString().slice(0,10)}.pdf`
        result.doc.save(filename)
        await supabase.from('hr_document_requests').insert({
          employee_id: selectedEmp.id,
          document_type: selectedType,
          document_number: result.docNo,
          requested_by: (await supabase.auth.getUser()).data.user?.email,
          status: 'completed',
          notes: JSON.stringify(options),
        })
        setSuccessMsg(`✅ สร้างเอกสาร "${typeLabel}" สำเร็จ! (${result.docNo})`)
        setTimeout(() => setSuccessMsg(''), 5000)
        fetchData()
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('เกิดข้อผิดพลาดในการสร้าง PDF: ' + err.message)
    }
    setGenerating(false)
  }

  const docType = DOC_TYPES.find(t => t.id === selectedType)
  const colors = docType ? colorMap[docType.color] : null

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ระบบออกเอกสาร HR</h1>
        <p className="text-gray-500 mt-1">สร้างเอกสาร PDF 4 ประเภท สำหรับพนักงาน</p>
      </div>
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">{successMsg}</div>
      )}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {[['create','➕ สร้างเอกสาร'],['history','📁 ประวัติเอกสาร']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${activeTab === key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">1. เลือกประเภทเอกสาร</h2>
            <div className="space-y-2">
              {DOC_TYPES.map(type => {
                const c = colorMap[type.color]
                const active = selectedType === type.id
                return (
                  <button key={type.id} onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${active ? `${c.bg} ${c.border} shadow-md` : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className={`font-semibold text-sm ${active ? c.icon : 'text-gray-800'}`}>{type.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{type.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">2. เลือกพนักงาน</h2>
            <input type="text" placeholder="🔍 ค้นหาชื่อ / รหัสพนักงาน" value={searchEmp}
              onChange={e => setSearchEmp(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-400 text-sm">กำลังโหลด...</div>
              ) : filteredEmps.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">ไม่พบพนักงาน</div>
              ) : filteredEmps.slice(0, 50).map(emp => (
                <button key={emp.id} onClick={() => setSelectedEmpId(emp.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${selectedEmpId === emp.id ? 'bg-[#f0fce8]' : ''}`}>
                  <div className="font-medium text-sm text-gray-800">{emp.first_name} {emp.last_name}</div>
                  <div className="text-xs text-gray-400">{emp.employee_code} · {emp.position || emp.job_title || '—'} · {emp.department || '—'}</div>
                </button>
              ))}
            </div>
            {selectedEmp && (
              <div className="mt-3 p-3 bg-[#f0fce8] border border-[#C5E888] rounded-lg">
                <div className="font-semibold text-[#4E7F1A] text-sm">{selectedEmp.first_name} {selectedEmp.last_name}</div>
                <div className="text-xs text-[#7DC242]">{selectedEmp.employee_code} · {selectedEmp.bu || selectedEmp.company}</div>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">3. ตั้งค่าเอกสาร</h2>
            {!selectedType ? (
              <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">เลือกประเภทเอกสารก่อน</div>
            ) : (
              <div className="space-y-4">
                {selectedType === 'employment_cert' && (
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={options.includeSalary}
                      onChange={e => setOptions(o => ({ ...o, includeSalary: e.target.checked }))} className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700">ระบุเงินเดือนในเอกสาร</span>
                  </label>
                )}
                {selectedType === 'leave_form' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">ประเภทการลา</label>
                      <select value={options.leaveType} onChange={e => setOptions(o => ({ ...o, leaveType: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        <option value="">-- เลือกประเภท --</option>
                        {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">วันเริ่มลา</label>
                        <input type="date" value={options.leaveFrom} onChange={e => setOptions(o => ({ ...o, leaveFrom: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">วันสิ้นสุด</label>
                        <input type="date" value={options.leaveTo} onChange={e => setOptions(o => ({ ...o, leaveTo: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">จำนวนวัน</label>
                      <input type="number" value={options.leaveDays} min="0.5" step="0.5" onChange={e => setOptions(o => ({ ...o, leaveDays: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">เหตุผล</label>
                      <textarea value={options.reason} rows={2} onChange={e => setOptions(o => ({ ...o, reason: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">ผู้รักษาการแทน</label>
                      <input type="text" value={options.substitute} onChange={e => setOptions(o => ({ ...o, substitute: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </>
                )}
                {selectedType === 'warning_letter' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">ระดับการเตือน</label>
                      <select value={options.warningLevel} onChange={e => setOptions(o => ({ ...o, warningLevel: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                        {WARNING_LEVELS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">เหตุผล / สาเหตุ</label>
                      <textarea value={options.reason} rows={2} onChange={e => setOptions(o => ({ ...o, reason: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        placeholder="เช่น มาสายเกิน 5 ครั้งในเดือนเดียว" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">รายละเอียดเพิ่มเติม</label>
                      <textarea value={options.details} rows={2} onChange={e => setOptions(o => ({ ...o, details: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </>
                )}
                {selectedType === 'experience_cert' && (
                  <>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">วันสุดท้ายที่ทำงาน</label>
                      <input type="date" value={options.endDate} onChange={e => setOptions(o => ({ ...o, endDate: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">ระยะเวลาทำงาน (เช่น 3 ปี 2 เดือน)</label>
                      <input type="text" value={options.tenure} onChange={e => setOptions(o => ({ ...o, tenure: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">ผลการปฏิบัติงาน (optional)</label>
                      <textarea value={options.performance} rows={2} onChange={e => setOptions(o => ({ ...o, performance: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </>
                )}
                <button onClick={handleGenerate} disabled={!selectedEmp || !selectedType || generating}
                  className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all ${!selectedEmp || !selectedType ? 'bg-gray-300 cursor-not-allowed' : generating ? 'bg-gray-400 cursor-wait' : colors?.btn || 'bg-[#7DC242] hover:bg-[#5A9020]'}`}>
                  {generating ? '⏳ กำลังสร้าง PDF...' : `📄 สร้าง ${docType?.label || 'เอกสาร'}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">ประวัติการออกเอกสาร</h2>
            <span className="text-sm text-gray-500">{requests.length} รายการล่าสุด</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-400">ยังไม่มีประวัติการออกเอกสาร</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {['เลขที่เอกสาร','ประเภท','พนักงาน','ออกโดย','วันที่','สถานะ'].map(h => (
                      <th key={h} className="text-left py-3 px-4 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => {
                    const typeInfo = DOC_TYPES.find(t => t.id === r.document_type)
                    return (
                      <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">{r.document_number || '—'}</td>
                        <td className="py-3 px-4"><span className="inline-flex items-center gap-1">{typeInfo?.icon} {typeInfo?.label || r.document_type}</span></td>
                        <td className="py-3 px-4">{r.hr_employees ? `${r.hr_employees.first_name} ${r.hr_employees.last_name}` : '—'}</td>
                        <td className="py-3 px-4 text-gray-500">{r.requested_by || '—'}</td>
                        <td className="py-3 px-4 text-gray-500">{r.created_at ? toThaiDate(r.created_at) : '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {r.status === 'completed' ? '✅ สำเร็จ' : r.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
