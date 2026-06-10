import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { Users, TrendingDown, Building2, Search, ChevronRight, BarChart3, MessageSquare } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const G = { primary:'#7DC242', dark:'#5A9020', light:'#E8F5D0' }
const COLORS = ['#E24B4A','#FF8B00','#1565C0','#7DC242','#6A1B9A','#00838F','#AD1457','#4527A0']
const fmt = n => (n||0).toLocaleString('th-TH')

export default function ExitInterview({ lang, onNavigate }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data: rows } = await supabase.from('hr_exit_interviews').select('*').order('last_working_date',{ascending:false})
      setData(rows||[])
      setLoading(false)
    }
    load()
  }, [])

  const months = useMemo(() => [...new Set(data.map(d=>d.month_label).filter(Boolean))], [data])
  const depts = useMemo(() => [...new Set(data.map(d=>d.department).filter(Boolean))].sort(), [data])

  const filtered = useMemo(() => data.filter(d => {
    if (filterMonth !== 'all' && d.month_label !== filterMonth) return false
    if (filterDept !== 'all' && d.department !== filterDept) return false
    if (search && !`${d.full_name||''} ${d.position||''} ${d.department||''}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [data, filterMonth, filterDept, search])

  // สถิติ
  const byDept = useMemo(() => {
    const m = {}
    filtered.forEach(d => { const k=d.department||'ไม่ระบุ'; m[k]=(m[k]||0)+1 })
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([dept,count])=>({dept,count}))
  }, [filtered])

  const byMonth = useMemo(() => {
    const order = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
    const m = {}
    data.forEach(d => { const k=d.month_label||'?'; m[k]=(m[k]||0)+1 })
    return order.filter(mo=>m[mo]).map(mo=>({month:mo,count:m[mo]}))
  }, [data])

  const MONTH_TH = {'ม.ค.':'ม.ค.','ก.พ.':'ก.พ.','มี.ค.':'มี.ค.','เม.ย.':'เม.ย.','พ.ค.':'พ.ค.','มิ.ย.':'มิ.ย.'}

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{borderColor:G.primary}}/></div>

  return (
    <div className="space-y-5 p-6" style={{background:'#F4F7F5',minHeight:'100%'}}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-red-500"/>Exit Interview 2569
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">สรุปพนักงานลาออกและเหตุผล — รวม {data.length} คน</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'ลาออกทั้งหมด',val:data.length,color:'#C62828',bg:'#FEECEC'},
          {label:'ฝ่ายที่ลาออกมากสุด',val:byDept[0]?.dept?.replace('ฝ่าย','')?.slice(0,12)||'-',color:'#E65100',bg:'#FFF3E0'},
          {label:'เดือนที่ลาออกมาก',val:byMonth.sort((a,b)=>b.count-a.count)[0]?.month||'-',color:'#1565C0',bg:'#E3F2FD'},
          {label:'ลาออกล่าสุด',val:data[0]?.full_name?.split(' ').slice(0,2).join(' ')||'-',color:G.dark,bg:G.light},
        ].map((s,i)=>(
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="text-xs text-gray-400 mb-2">{s.label}</div>
            <div className="text-lg font-bold truncate" style={{color:s.color}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">ลาออกรายเดือน</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={byMonth} margin={{top:0,right:0,left:-20,bottom:0}}>
              <XAxis dataKey="month" tick={{fontSize:11}}/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip/>
              <Bar dataKey="count" name="คน" radius={[4,4,0,0]} fill="#E24B4A"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-semibold text-gray-700 mb-3">ลาออกตามฝ่าย</div>
          <div className="space-y-2">
            {byDept.slice(0,6).map((d,i)=>(
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 truncate" style={{minWidth:130}}>{d.dept.replace('ฝ่าย','')}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{width:`${(d.count/byDept[0].count)*100}%`,background:COLORS[i%COLORS.length]}}/>
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาชื่อ ตำแหน่ง ฝ่าย..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"/>
        </div>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="all">ทุกเดือน</option>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="all">ทุกฝ่าย</option>
          {depts.map(d=><option key={d} value={d}>{d.replace('ฝ่าย','')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase">
          <span className="col-span-1">เดือน</span>
          <span className="col-span-3">ชื่อ</span>
          <span className="col-span-3">ฝ่าย</span>
          <span className="col-span-2">ตำแหน่ง</span>
          <span className="col-span-2">วันสุดท้าย</span>
          <span className="col-span-1 text-right">รายละเอียด</span>
        </div>
        {filtered.map((row,i)=>(
          <div key={row.id} className={`px-4 py-3 border-b border-gray-50 grid grid-cols-12 gap-2 items-center hover:bg-gray-50 cursor-pointer ${i%2===1?'bg-gray-50/30':''}`}
            onClick={()=>setSelected(selected?.id===row.id?null:row)}>
            <span className="col-span-1 text-xs text-gray-500">{row.month_label}</span>
            <div className="col-span-3">
              <div className="text-sm font-medium text-gray-900 truncate">{row.full_name||'-'}</div>
            </div>
            <div className="col-span-3 text-xs text-gray-500 truncate">{(row.department||'-').replace('ฝ่าย','')}</div>
            <div className="col-span-2 text-xs text-gray-500 truncate">{row.position||'-'}</div>
            <div className="col-span-2 text-xs text-gray-400">{row.last_working_date?new Date(row.last_working_date).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}):'-'}</div>
            <div className="col-span-1 flex justify-end">
              <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${selected?.id===row.id?'rotate-90':''}`}/>
            </div>
            {selected?.id===row.id && (
              <div className="col-span-12 mt-1 space-y-2">
                {row.resign_reason && <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <div className="text-xs font-semibold text-red-700 mb-1">เหตุผลลาออก</div>
                  <div className="text-xs text-red-600 leading-relaxed">{row.resign_reason}</div>
                </div>}
                {row.suggestions && <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <div className="text-xs font-semibold text-amber-700 mb-1">ข้อเสนอแนะ</div>
                  <div className="text-xs text-amber-600 leading-relaxed">{row.suggestions}</div>
                </div>}
                {row.company_strengths && <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <div className="text-xs font-semibold text-green-700 mb-1">ข้อดีของบริษัท</div>
                  <div className="text-xs text-green-600 leading-relaxed">{row.company_strengths}</div>
                </div>}
              </div>
            )}
          </div>
        ))}
        <div className="px-4 py-2 text-xs text-gray-400 border-t">แสดง {filtered.length} จาก {data.length} รายการ</div>
      </div>
    </div>
  )
}
