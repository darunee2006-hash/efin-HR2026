import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Users,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  Heart,
  PiggyBank,
  Stethoscope,
  Pill,
  HandHelping,
  MoreVertical,
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useCompanyFilter } from '../lib/CompanyFilterContext';
import {
  PageHeader,
  KPICard,
  Section,
  DetailPanel,
  Avatar,
  StatusBadge,
  ProgressBar,
} from '../components/PageUI';
import { ImportModal, ImportExportButtons, exportToExcel } from '../components/ImportExport';

const WELFARE_CATEGORIES = [
  { id: 'health', name: 'ประกันสุขภาพ', icon: Heart, color: 'bg-red-100', iconColor: 'text-red-600' },
  { id: 'pvd', name: 'กองทุนสำรองเลี้ยงชีพ', icon: PiggyBank, color: 'bg-green-100', iconColor: 'text-green-600' },
  { id: 'medical', name: 'ค่ารักษาพยาบาล', icon: Stethoscope, color: 'bg-[#E6F9F0]', iconColor: 'text-[#7DC242]' },
  { id: 'dental', name: 'ค่าทันตกรรม', icon: Pill, color: 'bg-orange-100', iconColor: 'text-orange-600' },
  { id: 'assistance', name: 'เงินช่วยเหลือ', icon: HandHelping, color: 'bg-purple-100', iconColor: 'text-purple-600' },
  { id: 'other', name: 'สวัสดิการอื่นๆ', icon: MoreVertical, color: 'bg-gray-100', iconColor: 'text-gray-600' },
];

const MOCK_CATEGORIES_DATA = [
  { name: 'ประกันสุขภาพ', uses: 842, amount: 4200000 },
  { name: 'กองทุนสำรองเลี้ยงชีพ', uses: 812, amount: 3850000 },
  { name: 'ค่ารักษาพยาบาล', uses: 748, amount: 3120000 },
  { name: 'ค่าทันตกรรม', uses: 612, amount: 1850000 },
  { name: 'เงินช่วยเหลือ', uses: 465, amount: 2950000 },
  { name: 'สวัสดิการอื่นๆ', uses: 389, amount: 2185000 },
];

const THAI_LABELS = {
  title: 'สวัสดิการ',
  totalBudget: 'งบสวัสดิการรวม',
  usageCount: 'ผู้ใช้สิทธิ์',
  disbursed: 'เบิกจ่ายแล้ว',
  usageRate: 'อัตราการใช้',
  categories: 'หมวดหมู่สวัสดิการ',
  search: 'ค้นหาพนักงาน',
  welfareType: 'ประเภทสวัสดิการ',
  employeeName: 'ชื่อ-นามสกุล',
  department: 'แผนก',
  amount: 'จำนวนเงิน',
  date: 'วันที่',
  status: 'สถานะ',
  summary: 'สรุปการใช้สิทธิ์สวัสดิการ',
  memberInfo: 'ข้อมูลสมาชิก',
  totalClaimed: 'เบิกจ่ายรวม',
  remainingBalance: 'คงเหลือ',
  usageHistory: 'ประวัติการใช้สิทธิ์',
  times: 'ครั้ง',
};

export default function Welfare({ lang = 'th' }) {
  const { filterByCompany } = useCompanyFilter();
  const labels = THAI_LABELS;
  const [employees, setEmployees] = useState([]);
  const [welfareData, setWelfareData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        const { data: empData } = await supabase
          .from('hr_employees')
          .select('id, employee_code, first_name_th, last_name_th, nickname, company_entity, hr_departments(name_th, name_en)')
          .eq('status', 'active');

        const enriched = (empData || []).map(emp => ({
          ...emp,
          department_th: emp.hr_departments?.name_th || '-',
        }));
        setEmployees(enriched);

        // Fetch real welfare records from DB
        const { data: welfareRecords } = await supabase
          .from('hr_welfare_records')
          .select('*, hr_employees(id, employee_code, first_name_th, last_name_th, nickname, company_entity, hr_departments(name_th))')
          .order('created_at', { ascending: false });
        const formatted = (welfareRecords || []).map(r => ({
          id: r.id,
          employee: { ...r.hr_employees, department_th: r.hr_employees?.hr_departments?.name_th || '-' },
          category: r.category,
          amount: r.amount,
          date: r.record_date ? new Date(r.record_date).toLocaleDateString('th-TH') : '-',
          status: r.status || '-',
        }));
        setWelfareData(formatted);
        if (formatted.length > 0) setSelectedEmployee(formatted[0].employee);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // Company-filtered employees and welfare data
  const companyFilteredEmployees = useMemo(() => filterByCompany(employees), [employees, filterByCompany]);
  const companyFilteredWelfareData = useMemo(() => {
    const filteredIds = new Set(companyFilteredEmployees.map(e => e.id));
    return welfareData.filter(r => filteredIds.has(r.employee.id));
  }, [welfareData, companyFilteredEmployees]);

  const filteredWelfareData = companyFilteredWelfareData.filter((record) => {
    const matchesSearch = record.employee.first_name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.last_name_th.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee.employee_code.includes(searchTerm);
    const matchesCategory = !filterCategory || record.category === filterCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => (b.amount || 0) - (a.amount || 0));

  const pieChartData = MOCK_CATEGORIES_DATA.map((cat) => {
    const total = welfareData.filter(r => r.category === cat.name).reduce((s, r) => s + (r.amount || 0), 0);
    return { name: cat.name, value: Math.round(total / 1000) / 1000 };
  }).filter(d => d.value > 0);

  const COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#6b7280'];

  const employeeWelfareTotal = welfareData
    .filter((r) => selectedEmployee && r.employee.id === selectedEmployee.id)
    .reduce((sum, r) => sum + r.amount, 0);

  const employeeBudget = 0; // ตั้งงบประมาณจริงใน database
  const employeeRemaining = employeeBudget > 0 ? employeeBudget - employeeWelfareTotal : null;

  // Export handler
  const handleExport = () => {
    const columns = [
      { header: 'ชื่อ-นามสกุล', accessor: (row) => `${row.employee.first_name_th} ${row.employee.last_name_th}${row.employee.nickname ? ' (' + row.employee.nickname + ')' : ''}` },
      { header: 'รหัสพนักงาน', accessor: 'employee.employee_code' },
      { header: 'แผนก', accessor: 'employee.department_th' },
      { header: 'ประเภทสวัสดิการ', accessor: 'category' },
      { header: 'จำนวนเงิน', accessor: 'amount' },
      { header: 'วันที่', accessor: 'date' },
      { header: 'สถานะ', accessor: 'status' },
    ];
    exportToExcel({
      data: filteredWelfareData,
      columns,
      filename: 'welfare-data',
      sheetName: 'สวัสดิการ',
    });
  };

  // Import handler
  const handleImport = async (mappedData) => {
    try {
      const { data, error } = await supabase
        .from('welfare_records')
        .insert(mappedData);
      if (error) throw error;

      // Refresh welfare data after successful import
      const { data: freshData } = await supabase
        .from('welfare_records')
        .select('*, hr_employees(*)');

      if (freshData) {
        const formattedData = freshData.map(record => ({
          id: record.id,
          employee: record.hr_employees,
          category: record.category,
          amount: record.amount,
          date: record.date,
          status: record.status,
        }));
        setWelfareData(formattedData);
      }
      return mappedData.length;
    } catch (err) {
      console.error('Import error:', err);
      throw err;
    }
  };

  // Column mappings for import
  const importColumns = [
    { header: 'ชื่อ-นามสกุล', dbField: 'employee_name', example: 'สมชาย ใจสวย', width: 20 },
    { header: 'รหัสพนักงาน', dbField: 'employee_code', example: 'EMP001', width: 15 },
    { header: 'ประเภทสวัสดิการ', dbField: 'category', example: 'ประกันสุขภาพ', width: 20 },
    { header: 'จำนวนเงิน', dbField: 'amount', example: '50000', transform: (val) => parseInt(val, 10) || 0, width: 15 },
    { header: 'วันที่', dbField: 'date', example: '01/05/2024', width: 15 },
    { header: 'สถานะ', dbField: 'status', example: 'อนุมัติ', width: 15 },
  ];

  if (loading) {
    return <div className="p-8 text-center">โหลดข้อมูล...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <PageHeader title={labels.title} lang={lang} />
          <ImportExportButtons
            onExport={handleExport}
            onImportClick={() => setShowImport(true)}
            lang={lang}
          />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Wallet}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            label={labels.totalBudget}
            value="฿28.75M"
          />
          <KPICard
            icon={Users}
            iconBg="bg-[#E6F9F0]"
            iconColor="text-[#7DC242]"
            label={labels.usageCount}
            value="842 ครั้ง"
          />
          <KPICard
            icon={CreditCard}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            label={labels.disbursed}
            value="฿1.86M"
          />
          <KPICard
            icon={TrendingUp}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            label={labels.usageRate}
            value="64%"
          />
        </div>

        {/* Welfare Categories */}
        <Section title={labels.categories}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MOCK_CATEGORIES_DATA.map((cat, idx) => {
              const catInfo = WELFARE_CATEGORIES[idx];
              const Icon = catInfo.icon;
              return (
                <div key={catInfo.id} className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#C5E888] transition">
                  <div className={`w-10 h-10 ${catInfo.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${catInfo.iconColor}`} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{cat.name}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{cat.uses}</p>
                  <p className="text-xs text-gray-500">{labels.times}</p>
                  <ProgressBar value={cat.uses} max={850} color="bg-[#7DC242]" className="mt-2" />
                </div>
              );
            })}
          </div>
        </Section>

        {/* Main Content: Table, Chart, Member Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Welfare Usage Table (~50%) */}
          <div className="lg:col-span-2">
            <Section title="ค้นหาพนักงานที่ใช้สิทธิ์สวัสดิการ">
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={labels.search}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7DC242]"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7DC242]"
                  >
                    <option value="">ทั้งหมด</option>
                    {MOCK_CATEGORIES_DATA.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-y border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">ลำดับ</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">{labels.employeeName}</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">{labels.department}</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">{labels.welfareType}</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">{labels.amount}</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">{labels.date}</th>
                        <th className="px-4 py-3 text-center font-medium text-gray-600">{labels.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWelfareData.slice(0, 8).map((record, idx) => (
                        <tr
                          key={record.id}
                          className="border-b border-gray-100 hover:bg-[#f0fce8] cursor-pointer transition"
                          onClick={() => setSelectedEmployee(record.employee)}
                        >
                          <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={record.employee.first_name_th} size="sm" />
                              <span className="font-medium text-gray-900">
                                {record.employee.first_name_th} {record.employee.last_name_th}{record.employee.nickname ? ` (${record.employee.nickname})` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{record.employee.department_th || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">{record.category}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {(record.amount / 1000).toLocaleString('th-TH')}K
                          </td>
                          <td className="px-4 py-3 text-gray-600">{record.date}</td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              status={record.status === 'อนุมัติ' ? 'approved' : record.status === 'เสร็จสิ้น' ? 'completed' : 'pending'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Section>
          </div>

          {/* Right: Chart and Member Details (~50%) */}
          <div className="space-y-5">
            {/* Chart */}
            <Section title={labels.summary}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `฿${value.toFixed(2)}M`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-center text-sm text-gray-600 mt-3">รวมทั้งสิ้น ฿18.45M</p>
            </Section>

            {/* Member Details */}
            {selectedEmployee && (
              <Section title={labels.memberInfo}>
                <div className="space-y-4">
                  {/* Photo & Info */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                    <Avatar name={selectedEmployee.first_name_th} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">
                        {selectedEmployee.first_name_th} {selectedEmployee.last_name_th}{selectedEmployee.nickname ? ` (${selectedEmployee.nickname})` : ''}
                      </p>
                      <p className="text-xs text-gray-500">{selectedEmployee.employee_code}</p>
                      <p className="text-xs text-gray-600 mt-1">{selectedEmployee.department_th || '-'}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium text-gray-600">{labels.totalClaimed}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(employeeWelfareTotal / 1000).toLocaleString('th-TH')}K
                        </p>
                      </div>
                      <ProgressBar value={employeeWelfareTotal} max={employeeBudget} color="bg-orange-500" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-medium text-gray-600">{labels.remainingBalance}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(employeeRemaining / 1000).toLocaleString('th-TH')}K
                        </p>
                      </div>
                      <ProgressBar value={employeeRemaining} max={employeeBudget} color="bg-green-500" />
                    </div>
                  </div>

                  {/* Recent Usage */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 mb-3">{labels.usageHistory}</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {welfareData
                        .filter((r) => r.employee.id === selectedEmployee.id)
                        .slice(0, 5)
                        .map((record, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800">{record.category}</p>
                              <p className="text-xs text-gray-500">{record.date}</p>
                            </div>
                            <p className="text-xs font-bold text-gray-900">
                              {(record.amount / 1000).toLocaleString('th-TH')}K
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* Import Modal */}
        <ImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
          columns={importColumns}
          tableName="welfare_records"
          lang={lang}
        />
      </div>
    </div>
  );
}
