import { useState, useContext, createContext, useCallback } from 'react'

const SalaryCtx = createContext({ unlocked: false, unlock: () => {}, lock: () => {} })

const SALARY_PIN = '1234'
const fmt = n => n ? Number(n).toLocaleString('th-TH') : '0'
const MASK = '฿ X,XXX,XXX'

export function SalaryProvider({ children }) {
  const [unlocked, setUnlocked] = useState(false)
  const unlock = useCallback(() => setUnlocked(true), [])
  const lock   = useCallback(() => setUnlocked(false), [])
  return <SalaryCtx.Provider value={{ unlocked, unlock, lock }}>{children}</SalaryCtx.Provider>
}

export function useSalary() { return useContext(SalaryCtx) }

// PIN Modal
export function SalaryPinModal({ onClose, onSuccess }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)

  const handleSubmit = () => {
    if (pin === SALARY_PIN) { onSuccess(); onClose() }
    else { setErr(true); setPin('') }
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',borderRadius:16,padding:28,width:300,boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}} onClick={e=>e.stopPropagation()}>
        <div style={{textAlign:'center',marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:8}}>🔒</div>
          <div style={{fontSize:15,fontWeight:500,color:'#1a2e1a'}}>ป้อนรหัสผ่านเพื่อดูเงินเดือน</div>
          <div style={{fontSize:12,color:'#999',marginTop:4}}>ข้อมูลนี้เป็นความลับ</div>
        </div>
        <input
          type="password" value={pin} onChange={e=>{setPin(e.target.value);setErr(false)}}
          onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
          placeholder="รหัสผ่าน" maxLength={10} autoFocus
          style={{width:'100%',padding:'10px 12px',border:`1.5px solid ${err?'#E53935':'#D0D0D0'}`,borderRadius:8,fontSize:14,textAlign:'center',letterSpacing:6,outline:'none',boxSizing:'border-box',marginBottom:8}}
        />
        {err && <div style={{color:'#E53935',fontSize:12,textAlign:'center',marginBottom:8}}>รหัสผ่านไม่ถูกต้อง</div>}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button onClick={onClose} style={{flex:1,padding:'9px',border:'1px solid #DDD',borderRadius:8,background:'#fff',cursor:'pointer',fontSize:13,color:'#666'}}>ยกเลิก</button>
          <button onClick={handleSubmit} style={{flex:1,padding:'9px',border:'none',borderRadius:8,background:'#7DC242',cursor:'pointer',fontSize:13,fontWeight:500,color:'#fff'}}>ยืนยัน</button>
        </div>
      </div>
    </div>
  )
}

// Component แสดงเงินเดือน — masked หรือ real
export function SalaryValue({ value, className, style }) {
  const { unlocked, unlock } = useSalary()
  const [showModal, setShowModal] = useState(false)

  if (!value && value !== 0) return <span style={style} className={className}>—</span>

  if (unlocked) {
    return (
      <span style={{cursor:'pointer',...style}} className={className} title="คลิกเพื่อซ่อน">
        ฿{fmt(value)}
      </span>
    )
  }

  return (
    <>
      <span
        onClick={e=>{ e.stopPropagation(); setShowModal(true) }}
        style={{cursor:'pointer',color:'#999',letterSpacing:1,...style}}
        className={className}
        title="คลิกเพื่อดูเงินเดือน">
        {MASK}
      </span>
      {showModal && <SalaryPinModal onClose={()=>setShowModal(false)} onSuccess={unlock}/>}
    </>
  )
}

// Lock button
export function SalaryLockBtn() {
  const { unlocked, lock } = useSalary()
  if (!unlocked) return null
  return (
    <button onClick={lock} style={{fontSize:11,padding:'3px 8px',border:'1px solid #DDD',borderRadius:6,background:'#fff',cursor:'pointer',color:'#666',display:'flex',alignItems:'center',gap:4}}>
      🔒 ซ่อนเงินเดือน
    </button>
  )
}
