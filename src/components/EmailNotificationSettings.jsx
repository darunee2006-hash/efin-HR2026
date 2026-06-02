import { useState } from 'react'

export default function EmailNotificationSettings() {
  const [config, setConfig] = useState({
    serviceId:   localStorage.getItem('emailjs_service_id')   || '',
    templateId:  localStorage.getItem('emailjs_template_id')  || '',
    publicKey:   localStorage.getItem('emailjs_public_key')   || '',
    hrEmail:     localStorage.getItem('emailjs_hr_email')     || 'hr@efinancethai.com',
    appUrl:      localStorage.getItem('emailjs_app_url')      || 'https://efin-hr-2026.vercel.app',
  })
  const [testEmail, setTestEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  function handleSave() {
    localStorage.setItem('emailjs_service_id',  config.serviceId)
    localStorage.setItem('emailjs_template_id', config.templateId)
    localStorage.setItem('emailjs_public_key',  config.publicKey)
    localStorage.setItem('emailjs_hr_email',    config.hrEmail)
    localStorage.setItem('emailjs_app_url',     config.appUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleTest() {
    if (!testEmail) return
    setTesting(true)
    setTestResult(null)
    try {
      const emailjs = (await import('@emailjs/browser')).default
      const result = await emailjs.send(
        config.serviceId, config.templateId,
        { to_email: testEmail, to_name: 'ทดสอบระบบ', subject: '[EFIN HR] ทดสอบการแจ้งเตือนอีเมล', message: 'อีเมลนี้เป็นการทดสอบระบบแจ้งเตือน EFIN HR System ทำงานปกติ ✅', sender_name: 'EFIN HR System', action_url: config.appUrl },
        config.publicKey
      )
      setTestResult({ success: true, msg: `ส่งสำเร็จ! (status: ${result.status})` })
    } catch (err) {
      setTestResult({ success: false, msg: `ส่งไม่สำเร็จ: ${err.text || err.message}` })
    }
    setTesting(false)
  }

  const fields = [
    { key: 'serviceId',  label: 'EmailJS Service ID',  placeholder: 'service_xxxxxxx' },
    { key: 'templateId', label: 'EmailJS Template ID', placeholder: 'template_xxxxxxx' },
    { key: 'publicKey',  label: 'EmailJS Public Key',  placeholder: 'xxxxxxxxxxxxxxxxxxx' },
    { key: 'hrEmail',    label: 'HR Email (รับแจ้งเตือน)', placeholder: 'hr@efinancethai.com' },
    { key: 'appUrl',     label: 'App URL', placeholder: 'https://efin-hr-2026.vercel.app' },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">📧</span>
        <div>
          <h3 className="font-semibold text-gray-900">ตั้งค่า Email Notification</h3>
          <p className="text-sm text-gray-500">ใช้ EmailJS (ฟรี 200 อีเมล/เดือน) สมัครได้ที่ emailjs.com</p>
        </div>
      </div>
      <div className="space-y-3 mb-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
            <input type={f.key === 'publicKey' ? 'password' : 'text'} value={config[f.key]}
              onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-5">
        <button onClick={handleSave} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          {saved ? '✅ บันทึกแล้ว' : 'บันทึกการตั้งค่า'}
        </button>
      </div>
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">ทดสอบส่งอีเมล</h4>
        <div className="flex gap-2">
          <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
            placeholder="อีเมลปลายทางทดสอบ"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button onClick={handleTest} disabled={testing || !testEmail || !config.serviceId}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors">
            {testing ? '⏳ ส่ง...' : '📤 ทดสอบ'}
          </button>
        </div>
        {testResult && (
          <p className={`mt-2 text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>{testResult.msg}</p>
        )}
      </div>
      <div className="mt-5 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-xs font-semibold text-blue-800 mb-2">📌 วิธีตั้งค่า EmailJS</h4>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>สมัครที่ <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="underline">emailjs.com</a> (ฟรี)</li>
          <li>สร้าง Email Service → copy Service ID</li>
          <li>สร้าง Template → ใส่ {'{{to_email}}'} {'{{subject}}'} {'{{message}}'} → copy Template ID</li>
          <li>Account → copy Public Key</li>
          <li>ใส่ค่าด้านบนแล้วกด บันทึก</li>
        </ol>
      </div>
    </div>
  )
}
