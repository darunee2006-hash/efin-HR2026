// Shared navigation helpers for cross-page linking

// Creates an onClick handler that navigates to Employees page filtered by employee
export const empClickHandler = (onNavigate, empCode, empId) => ({
  onClick: (e) => {
    e.stopPropagation()
    if (onNavigate) onNavigate('employees', { employeeCode: empCode, employeeId: empId })
  },
  style: { cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px' },
  title: 'คลิกดูข้อมูลพนักงาน'
})

// Navigate to StaffList filtered by BU
export const buClickHandler = (onNavigate, bu) => ({
  onClick: (e) => {
    e.stopPropagation()
    if (onNavigate) onNavigate('staffList', { bu })
  },
  style: { cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: '2px' },
  title: `ดูรายชื่อพนักงาน BU ${bu}`
})

// Navigate to Leave page for specific employee
export const leaveClickHandler = (onNavigate, empCode) => ({
  onClick: (e) => {
    e.stopPropagation()
    if (onNavigate) onNavigate('leave', { employeeCode: empCode })
  },
  style: { cursor: 'pointer' }
})
