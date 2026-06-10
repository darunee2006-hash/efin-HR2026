import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingDown, Search, ChevronDown, ChevronRight, Users, Building2, Calendar, UserMinus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const G = { primary:'#7DC242', dark:'#5A9020', light:'#E8F5D0', light2:'#C5E888' }

export default function ExitInterview({ lang, onNavigate }) {
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterDept, setFilterDept]   = useState('all')
  const [filterYear, setFilterYear]   = useState('2026')
  const [viewMode, setViewMode]       = useState('month')  // 'month' | 'year'
  const [selected, setSelected]     = useState(null)

  useEffect(() => {
    supabase.from('hr_exit_interviews').select('*').order('last_working_date',{ascending:false})
      .then(({data:rows}) => { setData(rows||[]); setLoading(false) })
  }, [])

  const months = useMemo(() => {
    const order = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
    const found = new Set(data.map(d=>d.month_label).filter(Boolean))
    return order.filter(m=>found.has(m))
  }, [data])

  const depts = useMemo(() =>
    [...new Set(data.map(d=>d.department).filter(Boolean))].sort()
  , [data])

  const years = useMemo(() => {
    const s = new Set(data.map(d => d.last_working_date ? new Date(d.last_working_date).getFullYear()+543 : null).filter(Boolean))
    return [...s].sort().reverse()
  }, [data])

  const filtered = useMemo(() => data.filter(d => {
    // Year filter
    if (filterYear !== 'all') {
      const yr = d.last_working_date ? new Date(d.last_working_date).getFullYear()+543 : null
      if (yr !== parseInt(filterYear)) return false
    }
    if (filterMonth !== 'all' && d.month_label !== filterMonth) return false
    if (filterDept !== 'all' && d.department !== filterDept) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${d.full_name||''} ${d.position||''} ${d.department||''}`.toLowerCase().includes(q)) return false
    }
    return true
  }), [data, filterYear, filterMonth, filterDept, search])

  // Stats for current filtered set
  const filteredByDept = useMemo(() => {
    const m = {}
    filtered.forEach(d => { const k=d.department||'ไม่ระบุ'; m[k]=(m[k]||0)+1 })
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([dept,count])=>({dept,count}))
  }, [filtered])

  const byMonth = useMemo(() => {
    const ALL_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
    const currentMonth = new Date().getMonth() // 0-indexed
    // แสดงตั้งแต่ม.ค.ถึงเดือนปัจจุบัน
    const SHOW_MONTHS = ALL_MONTHS.slice(0, currentMonth + 1)
    const m = {}
    // ใช้ filtered data ที่ผ่าน year/dept filter แล้ว (แต่ไม่ filter month)
    const baseData = data.filter(d => {
      if (filterYear !== 'all') {
        const yr = d.last_working_date ? new Date(d.last_working_date).getFullYear()+543 : null
        if (yr !== parseInt(filterYear)) return false
      }
      if (filterDept !== 'all' && d.department !== filterDept) return false
      return true
    })
    baseData.forEach(d => { if(d.month_label) m[d.month_label]=(m[d.month_label]||0)+1 })
    // แสดงทุกเดือนตั้งแต่ม.ค. รวมถึงเดือนที่ไม่มีข้อมูล (count=0)
    return SHOW_MONTHS.map(mo=>({month:mo, count:m[mo]||0}))
  }, [data, filterYear, filterDept])

  const byDept = useMemo(() => {
    const m = {}
    data.forEach(d => { const k=d.department||'ไม่ระบุ'; m[k]=(m[k]||0)+1 })
    return Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([dept,count])=>({dept,count}))
  }, [data])

  const topDept   = filteredByDept[0]?.dept?.replace('ฝ่าย','') || '-'
  const topMonth  = [...byMonth].sort((a,b)=>b.count-a.count)[0]?.month || '-'

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{borderColor:G.primary}}/>
    </div>
  )

  return (
    <div style={{background:'#F4F7F5',minHeight:'100%',padding:'20px 24px'}}>

      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
          <div style={{width:36,height:36,borderRadius:9,background:'#FEECEC',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <UserMinus style={{width:18,height:18,color:'#C62828'}}/>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:500,color:'#1a2e1a'}}>Exit Interview 2569</div>
            <div style={{fontSize:12,color:'#9AB09A'}}>สรุปพนักงานลาออกและเหตุผล · ปัจจุบัน {filtered.length} จาก {data.length} คน</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          { icon:UserMinus, label:'ลาออก (ที่เลือก)', val:`${filtered.length} คน`, bg:'#FEECEC', ic:'#C62828' },
          { icon:Building2, label:'ฝ่ายที่ลาออกมากสุด', val:topDept.slice(0,14), bg:'#FFF3E0', ic:'#E65100' },
          { icon:Calendar,  label:'เดือนที่มากสุด', val:topMonth, bg:G.light, ic:G.dark },
          { icon:Users,     label:'ลาออกล่าสุด', val:(data[0]?.full_name||'-').split(' ').slice(0,3).join(' '), bg:'#EDE7F6', ic:'#6A1B9A' },
        ].map((s,i)=>(
          <div key={i} style={{background:'#fff',borderRadius:12,border:'0.5px solid #E8EDE8',padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <s.icon style={{width:18,height:18,color:s.ic}}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontSize:11,color:'#9AB09A',marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:15,fontWeight:500,color:'#1a2e1a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        {/* Bar chart by month */}
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E8EDE8',padding:'14px 16px'}}>
          <div style={{fontSize:13,fontWeight:500,color:'#1a2e1a',marginBottom:12}}>ลาออกรายเดือน ปี 2569</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={byMonth} margin={{top:0,right:0,left:-20,bottom:0}}>
              <XAxis dataKey="month" tick={{fontSize:11,fill:'#888'}}/>
              <YAxis tick={{fontSize:11,fill:'#888'}} allowDecimals={false}/>
              <Tooltip contentStyle={{fontSize:12}}/>
              <Bar dataKey="count" name="คน" radius={[4,4,0,0]} fill="#DE350B"/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dept breakdown */}
        <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E8EDE8',padding:'14px 16px'}}>
          <div style={{fontSize:13,fontWeight:500,color:'#1a2e1a',marginBottom:12}}>ลาออกตามฝ่าย</div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {filteredByDept.slice(0,6).map((d,i)=>{
              const pct = Math.round((d.count/(filteredByDept[0]?.count||1))*100)
              const colors = ['#DE350B','#FF8B00','#1565C0',G.primary,'#6A1B9A','#00838F']
              return (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:11,color:'#555',flexShrink:0,width:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.dept.replace('ฝ่าย','')}</span>
                  <div style={{flex:1,height:6,background:'#F0F0F0',borderRadius:3,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:6,background:colors[i%colors.length],borderRadius:3}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:500,color:'#333',width:16,textAlign:'right'}}>{d.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:1,minWidth:200}}>
          <Search style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#AAA'}}/>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ ตำแหน่ง ฝ่าย..."
            style={{width:'100%',padding:'8px 10px 8px 32px',border:'0.5px solid #D0D0D0',borderRadius:9,fontSize:13,background:'#fff',boxSizing:'border-box',outline:'none'}}/>
        </div>
        <select value={filterYear} onChange={e=>{setFilterYear(e.target.value);setFilterMonth('all')}}
          style={{padding:'8px 12px',border:'0.5px solid #D0D0D0',borderRadius:9,fontSize:13,background:'#fff'}}>
          <option value="all">ทุกปี</option>
          {years.map(y=><option key={y} value={y}>ปี {y}</option>)}
        </select>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}
          style={{padding:'8px 12px',border:'0.5px solid #D0D0D0',borderRadius:9,fontSize:13,background:'#fff'}}>
          <option value="all">ทุกเดือน</option>
          {months.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterDept} onChange={e=>setFilterDept(e.target.value)}
          style={{padding:'8px 12px',border:'0.5px solid #D0D0D0',borderRadius:9,fontSize:13,background:'#fff'}}>
          <option value="all">ทุกฝ่าย</option>
          {depts.map(d=><option key={d} value={d}>{d.replace('ฝ่าย','')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{background:'#fff',borderRadius:12,border:'0.5px solid #E8EDE8',overflow:'hidden'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'60px 1fr 1fr 1fr 100px 40px',gap:8,padding:'10px 16px',background:'#F8F9F8',borderBottom:'0.5px solid #E8EDE8',fontSize:11,fontWeight:600,color:'#9AB09A',textTransform:'uppercase',letterSpacing:.3}}>
          <span>เดือน</span><span>ชื่อ-สกุล</span><span>ฝ่าย</span><span>ตำแหน่ง</span><span>วันสุดท้าย</span><span/>
        </div>

        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:40,color:'#CCC',fontSize:14}}>ไม่พบข้อมูล</div>
        ) : filtered.map((row,i)=>(
          <div key={row.id}>
            <div
              onClick={()=>setSelected(selected?.id===row.id ? null : row)}
              style={{display:'grid',gridTemplateColumns:'60px 1fr 1fr 1fr 100px 40px',gap:8,padding:'11px 16px',borderBottom:'0.5px solid #F0F5F0',cursor:'pointer',background:selected?.id===row.id?G.light:i%2===1?'#FAFCFA':'#fff',transition:'background .1s'}}>
              <span style={{fontSize:11,color:'#888'}}>{row.month_label}</span>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:'#1a2e1a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.full_name||'-'}</div>
              </div>
              <div style={{fontSize:12,color:'#666',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(row.department||'-').replace('ฝ่าย','')}</div>
              <div style={{fontSize:12,color:'#666',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.position||'-'}</div>
              <div style={{fontSize:11,color:'#AAA'}}>
                {row.last_working_date ? new Date(row.last_working_date).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'}) : '-'}
              </div>
              <div style={{display:'flex',justifyContent:'center'}}>
                {selected?.id===row.id
                  ? <ChevronDown style={{width:14,height:14,color:G.dark}}/>
                  : <ChevronRight style={{width:14,height:14,color:'#CCC'}}/>}
              </div>
            </div>

            {/* Expanded detail */}
            {selected?.id===row.id && (
              <div style={{padding:'10px 16px 14px',background:G.light,borderBottom:'0.5px solid #C5E888',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                {row.resign_reason && (
                  <div style={{background:'#FEECEC',borderRadius:10,padding:'10px 12px',border:'0.5px solid #FFCDD2'}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#C62828',marginBottom:5,display:'flex',alignItems:'center',gap:4}}>
                      <span>🔴</span> เหตุผลลาออก
                    </div>
                    <div style={{fontSize:11,color:'#555',lineHeight:1.6}}>{row.resign_reason}</div>
                  </div>
                )}
                {row.suggestions && (
                  <div style={{background:'#FFF8E1',borderRadius:10,padding:'10px 12px',border:'0.5px solid #FFE082'}}>
                    <div style={{fontSize:11,fontWeight:600,color:'#E65100',marginBottom:5,display:'flex',alignItems:'center',gap:4}}>
                      <span>🟡</span> ข้อเสนอแนะ
                    </div>
                    <div style={{fontSize:11,color:'#555',lineHeight:1.6}}>{row.suggestions}</div>
                  </div>
                )}
                {row.company_strengths && (
                  <div style={{background:G.light,borderRadius:10,padding:'10px 12px',border:`0.5px solid ${G.light2}`}}>
                    <div style={{fontSize:11,fontWeight:600,color:G.dark,marginBottom:5,display:'flex',alignItems:'center',gap:4}}>
                      <span>🟢</span> ข้อดีของบริษัท
                    </div>
                    <div style={{fontSize:11,color:'#555',lineHeight:1.6}}>{row.company_strengths}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div style={{padding:'8px 16px',fontSize:11,color:'#BBB',borderTop:'0.5px solid #F0F0F0'}}>
          แสดง {filtered.length} จาก {data.length} รายการ
        </div>
      </div>
    </div>
  )
}
