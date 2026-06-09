import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  CheckSquare,
  Package,
  Shield,
  Calendar,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  X,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompanyFilter } from '../lib/CompanyFilterContext';
import { PageHeader, KPICard, Section, StatusBadge, Avatar } from '../components/PageUI';
import { ImportModal, ImportExportButtons, exportToExcel } from '../components/ImportExport';

// Convert JSONB object {key: true/false} to array [{name, completed}]
const toChecklistArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.entries(obj).map(([name, completed]) => ({ name, completed: !!completed }));
};

// Convert JSONB object {key: "value"} to array [{name, value}]
const toItemArray = (obj) => {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.entries(obj).map(([name, value]) => ({ name, value: typeof value === 'boolean' ? (value ? '✓' : '✗') : value }));
};

const LABELS = {
  en: {
    title: 'Onboarding',
    subtitle: 'Employee onboarding and orientation tracking',
    totalOnboarding: 'Total Onboarding',
    inProgress: 'In Progress',
    completed: 'Completed',
    pending: 'Pending',
    status: 'Status',
    employeeName: 'Employee Name',
    startDate: 'Start Date',
    buddy: 'Buddy',
    checklistProgress: 'Checklist Progress',
    orientationDate: 'Orientation Date',
    filterByStatus: 'Filter by Status',
    allStatuses: 'All Statuses',
    details: 'Onboarding Details',
    employeeInfo: 'Employee Information',
    email: 'Email',
    phone: 'Phone',
    position: 'Position',
    department: 'Department',
    startDateLabel: 'Start Date',
    hireDate: 'Hire Date',
    checklist: 'Checklist',
    equipment: 'Equipment Requested',
    accounts: 'Accounts Created',
    timeline: 'Timeline & Notes',
    probationEndDate: 'Probation End Date',
    orientationScheduled: 'Orientation Scheduled',
    notes: 'Notes',
    closePanel: 'Close',
    noData: 'No onboarding records found',
    loading: 'Loading...',
  },
  th: {
    title: 'การบรรจุใหม่',
    subtitle: 'การติดตามการบรรจุและการปฐมนิเทศพนักงาน',
    totalOnboarding: 'รวมการบรรจุ',
    inProgress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    pending: 'รอดำเนินการ',
    status: 'สถานะ',
    employeeName: 'ชื่อพนักงาน',
    startDate: 'วันเริ่มงาน',
    buddy: 'เพื่อน',
    checklistProgress: 'ความคืบหน้าการติดตาม',
    orientationDate: 'วันปฐมนิเทศ',
    filterByStatus: 'กรองตามสถานะ',
    allStatuses: 'สถานะทั้งหมด',
    details: 'รายละเอียดการบรรจุ',
    employeeInfo: 'ข้อมูลพนักงาน',
    email: 'อีเมล',
    phone: 'โทรศัพท์',
    position: 'ตำแหน่ง',
    department: 'ฝ่าย',
    startDateLabel: 'วันเริ่มงาน',
    hireDate: 'วันจ้าง',
    checklist: 'รายการติดตาม',
    equipment: 'อุปกรณ์ที่ขอ',
    accounts: 'บัญชีที่สร้าง',
    timeline: 'ไทม์ไลน์และหมายเหตุ',
    probationEndDate: 'วันสิ้นสุดการทดลองงาน',
    orientationScheduled: 'ปฐมนิเทศกำหนดการ',
    notes: 'หมายเหตุ',
    closePanel: 'ปิด',
    noData: 'ไม่พบบันทึกการบรรจุ',
    loading: 'กำลังโหลด...',
  },
};

const getLabel = (key, lang) => LABELS[lang]?.[key] || LABELS.en[key];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-[#E6F9F0] text-[#5A9020]',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  completed: CheckCircle,
  cancelled: X,
};

const getStatusLabel = (status, lang) => {
  const labels = {
    en: {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    th: {
      pending: 'รอดำเนินการ',
      in_progress: 'กำลังดำเนินการ',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก',
    },
  };
  return labels[lang]?.[status] || labels.en[status];
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function Onboarding({ lang = 'en' , onNavigate, navContext = {} }) {
  const { filterByCompany } = useCompanyFilter();
  const [onboardings, setOnboardings] = useState([]);
  const [employees, setEmployees] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOnboarding, setSelectedOnboarding] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Fetch onboarding data
  useEffect(() => {
    fetchOnboardings();
  }, []);

  const fetchOnboardings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('hr_onboarding')
        .select(`
          id,
          employee_id,
          start_date,
          buddy_id,
          status,
          checklist,
          equipment_requested,
          accounts_created,
          orientation_date,
          probation_end_date,
          notes,
          created_at
        `)
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;

      setOnboardings(data || []);

      // Fetch employees
      const employeeIds = [...new Set(data?.map(o => o.employee_id) || [])];
      if (employeeIds.length > 0) {
        const { data: empData, error: empError } = await supabase
          .from('hr_employees')
          .select('id, first_name_en, last_name_en, first_name_th, last_name_th, nickname, email, phone, position_th, department_id, company_entity')
          .in('id', employeeIds);

        if (empError) throw empError;

        const empMap = {};
        empData?.forEach(emp => {
          empMap[emp.id] = emp;
        });
        setEmployees(empMap);
      }
    } catch (err) {
      console.error('Error fetching onboarding data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Company-filtered onboardings (employees is an object map)
  const companyFilteredOnboardings = useMemo(() => {
    const empArray = Object.values(employees);
    const filteredEmpIds = new Set(filterByCompany(empArray).map(e => e.id));
    return onboardings.filter(o => filteredEmpIds.has(o.employee_id));
  }, [onboardings, employees, filterByCompany]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const total = companyFilteredOnboardings.length;
    const inProgress = companyFilteredOnboardings.filter(o => o.status === 'in_progress').length;
    const completed = companyFilteredOnboardings.filter(o => o.status === 'completed').length;
    const pending = companyFilteredOnboardings.filter(o => o.status === 'pending').length;

    return { total, inProgress, completed, pending };
  }, [companyFilteredOnboardings]);

  // Filter onboardings
  const filteredOnboardings = useMemo(() => {
    if (filterStatus === 'all') {
      return companyFilteredOnboardings;
    }
    return companyFilteredOnboardings.filter(o => o.status === filterStatus);
  }, [companyFilteredOnboardings, filterStatus]);

  // Get employee name
  const getEmployeeName = (employeeId) => {
    const emp = employees[employeeId];
    if (!emp) return 'Unknown';
    if (lang === 'th' && emp.first_name_th) {
      return `${emp.first_name_th} ${emp.last_name_th}`;
    }
    return `${emp.first_name_en} ${emp.last_name_en}`;
  };

  // Get buddy name
  const getBuddyName = (buddyId) => {
    if (!buddyId) return '-';
    const buddy = employees[buddyId];
    if (!buddy) return 'Unknown';
    if (lang === 'th' && buddy.first_name_th) {
      return `${buddy.first_name_th} ${buddy.last_name_th}${buddy.nickname ? ' (' + buddy.nickname + ')' : ''}`;
    }
    return `${buddy.first_name_en} ${buddy.last_name_en}`;
  };

  const handleRowClick = (onboarding) => {
    setSelectedOnboarding(onboarding);
    setShowDetailPanel(true);
  };

  // Export handler
  const handleExport = () => {
    const columns = [
      { header: getLabel('employeeName', lang), accessor: (row) => getEmployeeName(row.employee_id), width: 20 },
      { header: getLabel('startDate', lang), accessor: 'start_date', width: 15 },
      { header: getLabel('status', lang), accessor: (row) => getStatusLabel(row.status, lang), width: 15 },
      { header: getLabel('buddy', lang), accessor: (row) => getBuddyName(row.buddy_id), width: 20 },
      { header: getLabel('orientationDate', lang), accessor: 'orientation_date', width: 15 },
      { header: getLabel('probationEndDate', lang), accessor: 'probation_end_date', width: 15 },
      { header: getLabel('notes', lang), accessor: 'notes', width: 30 },
    ];

    exportToExcel({
      data: filteredOnboardings,
      columns,
      filename: 'onboarding',
      sheetName: getLabel('title', lang)
    });
  };

  // Import handler - insert into supabase
  const handleImportData = async (mappedData) => {
    try {
      if (mappedData.length === 0) return 0;

      const { data, error: insertError } = await supabase
        .from('hr_onboarding')
        .insert(mappedData)
        .select();

      if (insertError) throw insertError;

      // Refresh the onboarding list
      await fetchOnboardings();

      return data?.length || 0;
    } catch (err) {
      console.error('Error importing onboarding data:', err);
      throw err;
    }
  };

  // Column mappings for import
  const importColumns = [
    {
      header: lang === 'th' ? 'รหัสพนักงาน' : 'Employee ID',
      headerEn: 'Employee ID',
      accessor: 'employee_id',
      dbField: 'employee_id',
      example: '123e4567-e89b-12d3-a456-426614174000',
      transform: (val) => val,
    },
    {
      header: lang === 'th' ? 'วันเริ่มงาน' : 'Start Date',
      headerEn: 'Start Date',
      accessor: 'start_date',
      dbField: 'start_date',
      example: '2026-05-07',
      transform: (val) => val,
    },
    {
      header: lang === 'th' ? 'สถานะ' : 'Status',
      headerEn: 'Status',
      accessor: 'status',
      dbField: 'status',
      example: 'pending',
      transform: (val) => val?.toLowerCase() || 'pending',
    },
    {
      header: lang === 'th' ? 'รหัสเพื่อน' : 'Buddy ID',
      headerEn: 'Buddy ID',
      accessor: 'buddy_id',
      dbField: 'buddy_id',
      example: '123e4567-e89b-12d3-a456-426614174001',
      transform: (val) => val || null,
    },
    {
      header: lang === 'th' ? 'วันปฐมนิเทศ' : 'Orientation Date',
      headerEn: 'Orientation Date',
      accessor: 'orientation_date',
      dbField: 'orientation_date',
      example: '2026-05-08',
      transform: (val) => val || null,
    },
    {
      header: lang === 'th' ? 'วันสิ้นสุดการทดลองงาน' : 'Probation End Date',
      headerEn: 'Probation End Date',
      accessor: 'probation_end_date',
      dbField: 'probation_end_date',
      example: '2026-08-07',
      transform: (val) => val || null,
    },
    {
      header: lang === 'th' ? 'หมายเหตุ' : 'Notes',
      headerEn: 'Notes',
      accessor: 'notes',
      dbField: 'notes',
      example: 'Sample note',
      transform: (val) => val || null,
    },
  ];

  if (loading) {
    return (
      <div className="p-4">
        <PageHeader
          title={getLabel('title', lang)}
          subtitle={getLabel('subtitle', lang)}
          lang={lang}
        />
        <div className="text-center py-12 text-gray-500">
          {getLabel('loading', lang)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Page Header with Import/Export */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex-1">
          <PageHeader
            title={getLabel('title', lang)}
            subtitle={getLabel('subtitle', lang)}
            lang={lang}
          />
        </div>
        <div className="ml-4">
          <ImportExportButtons
            onExport={handleExport}
            onImportClick={() => setShowImport(true)}
            lang={lang}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KPICard
          icon={Users}
          iconBg="bg-[#D0F0C0]"
          iconColor="text-[#7DC242]"
          label={getLabel('totalOnboarding', lang)}
          value={kpis.total}
        />
        <KPICard
          icon={AlertCircle}
          iconBg="bg-[#E6F9F0]"
          iconColor="text-[#7DC242]"
          label={getLabel('inProgress', lang)}
          value={kpis.inProgress}
        />
        <KPICard
          icon={CheckCircle}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label={getLabel('completed', lang)}
          value={kpis.completed}
        />
        <KPICard
          icon={Clock}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          label={getLabel('pending', lang)}
          value={kpis.pending}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getLabel('filterByStatus', lang)}
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7DC242]"
        >
          <option value="all">{getLabel('allStatuses', lang)}</option>
          <option value="pending">{getStatusLabel('pending', lang)}</option>
          <option value="in_progress">{getStatusLabel('in_progress', lang)}</option>
          <option value="completed">{getStatusLabel('completed', lang)}</option>
          <option value="cancelled">{getStatusLabel('cancelled', lang)}</option>
        </select>
      </div>

      {/* Onboarding Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filteredOnboardings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {getLabel('noData', lang)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {getLabel('employeeName', lang)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {getLabel('startDate', lang)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {getLabel('status', lang)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {getLabel('buddy', lang)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {getLabel('checklistProgress', lang)}
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">
                    {getLabel('orientationDate', lang)}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOnboardings.map((onboarding) => {
                  const checklistItems = toChecklistArray(onboarding.checklist);
                  const completedItems = checklistItems.filter(item => item.completed).length;
                  const progress = checklistItems.length > 0 ? `${completedItems}/${checklistItems.length}` : '0/0';
                  const StatusIcon = statusIcons[onboarding.status];

                  return (
                    <tr
                      key={onboarding.id}
                      onClick={() => handleRowClick(onboarding)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {getEmployeeName(onboarding.employee_id)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(onboarding.start_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[onboarding.status]}`}>
                          {StatusIcon && <StatusIcon className="w-3 h-3" />}
                          {getStatusLabel(onboarding.status, lang)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {getBuddyName(onboarding.buddy_id)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <span className="text-[#7DC242] font-medium">{progress}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(onboarding.orientation_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedOnboarding && (
        <DetailPanel
          onboarding={selectedOnboarding}
          employee={employees[selectedOnboarding.employee_id]}
          buddy={employees[selectedOnboarding.buddy_id]}
          lang={lang}
          onClose={() => {
            setShowDetailPanel(false);
            setSelectedOnboarding(null);
          }}
        />
      )}

      {/* Import Modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImportData}
        columns={importColumns}
        tableName={getLabel('title', lang)}
        lang={lang}
      />
    </div>
  );
}

// Detail Panel Component
function DetailPanel({ onboarding, employee, buddy, lang, onClose }) {
  const [expandedSection, setExpandedSection] = useState('employee');

  if (!employee) return null;

  const checklistItems = toChecklistArray(onboarding.checklist);
  const equipmentItems = toItemArray(onboarding.equipment_requested);
  const accountItems = (() => {
    const obj = onboarding.accounts_created;
    if (!obj) return [];
    if (Array.isArray(obj)) return obj;
    return Object.entries(obj).map(([name, created]) => ({ name, created: !!created }));
  })();

  const completedChecklist = checklistItems.filter(item => item.completed).length;
  const totalChecklist = checklistItems.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5A9020] to-[#7DC242] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {getLabel('details', lang)}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-[#5A9020] p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Employee Info Section */}
          <ExpandableSection
            title={getLabel('employeeInfo', lang)}
            icon={User}
            isExpanded={expandedSection === 'employee'}
            onToggle={() => setExpandedSection(expandedSection === 'employee' ? null : 'employee')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow
                label={getLabel('employeeName', lang)}
                value={`${employee.first_name_en} ${employee.last_name_en}`}
              />
              <InfoRow
                label={getLabel('email', lang)}
                value={employee.email || '-'}
              />
              <InfoRow
                label={getLabel('phone', lang)}
                value={employee.phone || '-'}
              />
              <InfoRow
                label={getLabel('position', lang)}
                value={employee.position_th || '-'}
              />
              <InfoRow
                label={getLabel('startDateLabel', lang)}
                value={formatDate(onboarding.start_date)}
              />
              <InfoRow
                label={getLabel('orientationScheduled', lang)}
                value={formatDate(onboarding.orientation_date)}
              />
              <InfoRow
                label={getLabel('buddy', lang)}
                value={buddy ? `${buddy.first_name_en} ${buddy.last_name_en}` : '-'}
              />
              <InfoRow
                label={getLabel('probationEndDate', lang)}
                value={formatDate(onboarding.probation_end_date)}
              />
            </div>
          </ExpandableSection>

          {/* Checklist Section */}
          <ExpandableSection
            title={`${getLabel('checklist', lang)} (${completedChecklist}/${totalChecklist})`}
            icon={CheckSquare}
            isExpanded={expandedSection === 'checklist'}
            onToggle={() => setExpandedSection(expandedSection === 'checklist' ? null : 'checklist')}
          >
            <div className="space-y-2">
              {checklistItems.length === 0 ? (
                <p className="text-gray-500 text-sm">{getLabel('noData', lang)}</p>
              ) : (
                checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      item.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300'
                    }`}>
                      {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className={item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}>
                      {item.title || item.name || `Item ${idx + 1}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ExpandableSection>

          {/* Equipment Section */}
          <ExpandableSection
            title={getLabel('equipment', lang)}
            icon={Package}
            isExpanded={expandedSection === 'equipment'}
            onToggle={() => setExpandedSection(expandedSection === 'equipment' ? null : 'equipment')}
          >
            <div className="space-y-2">
              {equipmentItems.length === 0 ? (
                <p className="text-gray-500 text-sm">{getLabel('noData', lang)}</p>
              ) : (
                equipmentItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{item.name || item.title}</p>
                    {item.status && (
                      <p className="text-xs text-gray-500 mt-1">
                        {getLabel('status', lang)}: <span className="font-medium">{item.status}</span>
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ExpandableSection>

          {/* Accounts Section */}
          <ExpandableSection
            title={getLabel('accounts', lang)}
            icon={Shield}
            isExpanded={expandedSection === 'accounts'}
            onToggle={() => setExpandedSection(expandedSection === 'accounts' ? null : 'accounts')}
          >
            <div className="space-y-2">
              {accountItems.length === 0 ? (
                <p className="text-gray-500 text-sm">{getLabel('noData', lang)}</p>
              ) : (
                accountItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        item.created ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <p className="font-medium text-gray-900">{item.name || item.account_type}</p>
                    </div>
                    {item.username && (
                      <p className="text-xs text-gray-600 mt-1">Username: {item.username}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ExpandableSection>

          {/* Timeline & Notes Section */}
          <ExpandableSection
            title={getLabel('timeline', lang)}
            icon={FileText}
            isExpanded={expandedSection === 'notes'}
            onToggle={() => setExpandedSection(expandedSection === 'notes' ? null : 'notes')}
          >
            <div className="space-y-3">
              {onboarding.notes ? (
                <div className="p-4 bg-[#f0fce8] rounded-lg border border-[#C5E888]">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{onboarding.notes}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{getLabel('noData', lang)}</p>
              )}
              <div className="text-xs text-gray-500">
                <p>Created: {formatDate(onboarding.created_at)}</p>
              </div>
            </div>
          </ExpandableSection>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7DC242] text-white rounded-lg font-medium hover:bg-[#5A9020] transition-colors"
          >
            {getLabel('closePanel', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

// Expandable Section Component
function ExpandableSection({ title, icon: Icon, isExpanded, onToggle, children }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-[#7DC242] flex-shrink-0" />}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && <div className="px-4 py-3 border-t border-gray-100">{children}</div>}
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
