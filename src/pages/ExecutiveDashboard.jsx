import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useCompanyFilter } from '../lib/CompanyFilterContext'
import {
  Users, TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  Star, Target, Briefcase, RefreshCw, Download, ChevronRight,
  Building2, Shield, Zap, Clock, BarChart3, PieChart,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

const G = { primary:'#7DC242', dark:'#5A9020', darker:'#4E7F1A', light:'#E8F5D0', light2:'#C5E888', mid:'#8FCC4A', accent:'#F5A623', danger:'#DE350B', info:'#0052CC', warn:'#FF991F' }
const BU_COLORS = ['#7DC242','#5A9020','#8FCC4A','#C5E888','#F5A623','#B8DC80','#D8EDE3','#4E7F1A']
const fmt = n => (n??0).toLocaleString('th-TH')
const fmtM = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(0)+'K' : fmt(Math.round(n))

const MONTHS_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

function KPI({ icon: Icon, label, value, unit, sub, color, change, changeUp, onClick, badge }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer relative`}>
      {badge && <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{background:G.light,color:G.primary}}>{badge}</span>}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: color+'22'}}>
          <Icon className="w-5 h-5" style={{color}}/>
        </div>
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}<span className="text-base font-normal text-gray-400 ml-1">{unit}</span></div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${changeUp ? 'text-green-600' : 'text-red-500'}`}>
          {changeUp ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>}
          {change}
        </div>
      )}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle, color }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: (color||G.primary)+'22'}}>
        <Icon className="w-5 h-5" style={{color: color||G.primary}}/>
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function ExecutiveDashboard({ lang, onNavigate, navContext = {} }) {
  const { filterByCompany } = useCompanyFilter()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState([])
  const [costData, setCostData] = useState([])
  const [filterMonth, setFilterMonth] = useState('all')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [editingRev, setEditingRev] = useState(null)  // {id, bu, target_mb, actual_mb}
  const [savingRev, setSavingRev] = useState(false)
  const [revenueTotal, setRevenueTotal] = useState({ target:0, actual:0, variance:0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [empRes, costRes] = await Promise.all([
        supabase.from('hr_employees')
          .select('id,employee_code,first_name_th,last_name_th,bu,department_name_th,position_th,level,hire_date,resignation_date,employment_type,company_entity,status,base_salary,pvd_employee_rate,pvd_method,sso_deduct'),
        supabase.from('hr_cost_employee')
          .select('period_month,hr_employee_id,salary,provident_fund,social_security,total_cost,work_hours,cost_per_hour')
          .order('period_month', { ascending: false }),
      ])
      setEmployees(empRes.data || [])
      setCostData(costRes.data || [])
      // Fetch revenue targets
      const { data: revData } = await supabase.from('hr_revenue_targets')
        .select('*').eq('company_entity','ONL').order('actual_mb',{ascending:false})
      setRevenueData(revData||[])
      const tot = (revData||[]).reduce((s,r)=>({target:s.target+(Number(r.target_mb)||0),actual:s.actual+(Number(r.actual_mb)||0),variance:s.variance+(Number(r.variance_mb)||0)}),{target:0,actual:0,variance:0})
      setRevenueTotal(tot)
      setLastUpdated(new Date())
      setLoading(false)
    }
    load()
  }, [])

  const activeEmps = useMemo(() => employees.filter(e => e.status === 'active'), [employees])
  const resignedThisYear = useMemo(() => {
    const yr = new Date().getFullYear()
    return employees.filter(e => e.resignation_date && new Date(e.resignation_date).getFullYear() === yr)
  }, [employees])

  const availableMonths = useMemo(() => [...new Set(costData.map(r => r.period_month))].sort().reverse(), [costData])
  const filteredCost = useMemo(() => filterMonth === 'all' ? costData : costData.filter(r => r.period_month === filterMonth), [costData, filterMonth])

  const totalCostMonth = useMemo(() => filteredCost.reduce((s,r) => s + (Number(r.total_cost)||0), 0), [filteredCost])
  const totalSalaryMonth = useMemo(() => filteredCost.reduce((s,r) => s + (Number(r.salary)||0), 0), [filteredCost])

  const turnoverRate = useMemo(() => {
    const avgHead = activeEmps.length + resignedThisYear.length / 2 || 1
    return ((resignedThisYear.length / avgHead) * 100).toFixed(1)
  }, [activeEmps, resignedThisYear])

  // BU breakdown
  const STD_BUS = ['BU efin.finance','BU Center','BU IR Plus','BU Content','BU IT Solution','Expert']

  const buBreakdown = useMemo(() => {
    const m = {}
    activeEmps.forEach(e => {
      const bu = e.bu || 'ไม่ระบุ'
      if (!STD_BUS.includes(bu)) return  // เฉพาะ BU มาตรฐาน
      if (!m[bu]) m[bu] = { bu, count: 0, cost: 0, salary: 0 }
      m[bu].count++
      m[bu].salary += Number(e.base_salary) || 0
    })
    filteredCost.forEach(r => {
      const emp = employees.find(e => e.id === r.hr_employee_id)
      if (!emp || !STD_BUS.includes(emp.bu)) return
      if (m[emp.bu]) m[emp.bu].cost += Number(r.total_cost) || 0
    })
    return Object.values(m).sort((a,b) => b.count - a.count)
  }, [activeEmps, filteredCost, employees])

  // ฝ่ายงาน breakdown
  const deptBreakdown = useMemo(() => {
    const m = {}
    activeEmps.forEach(e => {
      const dept = e.department_name_th || 'ไม่ระบุ'
      if (!m[dept]) m[dept] = { dept, bu: e.bu||'', count: 0, cost: 0, salary: 0 }
      m[dept].count++
      m[dept].salary += Number(e.base_salary) || 0
    })
    filteredCost.forEach(r => {
      const emp = employees.find(e => e.id === r.hr_employee_id)
      if (!emp) return
      const dept = emp.department_name_th || 'ไม่ระบุ'
      if (m[dept]) m[dept].cost += Number(r.total_cost) || 0
    })
    return Object.values(m).sort((a,b) => b.count - a.count)
  }, [activeEmps, filteredCost, employees])

  // Monthly cost trend
  const monthlyTrend = useMemo(() => {
    const m = {}
    costData.forEach(r => {
      if (!m[r.period_month]) m[r.period_month] = { month: r.period_month, cost: 0, headcount: new Set() }
      m[r.period_month].cost += Number(r.total_cost) || 0
      if (r.hr_employee_id) m[r.period_month].headcount.add(r.hr_employee_id)
    })
    return Object.values(m).sort((a,b) => a.month.localeCompare(b.month)).map(d => {
      const [yr, mo] = d.month.split('-')
      const thaiYr = parseInt(yr) + 543
      return { ...d, label: MONTHS_TH[parseInt(mo)-1] + ' ' + thaiYr, count: d.headcount.size }
    })
  }, [costData])

  // New hires this year
  const newHiresThisYear = useMemo(() => {
    const yr = new Date().getFullYear()
    return activeEmps.filter(e => e.hire_date && new Date(e.hire_date).getFullYear() === yr)
  }, [activeEmps])

  // Cost per head
  const costPerHead = useMemo(() => {
    const empCount = new Set(filteredCost.map(r => r.hr_employee_id).filter(Boolean)).size
    return empCount > 0 ? totalCostMonth / empCount : 0
  }, [filteredCost, totalCostMonth])

  // Board Alerts - auto-generated from data
  const alerts = useMemo(() => {
    const list = []
    // High turnover BUs
    const resBU = {}
    resignedThisYear.forEach(e => { resBU[e.bu||'ไม่ระบุ'] = (resBU[e.bu||'ไม่ระบุ']||0)+1 })
    Object.entries(resBU).sort((a,b)=>b[1]-a[1]).slice(0,2).forEach(([bu, n]) => {
      if (n >= 2) list.push({ type:'danger', title:`ความเสี่ยงการลาออกใน ${bu}`, desc:`${n} คนลาออกในปีนี้`, icon: TrendingDown })
    })
    // High cost BUs
    const topCostBU = [...buBreakdown].sort((a,b)=>b.cost-a.cost)[0]
    if (topCostBU && topCostBU.cost > 0) list.push({ type:'info', title:`BU ต้นทุนสูงสุด: ${topCostBU.bu}`, desc:`฿${fmtM(topCostBU.cost)} / ${topCostBU.count} คน`, icon: DollarSign })
    // Senior employees without succession (level G9+)
    const seniorNoSuccessor = activeEmps.filter(e => {
      const lvl = parseInt((e.level||'').replace('G','')) || 0
      return lvl >= 9
    })
    if (seniorNoSuccessor.length > 0) list.push({ type:'warn', title:`ผู้บริหารระดับสูง ${seniorNoSuccessor.length} คน`, desc:'ยังไม่มีข้อมูล Succession Plan', icon: Shield })
    return list.slice(0, 5)
  }, [resignedThisYear, buBreakdown, activeEmps])

  const monthLabel = iso => {
    if (!iso) return '-'
    const [yr, mo] = iso.split('-')
    return MONTHS_TH[parseInt(mo)-1] + ' ' + (parseInt(yr)+543)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-green-200 border-t-[#7DC242] rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-gray-500">กำลังโหลดข้อมูลผู้บริหาร...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-6" style={{background:'#F4F7F5'}}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:G.primary,borderRadius:8}}><BarChart3 className="w-4 h-4 text-white"/></div>
            <h1 className="text-2xl font-bold text-gray-900">Executive HR Dashboard</h1>
          </div>
          <p className="text-sm text-gray-400">CEO & Board People Overview · ข้อมูล Real-time จาก Database</p>
          {lastUpdated && <p className="text-xs text-gray-300 mt-0.5">Last updated: {lastUpdated.toLocaleTimeString('th-TH')}</p>}
        </div>
        <div className="flex items-center gap-3">
          <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white shadow-sm">
            <option value="all">ทุกเดือน</option>
            {availableMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{background:G.primary}}>
            <Download className="w-4 h-4"/>Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI icon={Users} label="พนักงานทั้งหมด" value={fmt(activeEmps.length)} unit="คน"
          sub={`เข้าใหม่ปีนี้ ${newHiresThisYear.length} คน`}
          color={G.primary} changeUp change={`+${newHiresThisYear.length} YTD`}
          onClick={() => onNavigate && onNavigate('employees')} />
        <KPI icon={TrendingDown} label="Turnover Rate YTD" value={turnoverRate} unit="%"
          sub={`ลาออก ${resignedThisYear.length} คน ในปีนี้`}
          color={parseFloat(turnoverRate) > 15 ? G.danger : G.warn}
          changeUp={false} change={`${resignedThisYear.length} คน ลาออก`}
          onClick={() => onNavigate && onNavigate('employees', {search:'ลาออก'})} />
        <KPI icon={DollarSign} label="ต้นทุนพนักงานรวม" value={'฿'+fmtM(totalCostMonth)} unit=""
          sub={filterMonth === 'all' ? `รวม ${availableMonths.length} เดือน` : monthLabel(filterMonth)}
          color={G.info} badge="REAL"
          onClick={() => onNavigate && onNavigate('costAnalysis')} />
        <KPI icon={Users} label="ต้นทุน/หัว/เดือน" value={'฿'+fmtM(costPerHead)} unit=""
          sub={`เงินเดือนเฉลี่ย ฿${fmtM(totalSalaryMonth / Math.max(1, new Set(filteredCost.map(r=>r.hr_employee_id).filter(Boolean)).size))}`}
          color="#6554C0"
          onClick={() => onNavigate && onNavigate('costAnalysis')} />
      </div>

      {/* KPI Cards - Row 2 (Placeholder for missing data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPI icon={Star} label="Critical Talent" value="0" unit="คน"
          sub="ยังไม่มีข้อมูล Talent Records" color="#FF8B00"
          onClick={() => onNavigate && onNavigate('employees')} />
        <KPI icon={Target} label="Succession Coverage" value="0" unit="%"
          sub="ยังไม่มีข้อมูล Succession Plan" color="#36B37E"
          onClick={() => onNavigate && onNavigate('employees')} />
        <KPI icon={Zap} label="Engagement Score" value="0" unit="/10"
          sub="ยังไม่มีผลสำรวจ Engagement" color="#00B8D9"
          onClick={() => onNavigate && onNavigate('employees')} />
        <KPI icon={Briefcase} label="ตำแหน่งว่าง" value="0" unit="ตำแหน่ง"
          sub="ยังไม่มีข้อมูล Recruitment" color="#6554C0"
          onClick={() => onNavigate && onNavigate('recruitment')} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* BU Headcount Bar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <SectionHeader icon={Building2} title="Headcount by BU" subtitle={`${activeEmps.length} คน ใน ${buBreakdown.length} BU`} />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={buBreakdown.slice(0,8)} margin={{top:5,right:10,left:-10,bottom:40}}>
              <XAxis dataKey="bu" tick={{fontSize:10}} angle={-30} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip formatter={(v,n) => [fmt(v), n==='count'?'จำนวนคน':'ต้นทุน']}/>
              <Bar dataKey="count" name="count" radius={[4,4,0,0]}>
                {buBreakdown.slice(0,8).map((_, i) => <Cell key={i} fill={BU_COLORS[i % BU_COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Donut */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <SectionHeader icon={PieChart} title="ต้นทุน by BU" subtitle={`฿${fmtM(totalCostMonth)} รวม`} />
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <RechartsPie>
                <Pie data={buBreakdown.filter(d=>d.cost>0).slice(0,6)} cx="50%" cy="50%"
                  innerRadius={45} outerRadius={70} dataKey="cost" strokeWidth={2} stroke="#fff">
                  {buBreakdown.slice(0,6).map((_,i) => <Cell key={i} fill={BU_COLORS[i % BU_COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={v => '฿'+fmtM(v)}/>
              </RechartsPie>
            </ResponsiveContainer>
            <div className="w-full space-y-1 mt-2">
              {buBreakdown.filter(d=>d.cost>0).slice(0,5).map((d,i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{background:BU_COLORS[i%BU_COLORS.length]}}/>
                    <span className="text-gray-600 truncate max-w-[100px]">{d.bu}</span>
                  </span>
                  <span className="font-medium text-gray-700">{totalCostMonth > 0 ? ((d.cost/totalCostMonth)*100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Monthly Cost Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <SectionHeader icon={TrendingUp} title="Monthly Cost Trend" subtitle="ต้นทุนรวมรายเดือน (฿)" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyTrend} margin={{top:5,right:10,left:-10,bottom:5}}>
              <XAxis dataKey="label" tick={{fontSize:10}}/>
              <YAxis tick={{fontSize:10}} tickFormatter={v => '฿'+fmtM(v)}/>
              <Tooltip formatter={v => '฿'+fmtM(v)}/>
              <Line type="monotone" dataKey="cost" stroke="#7DC242" strokeWidth={2.5} dot={{fill:G.primary,r:4}} name="ต้นทุนรวม"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Board Alert Center */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <SectionHeader icon={AlertTriangle} title="Board Alert Center" subtitle={`${alerts.length} รายการต้องติดตาม`} color={G.danger}/>
          <div className="space-y-3">
            {alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border" style={{
                background: a.type==='danger'?'#FFF5F5':a.type==='warn'?'#FFFBE6':'#EBF4FF',
                borderColor: a.type==='danger'?'#FFBDAD':a.type==='warn'?'#FFE58F':'#BAE3FF'
              }}>
                <a.icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{
                  color: a.type==='danger'?G.danger:a.type==='warn'?G.warn:G.info
                }}/>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 leading-tight">{a.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{a.desc}</p>
                </div>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">ไม่มี Alert ในขณะนี้</p>}
          </div>
        </div>
      </div>

      {/* Top BU Cost Table + Strategic Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Departments by Cost */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          {/* BU Section */}
          <SectionHeader icon={DollarSign} title="ต้นทุนแยก BU" subtitle={`฿${fmtM(totalCostMonth)} รวม`} color={G.info}/>
          <table className="w-full text-sm mb-4">
            <thead><tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left pb-2 pt-1 px-2 text-xs text-gray-400 font-medium">BU</th>
              <th className="text-right pb-2 pt-1 px-2 text-xs text-gray-400 font-medium">คน</th>
              <th className="text-right pb-2 pt-1 px-2 text-xs text-gray-400 font-medium">ต้นทุน</th>
              <th className="text-right pb-2 pt-1 px-2 text-xs text-gray-400 font-medium">%</th>
            </tr></thead>
            <tbody>
              {buBreakdown.map((d,i) => {
                const pct = totalCostMonth > 0 ? (d.cost/totalCostMonth*100) : (d.salary / (activeEmps.reduce((s,e)=>s+(Number(e.base_salary)||0),0) || 1) * 100)
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                    onClick={() => onNavigate && onNavigate('staffList', {bu: d.bu})}>
                    <td className="py-1.5 px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:BU_COLORS[i%BU_COLORS.length]}}/>
                        <span className="text-gray-800 font-medium text-xs">{d.bu}</span>
                      </div>
                      <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${Math.max(pct,2)}%`,background:BU_COLORS[i%BU_COLORS.length]}}/>
                      </div>
                    </td>
                    <td className="py-1.5 px-2 text-right text-xs font-medium text-gray-700">{fmt(d.count)}</td>
                    <td className="py-1.5 px-2 text-right text-xs font-mono text-gray-700">{d.cost>0?'฿'+fmtM(d.cost):'฿'+fmtM(d.salary)}</td>
                    <td className="py-1.5 px-2 text-right text-xs text-gray-400">{pct.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* ฝ่ายงาน Section */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5"/>ต้นทุนแยกฝ่ายงาน
            </div>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left pb-1 pt-1 px-2 text-[10px] text-gray-400 font-medium">ฝ่าย</th>
                <th className="text-left pb-1 pt-1 px-2 text-[10px] text-gray-400 font-medium">BU</th>
                <th className="text-right pb-1 pt-1 px-2 text-[10px] text-gray-400 font-medium">คน</th>
                <th className="text-right pb-1 pt-1 px-2 text-[10px] text-gray-400 font-medium">ต้นทุน</th>
              </tr></thead>
              <tbody>
                {deptBreakdown.slice(0,12).map((d,i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1 px-2 text-gray-700 truncate max-w-[120px]">{d.dept}</td>
                    <td className="py-1 px-2 text-gray-400">{d.bu}</td>
                    <td className="py-1 px-2 text-right font-medium text-gray-700">{fmt(d.count)}</td>
                    <td className="py-1 px-2 text-right font-mono text-gray-600">{d.cost>0?'฿'+fmtM(d.cost):'฿'+fmtM(d.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <SectionHeader icon={Zap} title="Strategic Recommendations" subtitle="สำหรับ CEO & Board" color={G.accent}/>
          <div className="space-y-4">
            {[
              {
                priority: 'HIGH',
                title: 'บริหารจัดการต้นทุนบุคลากร Center',
                detail: `BU Center มีต้นทุนสูงสุด ${buBreakdown.find(b=>b.bu==='Center') ? '฿'+fmtM(buBreakdown.find(b=>b.bu==='Center').cost||buBreakdown.find(b=>b.bu==='Center').salary) : '-'} ควรทบทวนการจัดสรรงาน`,
                color: G.danger,
              },
              {
                priority: 'MEDIUM',
                title: 'วางแผน Succession สำหรับผู้บริหาร G9+',
                detail: `มีผู้บริหาร ${activeEmps.filter(e=>(parseInt((e.level||'').replace('G',''))||0)>=9).length} คน ระดับ G9+ ที่ยังไม่มี Successor`,
                color: G.warn,
              },
              {
                priority: 'MEDIUM',
                title: 'ติดตาม Turnover Rate',
                detail: `อัตรา Turnover YTD อยู่ที่ ${turnoverRate}% (${resignedThisYear.length} คน) ควรสัมภาษณ์เหตุผลการลาออก`,
                color: G.info,
              },
              {
                priority: 'LOW',
                title: 'เพิ่มข้อมูล Talent & Engagement',
                detail: 'ยังขาดข้อมูล Performance/OKR, Talent 9-Box และ Engagement Survey เพื่อให้ Dashboard สมบูรณ์',
                color: '#6554C0',
              },
            ].map((r, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex-shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{background: r.priority==='HIGH'?G.danger:r.priority==='MEDIUM'?G.warn:'#6554C0'}}>
                    {r.priority}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.detail}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1"/>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mt-4 mb-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{color:G.primary}}/>
              Revenues 2026 (Actual+Backlog BF) vs Target
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">สรุป ม.ค.-พ.ค.69 · หน่วย: ล้านบาท (MB)</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-xs text-gray-400">Target</div>
              <div className="font-bold text-gray-900">{revenueTotal.target.toFixed(2)} MB</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Actual</div>
              <div className="font-bold" style={{color:G.primary}}>{revenueTotal.actual.toFixed(2)} MB</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Variance</div>
              <div className="font-bold text-red-600">{revenueTotal.variance.toFixed(2)} MB</div>
            </div>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400">BU</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400">Target 2026 (MB)</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400">Actual+Backlog BF (MB)</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400">Variance (MB)</th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-gray-400">%Target</th>
            </tr>
          </thead>
          <tbody>
            {revenueData.map((r,i)=>{
              const pct = r.target_mb > 0 ? ((r.actual_mb/r.target_mb)*100).toFixed(1) : '0.0'
              const isNeg = r.variance_mb < 0
              return (
                <tr key={i} className={`border-b border-gray-50 ${i%2===1?'bg-gray-50/50':''}`}>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{r.bu}</td>
                  <td className="py-2.5 px-3 text-right">
                    {editingRev?.id===r.id
                      ? <input type="number" value={editingRev.target_mb} onChange={e=>setEditingRev(p=>({...p,target_mb:e.target.value}))} className="w-20 text-right text-sm border border-gray-300 rounded px-1 py-0.5 font-mono" step="0.01"/>
                      : <span className="font-mono text-gray-700">{Number(r.target_mb).toFixed(2)}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {editingRev?.id===r.id
                      ? <input type="number" value={editingRev.actual_mb} onChange={e=>setEditingRev(p=>({...p,actual_mb:e.target.value}))} className="w-20 text-right text-sm border border-gray-300 rounded px-1 py-0.5 font-mono" style={{color:G.primary}} step="0.01"/>
                      : <span className="font-mono font-semibold" style={{color:G.primary}}>{Number(r.actual_mb).toFixed(2)}</span>}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold" style={{color:isNeg?'#DE350B':'#00875A'}}>
                    {isNeg?'':'+' }{editingRev?.id===r.id?(Number(editingRev.actual_mb||0)-Number(editingRev.target_mb||0)).toFixed(2):Number(r.variance_mb).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{width:`${Math.min(parseFloat(pct),100)}%`,background:parseFloat(pct)>=100?G.primary:parseFloat(pct)>=70?G.accent:'#DE350B'}}/>
                      </div>
                      <span className="text-xs font-medium w-8" style={{color:parseFloat(pct)>=100?G.primary:parseFloat(pct)>=70?G.accent:'#DE350B'}}>{pct}%</span>
                      {editingRev?.id===r.id
                        ? <>
                            <button onClick={()=>saveRevenue(editingRev)} disabled={savingRev} className="text-[10px] px-2 py-0.5 rounded text-white" style={{background:G.primary}}>{savingRev?'...':'บันทึก'}</button>
                            <button onClick={()=>setEditingRev(null)} className="text-[10px] px-2 py-0.5 rounded border border-gray-300 text-gray-500">ยกเลิก</button>
                          </>
                        : <button onClick={()=>setEditingRev({...r})} className="text-[10px] px-2 py-0.5 rounded border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-400">แก้ไข</button>
                      }
                    </div>
                  </td>
                </tr>
              )
            })}
            {/* Total row */}
            <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
              <td className="py-2.5 px-3 text-gray-900">Total</td>
              <td className="py-2.5 px-3 text-right font-mono text-gray-900">{revenueTotal.target.toFixed(2)}</td>
              <td className="py-2.5 px-3 text-right font-mono" style={{color:G.primary}}>{revenueTotal.actual.toFixed(2)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-red-600">{revenueTotal.variance.toFixed(2)}</td>
              <td className="py-2.5 px-3 text-right">
                <span className="text-xs font-bold text-red-600">{revenueTotal.target>0?((revenueTotal.actual/revenueTotal.target)*100).toFixed(1):0}%</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-xs text-gray-300">
        Executive HR Dashboard · Online Asset Co., Ltd. · ข้อมูลจาก Supabase Database · {lastUpdated?.toLocaleString('th-TH')}
      </div>
    </div>
  )
}
