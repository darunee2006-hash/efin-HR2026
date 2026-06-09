// ====================================================
// EMAIL NOTIFICATION SERVICE — EFIN HR System
// ====================================================
import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID   = import.meta.env.VITE_EMAILJS_SERVICE_ID   || 'YOUR_SERVICE_ID'
const EMAILJS_TEMPLATE_ID  = import.meta.env.VITE_EMAILJS_TEMPLATE_ID  || 'YOUR_TEMPLATE_ID'
const EMAILJS_PUBLIC_KEY   = import.meta.env.VITE_EMAILJS_PUBLIC_KEY   || 'YOUR_PUBLIC_KEY'
const HR_EMAIL             = import.meta.env.VITE_HR_EMAIL              || 'hr@efinancethai.com'
const APP_URL              = import.meta.env.VITE_APP_URL               || 'https://efin-hr-2026.vercel.app'

async function sendEmail({ toEmail, toName, subject, message, actionUrl = '' }) {
  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      { to_email: toEmail, to_name: toName || toEmail, subject, message, sender_name: 'EFIN HR System', action_url: actionUrl || APP_URL },
      EMAILJS_PUBLIC_KEY
    )
    return { success: true, result }
  } catch (err) {
    console.error('[emailService] error:', err)
    return { success: false, error: err.text || err.message }
  }
}

export async function notifyLeaveRequest({ employee, leaveType, fromDate, toDate, days, reason }) {
  return sendEmail({
    toEmail: HR_EMAIL, toName: 'ทีม HR',
    subject: `[HR] คำขอลา: ${employee.first_name} ${employee.last_name} — ${leaveType}`,
    message: `พนักงาน ${employee.first_name} ${employee.last_name} (${employee.employee_code})\nตำแหน่ง: ${employee.position || '—'}\nฝ่าย: ${employee.department || '—'}\n\nขอลา: ${leaveType}\nวันที่: ${fromDate} ถึง ${toDate} (${days} วัน)\nเหตุผล: ${reason || '—'}`,
    actionUrl: `${APP_URL}/leave`,
  })
}

export async function notifyLeaveApproval({ employee, leaveType, days, approved, approvedBy, note }) {
  const status = approved ? '✅ อนุมัติแล้ว' : '❌ ไม่อนุมัติ'
  return sendEmail({
    toEmail: employee.email, toName: `${employee.first_name} ${employee.last_name}`,
    subject: `[HR] คำขอลาของคุณ: ${status}`,
    message: `เรียน ${employee.first_name}\n\nคำขอลา ${leaveType} จำนวน ${days} วัน\nสถานะ: ${status}\n${!approved ? `เหตุผล: ${note || '—'}\n` : ''}อนุมัติโดย: ${approvedBy || 'HR'}`,
    actionUrl: `${APP_URL}/leave`,
  })
}

export async function notifyNewEmployee({ employee, startDate, managerEmail }) {
  const promises = [sendEmail({
    toEmail: HR_EMAIL, toName: 'ทีม HR',
    subject: `[HR] พนักงานใหม่เริ่มงาน: ${employee.first_name} ${employee.last_name}`,
    message: `พนักงานใหม่เริ่มงานวันที่ ${startDate}\n\nชื่อ: ${employee.first_name} ${employee.last_name}\nรหัส: ${employee.employee_code || '—'}\nตำแหน่ง: ${employee.position || '—'}\nฝ่าย: ${employee.department || '—'}`,
    actionUrl: `${APP_URL}/onboarding`,
  })]
  if (managerEmail) promises.push(sendEmail({
    toEmail: managerEmail, toName: 'หัวหน้าทีม',
    subject: `[HR] แจ้งพนักงานใหม่ในทีม: ${employee.first_name} ${employee.last_name}`,
    message: `มีพนักงานใหม่จะเริ่มงานในทีมของคุณ\n\nชื่อ: ${employee.first_name} ${employee.last_name}\nตำแหน่ง: ${employee.position || '—'}\nวันเริ่มงาน: ${startDate}`,
    actionUrl: `${APP_URL}/employees`,
  }))
  return Promise.all(promises)
}

export async function notifyResignation({ employee, lastWorkDate, reason }) {
  return sendEmail({
    toEmail: HR_EMAIL, toName: 'ทีม HR',
    subject: `[HR] พนักงานยื่นลาออก: ${employee.first_name} ${employee.last_name}`,
    message: `พนักงานยื่นใบลาออก\n\nชื่อ: ${employee.first_name} ${employee.last_name} (${employee.employee_code})\nตำแหน่ง: ${employee.position || '—'}\nวันสุดท้าย: ${lastWorkDate || '—'}\nเหตุผล: ${reason || '—'}`,
    actionUrl: `${APP_URL}/offboarding`,
  })
}

export async function notifyOffboardingComplete({ employee, completedBy }) {
  return sendEmail({
    toEmail: HR_EMAIL, toName: 'ทีม HR',
    subject: `[HR] Offboarding เสร็จสิ้น: ${employee.first_name} ${employee.last_name}`,
    message: `Offboarding checklist เสร็จสมบูรณ์\n\nพนักงาน: ${employee.first_name} ${employee.last_name}\nเสร็จโดย: ${completedBy || 'HR'}`,
    actionUrl: `${APP_URL}/offboarding`,
  })
}

export async function notifyAnnouncement({ recipientEmails, title, content }) {
  return Promise.all(recipientEmails.map(email => sendEmail({
    toEmail: email, toName: '',
    subject: `[EFIN HR] ประกาศ: ${title}`,
    message: `${title}\n\n${content}`,
    actionUrl: `${APP_URL}/announcements`,
  })))
}

export async function notifyDocumentRequest({ employee, docType }) {
  const DOC_LABELS = { employment_cert: 'หนังสือรับรองการทำงาน', leave_form: 'ใบลา', warning_letter: 'ใบเตือน', experience_cert: 'ใบผ่านงาน' }
  return sendEmail({
    toEmail: HR_EMAIL, toName: 'ทีม HR',
    subject: `[HR] คำขอเอกสาร: ${DOC_LABELS[docType] || docType}`,
    message: `พนักงานขอเอกสาร\n\nชื่อ: ${employee.first_name} ${employee.last_name} (${employee.employee_code})\nประเภท: ${DOC_LABELS[docType] || docType}`,
    actionUrl: `${APP_URL}/document-requests`,
  })
}

export async function notifyExpenseRequest({ employee, amount, category, description }) {
  return sendEmail({
    toEmail: HR_EMAIL, toName: 'ทีม HR',
    subject: `[HR] คำขอเบิกค่าใช้จ่าย: ${employee.first_name} — ฿${Number(amount).toLocaleString()}`,
    message: `พนักงานขอเบิกค่าใช้จ่าย\n\nชื่อ: ${employee.first_name} ${employee.last_name}\nหมวด: ${category || '—'}\nจำนวน: ฿${Number(amount).toLocaleString()}\nรายละเอียด: ${description || '—'}`,
    actionUrl: `${APP_URL}/expenses`,
  })
}

export default { notifyLeaveRequest, notifyLeaveApproval, notifyNewEmployee, notifyResignation, notifyOffboardingComplete, notifyAnnouncement, notifyDocumentRequest, notifyExpenseRequest }
