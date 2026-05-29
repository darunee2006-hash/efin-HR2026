import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCompanyFilter } from '../lib/CompanyFilterContext';
import {
  Users,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Search,
  ExternalLink,
  Box,
  DollarSign,
  Calendar,
  FileText,
  User,
  Briefcase,
} from 'lucide-react';
import { exportToExcel, ImportModal, ImportExportButtons } from '../components/ImportExport';

const translations = {
  en: {
    pageTitle: 'Offboarding Management',
    totalCases: 'Total Cases',
    activeCases: 'Active Cases',
    completedCases: 'Completed Cases',
    regrettedTurnover: 'Regretted Turnover',
    filterStatus: 'Filter by Status',
    filterSeparation: 'Filter by Type',
    allStatus: 'All Status',
    allTypes: 'All Types',
    employeeName: 'Employee Name',
    resignationDate: 'Resignation Date',
    lastWorkingDay: 'Last Working Day',
    type: 'Type',
    clearanceProgress: 'Clearance Progress',
    finalPay: 'Final Pay',
    status: 'Status',
    noData: 'No offboarding cases found',
    details: 'Details',
    exitInterview: 'Exit Interview',
    clearanceChecklist: 'Clearance Checklist',
    assetReturn: 'Asset Return',
    financialSummary: 'Financial Summary',
    finalSalary: 'Final Salary',
    severancePay: 'Severance Pay',
    remainingLeavePay: 'Remaining Leave Pay',
    outstandingDebt: 'Outstanding Debt',
    rehireEligible: 'Rehire Eligible',
    yes: 'Yes',
    no: 'No',
    pending: 'Pending',
    inProgress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    resign: 'Resignation',
    terminate: 'Termination',
    retire: 'Retirement',
    endContract: 'End of Contract',
    mutualAgreement: 'Mutual Agreement',
    reason: 'Reason',
    notSpecified: 'Not specified',
    noExitInterview: 'No exit interview data',
    checklistItems: 'Checklist Items',
    assets: 'Assets',
    returned: 'Returned',
    outstanding: 'Outstanding',
    approvedBy: 'Approved By',
    notes: 'Notes',
    close: 'Close',
    search: 'Search by employee name...',
  },
  th: {
    pageTitle: 'การจัดการการออกจากงาน',
    totalCases: 'จำนวนกรณีทั้งหมด',
    activeCases: 'กรณีที่ดำเนินการอยู่',
    completedCases: 'กรณีที่เสร็จสิ้น',
    regrettedTurnover: 'การลาออกที่น่าเสียดาย',
    filterStatus: 'กรองตามสถานะ',
    filterSeparation: 'กรองตามประเภท',
    allStatus: 'ทั้งหมด',
    allTypes: 'ทั้งหมด',
    employeeName: 'ชื่อพนักงาน',
    resignationDate: 'วันส่งใบลาออก',
    lastWorkingDay: 'วันทำงานสุดท้าย',
    type: 'ประเภท',
    clearanceProgress: 'ความคืบหน้าการปลดปล่อย',
    finalPay: 'เงินจ่ายสุดท้าย',
    status: 'สถานะ',
    noData: 'ไม่พบกรณีการออกจากงาน',
    details: 'รายละเอียด',
    exitInterview: 'การสัมภาษณ์ออก',
    clearanceChecklist: 'รายการตรวจสอบการปลดปล่อย',
    assetReturn: 'คืนสินทรัพย์',
    financialSummary: 'สรุปการเงิน',
    finalSalary: 'เงินเดือนสุดท้าย',
    severancePay: 'เบี้ยความเสียหาย',
    remainingLeavePay: 'เงินวันลาคงเหลือ',
    outstandingDebt: 'หนี้ที่ยังค้างชำระ',
    rehireEligible: 'สามารถจ้างใหม่ได้',
    yes: 'ใช่',
    no: 'ไม่',
    pending: 'รอดำเนินการ',
    inProgress: 'ดำเนินการอยู่',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
    resign: 'ลาออก',
    terminate: 'ปลดออก',
    retire: 'เกษียณอายุ',
    endContract: 'สิ้นสุดสัญญา',
    mutualAgreement: 'ตกลงร่วมกัน',
    reason: 'เหตุผล',
    notSpecified: 'ไม่ได้ระบุ',
    noExitInterview: 'ไม่มีข้อมูลการสัมภาษณ์ออก',
    checklistItems: 'รายการตรวจสอบ',
    assets: 'สินทรัพย์',
    returned: 'คืนแล้ว',
    outstanding: 'ยังค้างคืน',
    approvedBy: 'อนุมัติโดย',
    notes: 'หมายเหตุ',
    close: 'ปิด',
    search: 'ค้นหาตามชื่อพนักงาน...',
  },
};

const separationTypeColors = {
  resign: 'bg-blue-100 text-blue-800',
  terminate: 'bg-red-100 text-red-800',
  retire: 'bg-green-100 text-green-800',
  end_contract: 'bg-yellow-100 text-yellow-800',
  mutual: 'bg-purple-100 text-purple-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const KPICard = ({ icon: Icon, label, value, color = 'indigo' }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const DetailPanel = ({ offboarding, employee, lang, onClose }) => {
  const t = translations[lang];

  const getExitInterviewData = () => {
    if (!offboarding.exit_interview) return null;
    return offboarding.exit_interview;
  };

  const getClearanceData = () => {
    if (!offboarding.clearance_checklist) return [];
    return Array.isArray(offboarding.clearance_checklist)
      ? offboarding.clearance_checklist
      : Object.entries(offboarding.clearance_checklist).map(([key, value]) => ({
          item: key,
          status: value,
        }));
  };

  const getAssetReturnData = () => {
    if (!offboarding.assets_returned) return [];
    return Array.isArray(offboarding.assets_returned)
      ? offboarding.assets_returned
      : Object.entries(offboarding.assets_returned).map(([asset, returned]) => ({
          asset,
          returned,
        }));
  };

  const exitData = getExitInterviewData();
  const clearanceData = getClearanceData();
  const assetData = getAssetReturnData();
  const completedItems = clearanceData.filter((c) => c.status === true).length;
  const completedAssets = assetData.filter((a) => a.returned === true).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full h-[90vh] overflow-y-auto rounded-t-2xl shadow-lg">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{`${employee?.first_name_th || ''} ${employee?.last_name_th || ''}`.trim()}{employee?.nickname ? ` (${employee.nickname})` : ''}</h2>
            <p className="text-gray-600 text-sm mt-1">{employee?.employee_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              {t.financialSummary}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm">{t.finalSalary}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {offboarding.final_salary
                    ? `฿${offboarding.final_salary.toLocaleString()}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t.severancePay}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {offboarding.severance_pay
                    ? `฿${offboarding.severance_pay.toLocaleString()}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t.remainingLeavePay}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {offboarding.remaining_leave_pay
                    ? `฿${offboarding.remaining_leave_pay.toLocaleString()}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">{t.outstandingDebt}</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {offboarding.outstanding_debt
                    ? `฿${offboarding.outstanding_debt.toLocaleString()}`
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Exit Interview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              {t.exitInterview}
            </h3>
            {exitData ? (
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">{t.reason}</p>
                  <p className="text-gray-900 mt-1">{exitData.reason || t.notSpecified}</p>
                </div>
                {exitData.feedback && (
                  <div>
                    <p className="text-gray-600 text-sm">Feedback</p>
                    <p className="text-gray-900 mt-1">{exitData.feedback}</p>
                  </div>
                )}
                {exitData.company_positives && (
                  <div>
                    <p className="text-gray-600 text-sm">{lang === 'th' ? 'ข้อดีของบริษัท' : 'Company Positives'}</p>
                    <p className="text-gray-900 mt-1">{exitData.company_positives}</p>
                  </div>
                )}
                {exitData.date && (
                  <div>
                    <p className="text-gray-600 text-sm">{lang === 'th' ? 'วันที่สัมภาษณ์' : 'Date'}</p>
                    <p className="text-gray-900 mt-1">
                      {new Date(exitData.date).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">{t.noExitInterview}</p>
            )}
          </div>

          {/* Clearance Checklist */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              {t.clearanceChecklist}
            </h3>
            {clearanceData.length > 0 ? (
              <>
                <div className="mb-4 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t.checklistItems}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {completedItems}/{clearanceData.length} {t.completed}
                  </span>
                </div>
                <div className="space-y-2">
                  {clearanceData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{item.item}</span>
                      {item.status ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No checklist data</p>
            )}
          </div>

          {/* Asset Return */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Box className="w-5 h-5 text-indigo-600" />
              {t.assetReturn}
            </h3>
            {assetData.length > 0 ? (
              <>
                <div className="mb-4 bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t.assets}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {completedAssets}/{assetData.length} {t.returned}
                  </span>
                </div>
                <div className="space-y-2">
                  {assetData.map((asset, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm text-gray-900">{asset.asset}</span>
                      {asset.returned ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500">No asset data</p>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.completed} Information
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">{t.rehireEligible}</p>
                <p className="text-gray-900 font-medium mt-1">
                  {offboarding.rehire_eligible ? t.yes : t.no}
                </p>
              </div>
              {offboarding.approved_by && (
                <div>
                  <p className="text-gray-600 text-sm">{t.approvedBy}</p>
                  <p className="text-gray-900 font-medium mt-1">{offboarding.approved_by}</p>
                </div>
              )}
              {offboarding.notes && (
                <div>
                  <p className="text-gray-600 text-sm">{t.notes}</p>
                  <p className="text-gray-900 mt-1">{offboarding.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Offboarding({ lang = 'en' }) {
  const { filterByCompany } = useCompanyFilter();
  const t = translations[lang];
  const [offboardings, setOffboardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  // Column mappings for import/export
  const importColumns = [
    {
      header: 'รหัสพนักงาน',
      headerEn: 'Employee Code',
      accessor: 'employee_code',
      dbField: 'employee_code',
      width: 14,
      example: 'EMP001',
    },
    {
      header: 'วันส่งใบลาออก',
      headerEn: 'Resignation Date',
      accessor: 'resignation_date',
      dbField: 'resignation_date',
      width: 16,
      example: '2024-01-15',
      transform: (val) => new Date(val).toISOString().split('T')[0],
    },
    {
      header: 'วันทำงานสุดท้าย',
      headerEn: 'Last Working Day',
      accessor: 'last_working_date',
      dbField: 'last_working_date',
      width: 16,
      example: '2024-02-15',
      transform: (val) => new Date(val).toISOString().split('T')[0],
    },
    {
      header: 'ประเภท',
      headerEn: 'Type',
      accessor: 'separation_type',
      dbField: 'separation_type',
      width: 14,
      example: 'resign',
    },
    {
      header: 'สถานะ',
      headerEn: 'Status',
      accessor: 'status',
      dbField: 'status',
      width: 14,
      example: 'in_progress',
    },
    {
      header: 'เงินเดือนสุดท้าย',
      headerEn: 'Final Salary',
      accessor: 'final_salary',
      dbField: 'final_salary',
      width: 14,
      example: '50000',
      transform: (val) => parseFloat(val),
    },
    {
      header: 'เบี้ยความเสียหาย',
      headerEn: 'Severance Pay',
      accessor: 'severance_pay',
      dbField: 'severance_pay',
      width: 14,
      example: '25000',
      transform: (val) => val ? parseFloat(val) : null,
    },
    {
      header: 'เงินวันลาคงเหลือ',
      headerEn: 'Remaining Leave Pay',
      accessor: 'remaining_leave_pay',
      dbField: 'remaining_leave_pay',
      width: 16,
      example: '10000',
      transform: (val) => val ? parseFloat(val) : null,
    },
    {
      header: 'หนี้ที่ยังค้างชำระ',
      headerEn: 'Outstanding Debt',
      accessor: 'outstanding_debt',
      dbField: 'outstanding_debt',
      width: 16,
      example: '0',
      transform: (val) => val ? parseFloat(val) : null,
    },
    {
      header: 'สามารถจ้างใหม่ได้',
      headerEn: 'Rehire Eligible',
      accessor: 'rehire_eligible',
      dbField: 'rehire_eligible',
      width: 14,
      example: 'true',
      transform: (val) => val === 'true' || val === true,
    },
  ];

  const handleExport = () => {
    const typeMap = {
      resign: t.resign,
      terminate: t.terminate,
      retire: t.retire,
      end_contract: t.endContract,
      mutual: t.mutualAgreement,
    };
    const statusMap = {
      pending: t.pending,
      in_progress: t.inProgress,
      completed: t.completed,
      cancelled: t.cancelled,
    };

    const exportColumns = [
      { header: 'รหัสพนักงาน', accessor: (row) => row.employee_code, width: 14 },
      { header: 'ชื่อพนักงาน', accessor: (row) => `${row.hr_employees?.first_name_th || ''} ${row.hr_employees?.last_name_th || ''}`.trim() + (row.hr_employees?.nickname ? ` (${row.hr_employees.nickname})` : ''), width: 20 },
      { header: 'วันส่งใบลาออก', accessor: (row) => row.resignation_date ? new Date(row.resignation_date).toLocaleDateString('th-TH') : '-', width: 16 },
      { header: 'วันทำงานสุดท้าย', accessor: (row) => row.last_working_date ? new Date(row.last_working_date).toLocaleDateString('th-TH') : '-', width: 16 },
      { header: 'ประเภท', accessor: (row) => typeMap[row.separation_type] || row.separation_type, width: 14 },
      { header: 'สถานะ', accessor: (row) => statusMap[row.status] || row.status, width: 14 },
      { header: 'เงินเดือนสุดท้าย', accessor: (row) => row.final_salary || '-', width: 14 },
      { header: 'เบี้ยความเสียหาย', accessor: (row) => row.severance_pay || '-', width: 14 },
      { header: 'เงินวันลาคงเหลือ', accessor: (row) => row.remaining_leave_pay || '-', width: 16 },
      { header: 'หนี้ที่ยังค้างชำระ', accessor: (row) => row.outstanding_debt || '-', width: 16 },
      { header: 'สามารถจ้างใหม่ได้', accessor: (row) => row.rehire_eligible ? 'ใช่' : 'ไม่', width: 14 },
    ];

    exportToExcel({
      data: offboardings,
      columns: exportColumns,
      filename: 'offboarding_data',
      sheetName: 'Offboardings',
    });
  };

  const handleImport = async (mappedData) => {
    try {
      // Get employee IDs from employee codes
      const employeeCodes = mappedData.map((row) => row.employee_code).filter(Boolean);

      if (employeeCodes.length === 0) {
        throw new Error(lang === 'th' ? 'ไม่พบรหัสพนักงาน' : 'No employee codes found');
      }

      const { data: employees, error: empError } = await supabase
        .from('hr_employees')
        .select('id, employee_code')
        .in('employee_code', employeeCodes);

      if (empError) throw empError;

      const employeeMap = {};
      employees.forEach((emp) => {
        employeeMap[emp.employee_code] = emp.id;
      });

      // Prepare rows for insertion
      const rowsToInsert = mappedData
        .map((row) => {
          const employeeId = employeeMap[row.employee_code];
          if (!employeeId) return null;

          return {
            employee_id: employeeId,
            resignation_date: row.resignation_date,
            last_working_date: row.last_working_date,
            separation_type: row.separation_type,
            status: row.status,
            final_salary: row.final_salary || null,
            severance_pay: row.severance_pay || null,
            remaining_leave_pay: row.remaining_leave_pay || null,
            outstanding_debt: row.outstanding_debt || null,
            rehire_eligible: row.rehire_eligible || false,
          };
        })
        .filter(Boolean);

      if (rowsToInsert.length === 0) {
        throw new Error(lang === 'th' ? 'ไม่พบพนักงานที่ตรงกัน' : 'No matching employees found');
      }

      const { error: insertError } = await supabase
        .from('hr_offboarding')
        .insert(rowsToInsert);

      if (insertError) throw insertError;

      // Refresh the list
      await fetchOffboardings();
      setShowImport(false);

      return rowsToInsert.length;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchOffboardings();
  }, [filterStatus, filterType, searchTerm]);

  const fetchOffboardings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('hr_offboarding')
        .select(
          `
          *,
          hr_employees!hr_offboarding_employee_id_fkey(
            id,
            employee_code,
            first_name_th,
            last_name_th,
            first_name_en,
            last_name_en,
            nickname,
            position_th,
            department_id,
            company_entity
          )
        `
        );

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      if (filterType) {
        query = query.eq('separation_type', filterType);
      }

      query = query.order('last_working_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (searchTerm) {
        filteredData = filteredData.filter((item) => {
          const name = `${item.hr_employees?.first_name_th || ''} ${item.hr_employees?.last_name_th || ''}`.trim();
          return name.toLowerCase().includes(searchTerm.toLowerCase());
        });
      }

      setOffboardings(filteredData);
    } catch (error) {
      console.error('Error fetching offboardings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Company-filtered offboardings
  const companyFilteredOffboardings = useMemo(() => {
    // Extract employee data from joined hr_employees and filter by company
    const empArray = offboardings
      .filter(o => o.hr_employees)
      .map(o => o.hr_employees);
    const filteredEmpIds = new Set(filterByCompany(empArray).map(e => e.id));
    return offboardings.filter(o => o.hr_employees && filteredEmpIds.has(o.hr_employees.id));
  }, [offboardings, filterByCompany]);

  const getKPIData = () => {
    const total = companyFilteredOffboardings.length;
    const active = companyFilteredOffboardings.filter(
      (o) => o.status === 'in_progress' || o.status === 'pending'
    ).length;
    const completed = companyFilteredOffboardings.filter((o) => o.status === 'completed').length;
    const regretted = companyFilteredOffboardings.filter((o) => o.regretted_turnover === true).length;

    return { total, active, completed, regretted };
  };

  const getClearanceProgress = (offboarding) => {
    if (!offboarding.clearance_checklist) {
      // If status is completed, show 100%
      return offboarding.status === 'completed' ? 100 : 0;
    }

    const items = Array.isArray(offboarding.clearance_checklist)
      ? offboarding.clearance_checklist
      : Object.values(offboarding.clearance_checklist);

    if (items.length === 0) return offboarding.status === 'completed' ? 100 : 0;

    const completed = items.filter((item) => item === true || item.status === true).length;
    return Math.round((completed / items.length) * 100);
  };

  const getSeparationTypeLabel = (type) => {
    const typeMap = {
      resign: t.resign,
      terminate: t.terminate,
      retire: t.retire,
      end_contract: t.endContract,
      mutual: t.mutualAgreement,
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: t.pending,
      in_progress: t.inProgress,
      completed: t.completed,
      cancelled: t.cancelled,
    };
    return statusMap[status] || status;
  };

  const kpiData = getKPIData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t.pageTitle}</h1>
            <p className="text-gray-600 mt-2">
              {lang === 'en'
                ? 'Track and manage employee offboarding processes'
                : 'ติดตามและจัดการกระบวนการออกจากงานของพนักงาน'}
            </p>
          </div>
          <ImportExportButtons
            onExport={handleExport}
            onImportClick={() => setShowImport(true)}
            lang={lang}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard icon={Users} label={t.totalCases} value={kpiData.total} />
          <KPICard icon={AlertCircle} label={t.activeCases} value={kpiData.active} />
          <KPICard icon={CheckCircle} label={t.completedCases} value={kpiData.completed} />
          <KPICard
            icon={ExternalLink}
            label={t.regrettedTurnover}
            value={kpiData.regretted}
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.search}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.filterStatus}
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t.allStatus}</option>
                <option value="pending">{t.pending}</option>
                <option value="in_progress">{t.inProgress}</option>
                <option value="completed">{t.completed}</option>
                <option value="cancelled">{t.cancelled}</option>
              </select>
            </div>

            {/* Separation Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.filterSeparation}
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">{t.allTypes}</option>
                <option value="resign">{t.resign}</option>
                <option value="terminate">{t.terminate}</option>
                <option value="retire">{t.retire}</option>
                <option value="end_contract">{t.endContract}</option>
                <option value="mutual">{t.mutualAgreement}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : companyFilteredOffboardings.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">{t.noData}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.employeeName}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.resignationDate}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.lastWorkingDay}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.type}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.clearanceProgress}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.finalPay}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.status}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t.details}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companyFilteredOffboardings.map((offboarding) => (
                    <tr key={offboarding.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {`${offboarding.hr_employees?.first_name_th || ''} ${offboarding.hr_employees?.last_name_th || ''}`.trim()}{offboarding.hr_employees?.nickname ? ` (${offboarding.hr_employees.nickname})` : ''}
                            </p>
                            <p className="text-sm text-gray-600">
                              {offboarding.hr_employees?.employee_code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {offboarding.resignation_date ? new Date(offboarding.resignation_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {offboarding.last_working_date ? new Date(offboarding.last_working_date).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            separationTypeColors[offboarding.separation_type]
                          }`}
                        >
                          {getSeparationTypeLabel(offboarding.separation_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{
                                width: `${getClearanceProgress(offboarding)}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {getClearanceProgress(offboarding)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {offboarding.final_salary
                          ? `฿${offboarding.final_salary.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            statusColors[offboarding.status]
                          }`}
                        >
                          {getStatusLabel(offboarding.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedOffboarding(offboarding);
                            setSelectedEmployee(offboarding.hr_employees);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-medium text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t.details}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        columns={importColumns}
        tableName="Offboarding"
        lang={lang}
      />

      {/* Detail Panel */}
      {selectedOffboarding && selectedEmployee && (
        <DetailPanel
          offboarding={selectedOffboarding}
          employee={selectedEmployee}
          lang={lang}
          onClose={() => {
            setSelectedOffboarding(null);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
}
