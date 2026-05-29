import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Users, UserPlus, UserMinus, DollarSign, GraduationCap, Clock, AlertTriangle, ChevronRight, Briefcase, Target, BookOpen, Calendar, Shield, FileText, TrendingUp, ArrowUpRight, ArrowDownRight, X, Search, Building2, Phone, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { useCompanyFilter } from '../lib/CompanyFilterContext'
import { LoadingSpinner } from '../components/UI'

const COLORS_BU = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#94a3b8']
const COLORS_ABC = ['#10b981', '#3b82f6', '#f59e0b']

function KpiCard({ icon: Icon, iconBg, label, value, trend, trendUp, onClick }) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 min-w-0 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200' : ''}`}
      onClick={onClick}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`text-xs flex items-center gap-0.5 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </p>
        )}
      </div>
      {onClick && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
    </div>
  )
}

/* ---------- Detail Popup (Modal overlay) ---------- */
function DetailPopup({ title, icon: Icon, iconBg, data, columns, onClose, formatValue }) {
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    if (!data) return []
    let list = data
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(row =>
        columns.some(c => {
          const v = c.render ? c.render(row) : row[c.key]
          return v && String(v).toLowerCase().includes(q)
        })
      )
    }
    if (sortCol !== null) {
      const col = columns[sortCol]
      list = [...list].sort((a, b) => {
        const av = col.sortKey ? col.sortKey(a) : (col.render ? col.render(a) : a[col.key]) || ''
        const bv = col.sortKey ? col.sortKey(b) : (col.render ? col.render(b) : b[col.key]) || ''
        if (typeof av === 'number' && typeof bv === 'number') return sortAsc ? av - bv : bv - av
        return sortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
      })
    }
    return list
  }, [data, search, sortCol, sortAsc, columns])

  const toggleSort = (idx) => {
    if (sortCol === idx) { setSortAsc(!sortAsc) } else { setSortCol(idx); setSortAsc(true) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-8 pb-8 px-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-500">{filtered.length} รายการ</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 w-48"
              />
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-auto flex-1 px-2">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 w-10">#</th>
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
                    onClick={() => toggleSort(i)}
                  >
                    {col.label} {sortCol === i ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row, ri) => (
                <tr key={ri} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{ri + 1}</td>
                  {columns.map((col, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                      {col.render ? col.render(row) : (formatValue ? formatValue(row[col.key], col.key) : (row[col.key] || '-'))}
                    </td>
                  ))}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={columns.length + 1} className="text-center py-8 text-gray-400">ไม่พบข้อมูล</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 text-right">
          แสดง {filtered.length} จาก {data?.length || 0} รายการ
        </div>
      </div>
    </div>
  )
}

function DashCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>}
      {children}
    </div>
  )
}

function PipelineStep({ label, count, color, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center ${color}`}>
        <span className="text-lg font-bold text-white">{count}</span>
      </div>
      <span className="text-[10px] text-gray-500 font-medium text-center">{label}</span>
    </div>
  )
}

function ActionItem({ icon: Icon, label, count, color = 'text-orange-500' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 group cursor-pointer hover:bg-gray-50 rounded px-2 -mx-2">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-semibold ${color}`}>{count}</span>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
      </div>
    </div>
  )
}

function AttendanceStat({ icon: Icon, iconColor, label, value, unit }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className="text-xl font-bold text-gray-900">{value}</span>
      <span className="text-[10px] text-gray-400">{unit}</span>
    </div>
  )
}

// Custom donut label
function renderCenterLabel(cx, cy, value, sub) {
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-gray-900 text-2xl font-bold" style={{ fontSize: 28, fontWeight: 700 }}>{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-gray-400" style={{ fontSize: 11 }}>{sub}</text>
    </g>
  )
}

export default function Dashboard({ lang }) {
  const { canViewSalary } = useAuth()
  const { filterByCompany, filterVersion } = useCompanyFilter()
  const [loading, setLoading] = useState(true)
  const [rawActive, setRawActive] = useState([])
  const [rawAll, setRawAll] = useState([])
  const [detailPopup, setDetailPopup] = useState(null) // { type, title, icon, iconBg }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: activeData } = await supabase
          .from('hr_employees')
          .select('*, hr_departments(name_th, name_en)')
          .eq('status', 'active')

        const mapped = (activeData || []).map(e => ({
          ...e,
          department: e.hr_departments
            ? (lang === 'th' ? e.hr_departments.name_th : e.hr_departments.name_en)
            : null
        }))
        setRawActive(mapped)

        const { data: allData } = await supabase
          .from('hr_employees')
          .select('*, hr_departments(name_th, name_en)')
        const mappedAll = (allData || []).map(e => ({
          ...e,
          department: e.hr_departments
            ? (lang === 'th' ? e.hr_departments.name_th : e.hr_departments.name_en)
            : null
        }))
        setRawAll(mappedAll)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [lang])

  // Apply company filter client-side (useMemo re-runs when filterByCompany changes)
  const employees = useMemo(() => filterByCompany(rawActive), [rawActive, filterByCompany])
  const allEmployees = useMemo(() => filterByCompany(rawAll), [rawAll, filterByCompany])

  // Stats
  const now = new Date()
  const cm = now.getMonth(), cy = now.getFullYear()
  const newHiresCount = allEmployees.filter(e => { const d = e.hire_date ? new Date(e.hire_date) : null; return d && d.getFullYear() === cy }).length
  const resignedCount = allEmployees.filter(e => { const d = e.resignation_date ? new Date(e.resignation_date) : null; return d && d.getFullYear() === cy }).length
  const stats = {
    beginYear: employees.length + resignedCount - newHiresCount,
    active: employees.length,
    newHires: newHiresCount,
    resigned: resignedCount,
    peopleCost: (() => { const salaries = employees.filter(e => e.base_salary).map(e => Number(e.base_salary)); return salaries.reduce((a, b) => a + b, 0) })(),
    avgTenure: (() => {
      const withHire = employees.filter(e => e.hire_date)
      if (withHire.length === 0) return { years: 0, months: 0, count: 0 }
      const totalMonths = withHire.reduce((sum, e) => {
        const hd = new Date(e.hire_date)
        const diffMs = now - hd
        return sum + diffMs / (30.44 * 24 * 60 * 60 * 1000)
      }, 0)
      const avgM = totalMonths / withHire.length
      return { years: Math.floor(avgM / 12), months: Math.round(avgM % 12), count: withHire.length }
    })(),
    avgAge: (() => {
      const withDob = employees.filter(e => e.date_of_birth)
      if (withDob.length === 0) return { years: 0, count: 0 }
      const totalAge = withDob.reduce((sum, e) => {
        const bd = new Date(e.date_of_birth)
        const age = (now - bd) / (365.25 * 24 * 60 * 60 * 1000)
        return sum + age
      }, 0)
      return { years: Math.round((totalAge / withDob.length) * 10) / 10, count: withDob.length }
    })(),
    turnover: (() => {
      // นับเฉพาะ "ลาออก" (voluntary) — ไม่นับ "เลิกจ้าง" และ "ไม่ผ่านทดลองงาน"
      const resignedThisYear = allEmployees.filter(e => {
        const d = e.resignation_date ? new Date(e.resignation_date) : null
        return d && d.getFullYear() === cy && e.resignation_reason === 'ลาออก'
      }).length
      const newHiresThisYear = allEmployees.filter(e => { const d = e.hire_date ? new Date(e.hire_date) : null; return d && d.getFullYear() === cy }).length
      const endOfYear = employees.length // พนักงานปัจจุบัน = พนักงานปลายปี
      const beginOfYear = endOfYear - newHiresThisYear + resignedThisYear // พนักงานต้นปี
      const avg = (beginOfYear + endOfYear) / 2
      const rate = avg > 0 ? (resignedThisYear / avg) * 100 : 0
      return { rate: Math.round(rate * 10) / 10, resigned: resignedThisYear, beginOfYear, endOfYear }
    })()
  }

  // BU distribution — real data only, no fallbacks
  const buData = (() => {
    const map = {}
    employees.forEach(e => { const bu = e.bu || e.company_entity || 'อื่นๆ'; map[bu] = (map[bu] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, fullName: name, value }))
  })()

  // Department bar chart — real data only
  const deptData = (() => {
    const map = {}
    employees.forEach(e => { const d = e.department || 'N/A'; map[d] = (map[d] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, fullName: name, value }))
  })()

  // Salary distribution by department — real data only
  const salaryByDeptData = (() => {
    const map = {}
    employees.forEach(e => {
      const d = e.department || 'N/A'
      const sal = e.base_salary ? Number(e.base_salary) : 0
      map[d] = (map[d] || 0) + sal
    })
    return Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({
      name: name.length > 18 ? name.slice(0, 18) + '…' : name,
      fullName: name,
      value: Math.round(value / 1000),
      raw: value
    }))
  })()

  // Payroll trend — computed from real salary data
  const payrollTrend = (() => {
    const totalSalary = stats.peopleCost
    if (totalSalary === 0) return []
    const mVal = totalSalary / 1000000
    // Show current month value only (no fake history)
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return [{ name: monthNames[cm] + ' ' + cy, value: Math.round(mVal * 10) / 10 }]
  })()

  if (loading) return <div className="p-6"><LoadingSpinner /></div>

  const activeCount = stats.active
  const totalBU = buData.reduce((s, d) => s + d.value, 0) || activeCount

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
        <p className="text-sm text-gray-500">efin HRIS</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} iconBg="bg-blue-500" label={`พนักงานต้นปี ${cy + 543}`} value={stats.beginYear}
          trend={`+ เข้าใหม่ ${stats.newHires} − ลาออก ${stats.resigned} = ${stats.active} คน`}
          onClick={() => setDetailPopup({ type: 'beginYear', title: `พนักงานต้นปี ${cy + 543}`, icon: Users, iconBg: 'bg-blue-500' })} />
        <KpiCard icon={Users} iconBg="bg-emerald-500" label="พนักงานปัจจุบัน" value={stats.active}
          trend={`เปลี่ยนแปลงสุทธิ ${stats.newHires - stats.resigned >= 0 ? '+' : ''}${stats.newHires - stats.resigned} คน`}
          onClick={() => setDetailPopup({ type: 'active', title: 'พนักงานปัจจุบัน', icon: Users, iconBg: 'bg-emerald-500' })} />
        <KpiCard icon={UserPlus} iconBg="bg-indigo-500" label={`เข้าใหม่ปี ${cy + 543}`} value={stats.newHires}
          onClick={() => setDetailPopup({ type: 'newHires', title: `พนักงานเข้าใหม่ปี ${cy + 543}`, icon: UserPlus, iconBg: 'bg-indigo-500' })} />
        <KpiCard icon={UserMinus} iconBg="bg-red-400" label={`ลาออกปี ${cy + 543}`} value={stats.resigned}
          onClick={() => setDetailPopup({ type: 'resigned', title: `พนักงานลาออกปี ${cy + 543}`, icon: UserMinus, iconBg: 'bg-red-400' })} />
        <KpiCard icon={TrendingUp} iconBg="bg-orange-500" label={`Turnover Rate ${cy + 543}`}
          value={`${stats.turnover.rate}%`}
          trend={`ลาออก ${stats.turnover.resigned} / เฉลี่ย ${Math.round((stats.turnover.beginOfYear + stats.turnover.endOfYear) / 2)} คน`}
          onClick={() => setDetailPopup({ type: 'turnover', title: `Turnover Rate ปี ${cy + 543}`, icon: TrendingUp, iconBg: 'bg-orange-500' })} />
        <KpiCard icon={Briefcase} iconBg="bg-amber-500" label="อายุงานเฉลี่ย"
          value={stats.avgTenure.count > 0 ? `${stats.avgTenure.years} ปี ${stats.avgTenure.months} ด.` : '0'}
          trend={stats.avgTenure.count > 0 ? `จาก ${stats.avgTenure.count} คน` : null}
          onClick={() => setDetailPopup({ type: 'avgTenure', title: 'อายุงานพนักงาน', icon: Briefcase, iconBg: 'bg-amber-500' })} />
        <KpiCard icon={Calendar} iconBg="bg-pink-500" label="อายุพนักงานเฉลี่ย"
          value={stats.avgAge.count > 0 ? `${stats.avgAge.years} ปี` : '0'}
          trend={stats.avgAge.count > 0 ? `จาก ${stats.avgAge.count} คน` : null}
          onClick={() => setDetailPopup({ type: 'avgAge', title: 'อายุพนักงาน', icon: Calendar, iconBg: 'bg-pink-500' })} />
        {canViewSalary && <KpiCard icon={DollarSign} iconBg="bg-violet-500" label="People Cost" value={stats.peopleCost > 0 ? (stats.peopleCost / 1000000).toFixed(1) + 'M' : '0'}
          onClick={() => setDetailPopup({ type: 'salary', title: 'People Cost — เงินเดือนตามแผนก', icon: DollarSign, iconBg: 'bg-violet-500' })} />}
        <KpiCard icon={GraduationCap} iconBg="bg-cyan-500" label="Training Hours" value="0"
          onClick={() => setDetailPopup({ type: 'training', title: 'Training Hours', icon: GraduationCap, iconBg: 'bg-cyan-500' })} />
      </div>

      {/* Row 2: Headcount by BU + Dept Bar + Org */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Headcount by BU */}
        <DashCard title="Headcount by BU">
          {buData.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="w-44 h-44 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={buData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                    {buData.map((_, i) => <Cell key={i} fill={COLORS_BU[i % COLORS_BU.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-900">{totalBU}</span>
                <span className="text-[10px] text-gray-400">พนักงาน</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs flex-1">
              {buData.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS_BU[i % COLORS_BU.length] }} />
                  <span className="text-gray-600 truncate flex-1">{d.fullName || d.name}</span>
                  <span className="font-semibold text-gray-800">{d.value}</span>
                  <span className="text-gray-400">({(d.value / totalBU * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
          ) : (
          <div className="flex items-center justify-center h-44 text-gray-400 text-sm">ไม่มีข้อมูลพนักงาน</div>
          )}
        </DashCard>

        {/* Dept Horizontal Bar Chart */}
        <DashCard title="อัตรากำลังตามฝ่าย">
          {deptData.length > 0 ? (
          <ResponsiveContainer width="100%" height={deptData.length * 28 + 20}>
            <BarChart data={deptData} layout="vertical" barSize={16} margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#ccc" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#ccc" width={130} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, _, p) => [v + ' คน', p.payload.fullName || p.payload.name]} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: '#374151' }} />
            </BarChart>
          </ResponsiveContainer>
          ) : (
          <div className="flex items-center justify-center h-44 text-gray-400 text-sm">ไม่มีข้อมูลพนักงาน</div>
          )}
        </DashCard>

        {/* Mini Org Chart */}
        <DashCard title={`โครงสร้างองค์กร (${buData.length} BU)`}>
          <div className="flex flex-col gap-2 pt-1">
            {buData.map((bu, i) => {
              const colors = ['bg-blue-500','bg-emerald-500','bg-orange-500','bg-purple-500','bg-rose-500','bg-cyan-500','bg-amber-500','bg-indigo-500']
              const pct = employees.length > 0 ? Math.round(bu.value / employees.length * 100) : 0
              return (
                <div key={bu.fullName} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[i % colors.length]}`} />
                  <span className="text-xs text-gray-700 truncate flex-1" title={bu.fullName}>{bu.fullName}</span>
                  <span className="text-xs font-bold text-gray-900 w-8 text-right">{bu.value}</span>
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                    <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{width:`${pct}%`}} />
                  </div>
                  <span className="text-[10px] text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </DashCard>
      </div>

      {/* Row 3: Recruitment + Performance + Training */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recruitment Pipeline */}
        <DashCard title="Recruitment Pipeline">
          <div className="flex items-center justify-between gap-1 mt-2">
            <PipelineStep label="Applied" count={0} color="bg-blue-400" />
            <span className="text-gray-300 text-xs">···</span>
            <PipelineStep label="Screening" count={0} color="bg-cyan-500" />
            <span className="text-gray-300 text-xs">···</span>
            <PipelineStep label="Interview" count={0} color="bg-indigo-500" />
            <span className="text-gray-300 text-xs">···</span>
            <PipelineStep label="Offer" count={0} color="bg-violet-500" />
            <span className="text-gray-300 text-xs">···</span>
            <PipelineStep label="Hired" count={stats.newHires} color="bg-emerald-500" />
          </div>
          <div className="flex items-center justify-between mt-4 text-gray-300">
            <FileText className="w-4 h-4" />
            <Users className="w-4 h-4" />
            <Users className="w-4 h-4" />
            <DollarSign className="w-4 h-4" />
            <UserPlus className="w-4 h-4" />
          </div>
        </DashCard>

        {/* Performance A/B/C */}
        <DashCard title="Performance A/B/C">
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Target className="w-6 h-6 text-gray-300" />
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600">A (ดีเด่น)</span>
                <span className="font-bold text-gray-800 ml-auto">0%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">B (ดี)</span>
                <span className="font-bold text-gray-800 ml-auto">0%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-600">C (ต้องปรับปรุง)</span>
                <span className="font-bold text-gray-800 ml-auto">0%</span>
              </div>
            </div>
          </div>
        </DashCard>

        {/* Training & Development */}
        <DashCard title="Training & Development">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <BookOpen className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <p className="text-[10px] text-gray-500">แผนอบรมปีนี้</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-[10px] text-gray-400">หลักสูตร</p>
            </div>
            <div>
              <Calendar className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-[10px] text-gray-500">จัดแล้ว</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-[10px] text-gray-400">หลักสูตร</p>
            </div>
            <div>
              <Users className="w-5 h-5 mx-auto text-violet-500 mb-1" />
              <p className="text-[10px] text-gray-500">คนเข้าอบรม</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-[10px] text-gray-400">คน</p>
            </div>
            <div>
              <DollarSign className="w-5 h-5 mx-auto text-cyan-500 mb-1" />
              <p className="text-[10px] text-gray-500">งบใช้ไป</p>
              <p className="text-2xl font-bold text-gray-900">0%</p>
              <p className="text-[10px] text-gray-400">ของงบประมาณ</p>
            </div>
          </div>
        </DashCard>
      </div>

      {/* Row 4: Attendance + Action Items + Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance & Leave */}
        <DashCard title="Attendance & Leave">
          <div className="flex items-end justify-between gap-2">
            <AttendanceStat icon={UserMinus} iconColor="bg-red-100 text-red-500" label="ขาดงาน" value="0" unit="ครั้ง" />
            <AttendanceStat icon={Clock} iconColor="bg-amber-100 text-amber-500" label="มาสาย" value="0" unit="ครั้ง" />
            <AttendanceStat icon={Calendar} iconColor="bg-blue-100 text-blue-500" label="ลาป่วย" value="0" unit="วัน" />
            <div className="flex flex-col items-center gap-0.5 pb-0.5">
              <p className="text-[10px] text-gray-500 text-center leading-tight">ลาพักร้อน<br/>คงเหลือเฉลี่ย</p>
              <p className="text-3xl font-bold text-blue-600">0</p>
              <p className="text-[10px] text-gray-400">วัน</p>
            </div>
          </div>
        </DashCard>

        {/* Action Items */}
        <DashCard title="สิ่งที่ต้องติดตาม">
          <div>
            <ActionItem icon={Shield} label="ทดลองงานครบกำหนด" count="0 คน" color="text-gray-400" />
            <ActionItem icon={FileText} label="สัญญาใกล้หมด" count="0 คน" color="text-gray-400" />
            <ActionItem icon={GraduationCap} label="อบรมบังคับยังไม่ครบ" count="0 คน" color="text-gray-400" />
            <ActionItem icon={Briefcase} label="ตำแหน่งเปิดรับเกิน 30 วัน" count="0 ตำแหน่ง" color="text-gray-400" />
          </div>
        </DashCard>

        {/* Payroll Overview — Super User only */}
        {canViewSalary ? (
        <DashCard title="Payroll Overview">
          <div className="flex items-start gap-3 mb-2">
            <div>
              <p className="text-[10px] text-gray-500">ยอดจ่ายเงินเดือน (ล้านบาท)</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.peopleCost > 0 ? (stats.peopleCost / 1000000).toFixed(1) + 'M' : '0'}</p>
            </div>
          </div>
          {payrollTrend.length > 0 && (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={payrollTrend}>
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#ccc" />
              <YAxis tick={{ fontSize: 9 }} stroke="#ccc" />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(v) => v + 'M'} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} label={{ position: 'top', fontSize: 9, fill: '#059669' }} />
            </LineChart>
          </ResponsiveContainer>
          )}
        </DashCard>
        ) : (
        <DashCard title="Payroll Overview">
          <div className="flex items-center justify-center py-8 text-gray-400">
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">เฉพาะ Super User เท่านั้น</p>
            </div>
          </div>
        </DashCard>
        )}
      </div>

      {/* Row 5: Salary Distribution by Department — Super User only */}
      {canViewSalary && (
      <div className="grid grid-cols-1 gap-5">
        <DashCard title="การกระจายเงินเดือนตามแผนก (พันบาท)">
          {salaryByDeptData.length > 0 ? (
          <ResponsiveContainer width="100%" height={salaryByDeptData.length * 36 + 20}>
            <BarChart data={salaryByDeptData} layout="vertical" barSize={20} margin={{ left: 10, right: 50, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="#ccc" tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + 'M' : v + 'K'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#ccc" width={140} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v, _, p) => {
                  const raw = p.payload.raw || v * 1000
                  return [new Intl.NumberFormat('th-TH').format(raw) + ' บาท', p.payload.fullName || p.payload.name]
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]}
                label={{ position: 'right', fontSize: 10, fill: '#6d28d9', formatter: (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'M' : v + 'K' }}
              />
            </BarChart>
          </ResponsiveContainer>
          ) : (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">ไม่มีข้อมูลเงินเดือน</div>
          )}
        </DashCard>
      </div>
      )}

      {/* ===== Detail Popup ===== */}
      {detailPopup && (() => {
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'
        const fmtSalary = (v) => v ? new Intl.NumberFormat('th-TH').format(Number(v)) : '-'
        const fullName = (e) => { let n = `${e.prefix_th || ''}${e.first_name_th || ''} ${e.last_name_th || ''}`.trim() || `${e.first_name_en || ''} ${e.last_name_en || ''}`.trim() || '-'; if (e.nickname) n += ` (${e.nickname})`; return n; }
        const statusBadge = (s) => {
          const cls = s === 'active' ? 'bg-green-100 text-green-700' : s === 'resigned' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
          const txt = s === 'active' ? 'ปัจจุบัน' : s === 'resigned' ? 'ลาออก' : s || '-'
          return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{txt}</span>
        }

        // Common columns
        const baseCols = [
          { label: 'รหัสพนักงาน', key: 'employee_code', render: (e) => e.employee_code || '-' },
          { label: 'ชื่อ-นามสกุล', key: 'name', render: fullName, sortKey: (e) => (e.first_name_th || e.first_name_en || '') },
          { label: 'แผนก', key: 'department', render: (e) => e.department || '-' },
          { label: 'ตำแหน่ง', key: 'position', render: (e) => e.position_th || e.position_en || '-' },
        ]

        let popupData, popupCols

        switch (detailPopup.type) {
          case 'beginYear': {
            // พนักงานต้นปี = คนที่ active ณ ต้นปี (ไม่รวมเข้าใหม่ปีนี้ + รวมลาออกปีนี้)
            const beginYearList = [
              ...employees.filter(e => { const d = e.hire_date ? new Date(e.hire_date) : null; return !(d && d.getFullYear() === cy) }),
              ...allEmployees.filter(e => { const d = e.resignation_date ? new Date(e.resignation_date) : null; return d && d.getFullYear() === cy })
            ]
            popupData = beginYearList
            popupCols = [
              ...baseCols,
              { label: 'สถานะ', key: 'status', render: (e) => statusBadge(e.status) },
              { label: 'บริษัท', key: 'company_entity', render: (e) => e.company_entity || '-' },
              { label: 'วันที่เริ่มงาน', key: 'hire_date', render: (e) => fmtDate(e.hire_date), sortKey: (e) => e.hire_date || '' },
            ]
            detailPopup.title = `พนักงานต้นปี ${cy + 543} (ปัจจุบัน ${stats.active} + ลาออก ${stats.resigned} − เข้าใหม่ ${stats.newHires} = ${stats.beginYear})`
            break
          }
          case 'active':
            popupData = employees
            popupCols = [
              ...baseCols,
              { label: 'บริษัท', key: 'company_entity', render: (e) => e.company_entity || '-' },
              { label: 'วันที่เริ่มงาน', key: 'hire_date', render: (e) => fmtDate(e.hire_date), sortKey: (e) => e.hire_date || '' },
              { label: 'อายุงาน', key: 'tenure', render: (e) => {
                if (!e.hire_date) return '-'
                const hd = new Date(e.hire_date)
                const diff = now - hd
                const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
                const months = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
                return years > 0 ? `${years} ปี ${months} เดือน` : `${months} เดือน`
              }, sortKey: (e) => e.hire_date || 'z' },
            ]
            break
          case 'newHires':
            popupData = allEmployees.filter(e => { const d = e.hire_date ? new Date(e.hire_date) : null; return d && d.getFullYear() === cy })
            popupCols = [
              ...baseCols,
              { label: 'บริษัท', key: 'company_entity', render: (e) => e.company_entity || '-' },
              { label: 'วันที่เริ่มงาน', key: 'hire_date', render: (e) => fmtDate(e.hire_date), sortKey: (e) => e.hire_date || '' },
              { label: 'สถานะ', key: 'status', render: (e) => statusBadge(e.status) },
            ]
            break
          case 'resigned':
            popupData = allEmployees.filter(e => { const d = e.resignation_date ? new Date(e.resignation_date) : null; return d && d.getFullYear() === cy })
            popupCols = [
              ...baseCols,
              { label: 'วันที่ลาออก', key: 'resignation_date', render: (e) => fmtDate(e.resignation_date), sortKey: (e) => e.resignation_date || '' },
              { label: 'เหตุผล', key: 'resignation_reason', render: (e) => e.resignation_reason || '-' },
              { label: 'วันที่เริ่มงาน', key: 'hire_date', render: (e) => fmtDate(e.hire_date), sortKey: (e) => e.hire_date || '' },
            ]
            break
          case 'salary':
            popupData = employees.filter(e => e.base_salary)
            popupCols = [
              ...baseCols,
              { label: 'เงินเดือน (บาท)', key: 'base_salary', render: (e) => fmtSalary(e.base_salary), sortKey: (e) => Number(e.base_salary) || 0 },
              { label: 'บริษัท', key: 'company_entity', render: (e) => e.company_entity || '-' },
              { label: 'วันที่เริ่มงาน', key: 'hire_date', render: (e) => fmtDate(e.hire_date), sortKey: (e) => e.hire_date || '' },
            ]
            break
          case 'turnover': {
            // แสดงเฉพาะ "ลาออก" — ไม่รวมเลิกจ้าง/ไม่ผ่านทดลองงาน
            const resignedList = allEmployees.filter(e => { const d = e.resignation_date ? new Date(e.resignation_date) : null; return d && d.getFullYear() === cy && e.resignation_reason === 'ลาออก' })
            popupData = resignedList.length > 0 ? resignedList : []
            const { beginOfYear: boy, endOfYear: eoy, rate: tRate, resigned: tResigned } = stats.turnover
            const avgHead = Math.round((boy + eoy) / 2)
            popupCols = [
              ...baseCols,
              { label: 'วันที่ลาออก', key: 'resignation_date', render: (e) => fmtDate(e.resignation_date), sortKey: (e) => e.resignation_date || '' },
              { label: 'เหตุผล', key: 'resignation_reason', render: (e) => e.resignation_reason || '-' },
              { label: 'อายุงาน', key: 'tenure', render: (e) => {
                if (!e.hire_date) return '-'
                const hd = new Date(e.hire_date)
                const rd = e.resignation_date ? new Date(e.resignation_date) : now
                const diff = rd - hd
                const yrs = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
                const mos = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
                return yrs > 0 ? `${yrs} ปี ${mos} เดือน` : `${mos} เดือน`
              }, sortKey: (e) => e.hire_date || 'z' },
            ]
            // Override title to include formula details
            detailPopup.title = `Turnover Rate ปี ${cy + 543} — ${tRate}% (ลาออก ${tResigned} คน ÷ เฉลี่ย ${avgHead} คน × 100)`
            break
          }
          case 'avgTenure':
            popupData = employees.filter(e => e.hire_date).map(e => {
              const hd = new Date(e.hire_date)
              const diffMs = now - hd
              const yrs = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000))
              const mos = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
              return { ...e, _tenureYears: yrs, _tenureMonths: mos, _tenureTotal: yrs * 12 + mos }
            })
            popupCols = [
              ...baseCols,
              { label: 'บริษัท', key: 'company_entity', render: (e) => e.company_entity || '-' },
              { label: 'วันที่เริ่มงาน', key: 'hire_date', render: (e) => fmtDate(e.hire_date), sortKey: (e) => e.hire_date || '' },
              { label: 'อายุงาน', key: 'tenure', render: (e) => e._tenureYears > 0 ? `${e._tenureYears} ปี ${e._tenureMonths} เดือน` : `${e._tenureMonths} เดือน`, sortKey: (e) => e._tenureTotal || 0 },
            ]
            break
          case 'avgAge':
            popupData = employees.filter(e => e.date_of_birth).map(e => {
              const bd = new Date(e.date_of_birth)
              const ageYrs = Math.floor((now - bd) / (365.25 * 24 * 60 * 60 * 1000))
              return { ...e, _age: ageYrs }
            })
            popupCols = [
              ...baseCols,
              { label: 'บริษัท', key: 'company_entity', render: (e) => e.company_entity || '-' },
              { label: 'วันเกิด', key: 'date_of_birth', render: (e) => fmtDate(e.date_of_birth), sortKey: (e) => e.date_of_birth || '' },
              { label: 'อายุ (ปี)', key: 'age', render: (e) => e._age + ' ปี', sortKey: (e) => e._age || 0 },
            ]
            break
          case 'training':
            popupData = []
            popupCols = [
              { label: 'ชื่อหลักสูตร', key: 'course' },
              { label: 'ผู้เข้าอบรม', key: 'name' },
              { label: 'ชั่วโมง', key: 'hours' },
              { label: 'วันที่', key: 'date' },
            ]
            break
          default:
            popupData = []
            popupCols = baseCols
        }

        return (
          <DetailPopup
            title={detailPopup.title}
            icon={detailPopup.icon}
            iconBg={detailPopup.iconBg}
            data={popupData}
            columns={popupCols}
            onClose={() => setDetailPopup(null)}
          />
        )
      })()}
    </div>
  )
}
