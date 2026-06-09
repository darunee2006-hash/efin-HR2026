import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, Users, UserCheck, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { PageHeader, KPICard, Section, Avatar, StatusBadge } from '../components/PageUI';
import * as XLSX from 'xlsx';

const COMPANIES = [
  { key: 'all', label: 'ทุกบริษัท', en: 'All Companies' },
  { key: 'Online Asset Co., Ltd.', label: 'Online Asset Co., Ltd.', en: 'Online Asset Co., Ltd.' },
  { key: 'EFIN XPERT COMPANY LIMITED', label: 'EFIN XPERT COMPANY LIMITED', en: 'EFIN XPERT COMPANY LIMITED' },
  { key: 'ATESS POWER TECHNOLOGY (THAILAND) CO., LTD.', label: 'ATESS POWER TECHNOLOGY (THAILAND) CO., LTD.', en: 'ATESS POWER TECHNOLOGY (THAILAND) CO., LTD.' },
]

export default function StaffList({ lang, navContext = {}, onNavigate }) {
  const { canViewSalary } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
const [_navApplied, _setNavApplied] = React.useState(false)
  React.useEffect(() => {
    if (navContext?.bu && !_navApplied) { setFilterBU && setFilterBU(navContext.bu); _setNavApplied(true) }
    if (navContext?.company) { setFilterCompany && setFilterCompany(navContext.company) }
  }, [navContext])
  const [filterBU, setFilterBU] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const th = (t, e) => lang === 'th' ? t : e

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('id, employee_code, prefix_th, first_name_th, last_name_th, prefix_en, first_name_en, last_name_en, position_th, company_entity, bu, department_name_th, team_section, status, employment_type, hire_date, gender, email, phone')
        .order('company_entity')
        .order('bu')
        .order('first_name_th')
      if (error) throw error
      setEmployees(data || [])
    } catch (err) {
      console.error('Error fetching employees:', err)
    } finally {
      setLoading(false)
    }
  }

  // Unique BU list for the selected company
  const buList = useMemo(() => {
    const filtered = selectedCompany === 'all' ? employees : employees.filter(e => e.company_entity === selectedCompany)
    const buSet = [...new Set(filtered.map(e => e.bu).filter(Boolean))]
    return buSet.sort()
  }, [employees, selectedCompany])

  // Filtered employees
  const filtered = useMemo(() => {
    return employees.filter(e => {
      const companyMatch = selectedCompany === 'all' || e.company_entity === selectedCompany
      const buMatch = filterBU === 'all' || e.bu === filterBU
      const statusMatch = filterStatus === 'all' || e.status === filterStatus
      const q = searchTerm.toLowerCase()
      const nameMatch = !q ||
        `${e.prefix_th || ''}${e.first_name_th || ''} ${e.last_name_th || ''}`.toLowerCase().includes(q) ||
        `${e.first_name_en || ''} ${e.last_name_en || ''}`.toLowerCase().includes(q) ||
        (e.employee_code || '').toLowerCase().includes(q) ||
        (e.position_th || '').toLowerCase().includes(q) ||
        (e.bu || '').toLowerCase().includes(q)
      return companyMatch && buMatch && statusMatch && nameMatch
    })
  }, [employees, selectedCompany, filterBU, filterStatus, searchTerm])

  // Group by company then BU
  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(e => {
      const co = e.company_entity || 'ไม่ระบุบริษัท'
      const bu = e.bu || 'ไม่ระบุ BU'
      if (!groups[co]) groups[co] = {}
      if (!groups[co][bu]) groups[co][bu] = []
      groups[co][bu].push(e)
    })
    return groups
  }, [filtered])

  // Stats
  const stats = useMemo(() => {
    const base = selectedCompany === 'all' ? employees : employees.filter(e => e.company_entity === selectedCompany)
    return {
      total: base.length,
      active: base.filter(e => e.status === 'active').length,
      companies: [...new Set(employees.map(e => e.company_entity).filter(Boolean))].length,
    }
  }, [employees, selectedCompany])

  const handleExport = () => {
    const rows = filtered.map(e => ({
      'รหัสพนักงาน': e.employee_code,
      'ชื่อ-นามสกุล': `${e.prefix_th || ''}${e.first_name_th || ''} ${e.last_name_th || ''}`.trim(),
      'Name': `${e.prefix_en || ''}${e.first_name_en || ''} ${e.last_name_en || ''}`.trim(),
      'ตำแหน่ง': e.position_th,
      'บริษัท': e.company_entity,
      'BU': e.bu,
      'ฝ่ายงาน': e.department_name_th || '',
      'ฝ่าย': e.team_section,
      'สถานะ': e.status,
      'ประเภท': e.employment_type,
      'วันเริ่มงาน': e.hire_date,
      'อีเมล': e.email,
      'เบอร์โทร': e.phone,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Staff List')
    XLSX.writeFile(wb, `staff_list_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const statusColor = (s) => {
    if (s === 'active') return 'bg-green-100 text-green-700'
    if (s === 'inactive') return 'bg-gray-100 text-gray-500'
    return 'bg-yellow-100 text-yellow-700'
  }

  const companyColor = (co) => {
    if ((co || '').includes('EFIN XPERT')) return 'bg-purple-100 text-purple-700'
    if ((co || '').includes('ATESS')) return 'bg-orange-100 text-orange-700'
    return 'bg-[#E6F9F0] text-[#5A9020]'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#7DC242] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={th('รายชื่อพนักงานแยกตามบริษัท', 'Staff List by Company')}
        subtitle={th(`พนักงานทั้งหมด ${employees.length} คน จาก ${stats.companies} บริษัท`, `${employees.length} employees across ${stats.companies} companies`)}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#7DC242] text-[#5A9020] rounded-lg hover:bg-[#E6F9F0] text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            {th('ส่งออก Excel', 'Export Excel')}
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          icon={Users}
          label={th('พนักงานทั้งหมด', 'Total Employees')}
          value={stats.total}
          iconBg="bg-[#E6F9F0]"
          iconColor="text-[#7DC242]"
        />
        <KPICard
          icon={UserCheck}
          label={th('พนักงานที่ใช้งาน', 'Active Employees')}
          value={stats.active}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <KPICard
          icon={Building2}
          label={th('จำนวนบริษัท', 'Companies')}
          value={stats.companies}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Company Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {COMPANIES.map(co => {
          const count = co.key === 'all'
            ? employees.length
            : employees.filter(e => e.company_entity === co.key).length
          if (co.key !== 'all' && count === 0) return null
          return (
            <button
              key={co.key}
              onClick={() => { setSelectedCompany(co.key); setFilterBU('all') }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors
                ${selectedCompany === co.key
                  ? 'bg-[#7DC242] text-white border-[#7DC242]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#7DC242] hover:text-[#5A9020]'}`}
            >
              {lang === 'th' ? co.label : co.en}
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${selectedCompany === co.key ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={th('ค้นหาชื่อ, รหัส, ตำแหน่ง...', 'Search name, code, position...')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#7DC242]"
          />
        </div>
        {/* BU filter */}
        <select
          value={filterBU}
          onChange={e => setFilterBU(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#7DC242]"
        >
          <option value="all">{th('ทุก BU', 'All BU')}</option>
          {buList.map(bu => <option key={bu} value={bu}>{bu}</option>)}
        </select>
        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#7DC242]"
        >
          <option value="all">{th('ทุกสถานะ', 'All Status')}</option>
          <option value="active">{th('ทำงานอยู่', 'Active')}</option>
          <option value="inactive">{th('ไม่ได้ทำงาน', 'Inactive')}</option>
        </select>
        <span className="text-sm text-gray-400">{th(`พบ ${filtered.length} คน`, `Found ${filtered.length} people`)}</span>
      </div>

      {/* Staff Groups */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-gray-400">{th('ไม่พบข้อมูล', 'No data found')}</div>
      ) : (
        Object.entries(grouped).map(([company, buGroups]) => (
          <div key={company} className="space-y-4">
            {/* Company Header */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${companyColor(company)}`}>
                <Building2 className="inline w-4 h-4 mr-1 -mt-0.5" />
                {company}
              </div>
              <span className="text-sm text-gray-400">
                {Object.values(buGroups).flat().length} {th('คน', 'people')}
              </span>
            </div>

            {/* BU Sub-groups */}
            {Object.entries(buGroups).map(([bu, emps]) => (
              <Section key={bu} title={`${bu} (${emps.length} ${th('คน', 'people')})`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                        <th className="text-left py-2 px-3 font-medium">{th('รหัส', 'Code')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('ชื่อ-นามสกุล', 'Name')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('ตำแหน่ง', 'Position')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('BU', 'BU')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('ฝ่ายงาน', 'Department')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('ประเภท', 'Type')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('สถานะ', 'Status')}</th>
                        <th className="text-left py-2 px-3 font-medium">{th('วันเริ่มงาน', 'Hire Date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emps.map(e => (
                        <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-2 px-3 font-mono text-xs text-gray-500">{e.employee_code}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={`${e.first_name_th || e.first_name_en || ''} ${e.last_name_th || e.last_name_en || ''}`} size="sm" />
                              <div>
                                <div className="font-medium text-gray-800">
                                  {`${e.prefix_th || ''}${e.first_name_th || ''} ${e.last_name_th || ''}`.trim()}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {`${e.prefix_en || ''}${e.first_name_en || ''} ${e.last_name_en || ''}`.trim()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{e.position_th || '-'}</td>
                          <td className="py-2 px-3 text-xs font-medium" style={{color:'#5A9020'}}>{e.bu||'-'}</td>
                          <td className="py-2 px-3 text-gray-500 text-xs max-w-[180px] truncate">{e.department_name_th ? e.department_name_th.replace(/^BU\s+[\w.]+[-–]\s*/,'').trim() : e.team_section||'-'}</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600">
                              {e.employment_type === 'fulltime' ? th('เต็มเวลา', 'Full-time') : th('พาร์ทไทม์', 'Part-time')}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(e.status)}`}>
                              {e.status === 'active' ? th('ทำงาน', 'Active') : th('พ้นสภาพ', 'Inactive')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-500 text-xs">{e.hire_date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            ))}
          </div>
        ))
      )}
    </div>
  )
}
