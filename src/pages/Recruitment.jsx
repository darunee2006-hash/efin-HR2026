import React, { useState, useEffect, useMemo } from 'react';
import { useCompanyFilter } from '../lib/CompanyFilterContext';
import { Briefcase, Users, FileCheck, UserCheck, XCircle, Clock, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PageHeader, KPICard, Section, DetailPanel, StatusBadge } from '../components/PageUI';
import { supabase } from '../lib/supabase';
import { ImportModal, ImportExportButtons, exportToExcel } from '../components/ImportExport';

// Helper: parse notes field to extract key-value pairs
function parseNotes(notes) {
  if (!notes) return {};
  const result = {};
  notes.split(' | ').forEach(part => {
    const idx = part.indexOf(': ');
    if (idx > -1) {
      result[part.substring(0, idx).trim()] = part.substring(idx + 2).trim();
    }
  });
  return result;
}

// Status label mapping
const statusLabels = {
  open: 'เปิดรับ',
  filled: 'ปิดแล้ว',
  cancelled: 'ยกเลิก',
  on_hold: 'รอ',
  draft: 'ร่าง',
};

const statusColors = {
  open: 'bg-green-100 text-green-700',
  filled: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-gray-100 text-gray-500',
};

export default function Recruitment({ lang }) {
  const { filterByCompany, filterByEmployeeCompany } = useCompanyFilter();
  const [showImport, setShowImport] = useState(false);
  const [recruitments, setRecruitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase
        .from('hr_recruitment')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setRecruitments(data);
        if (data.length > 0) setSelectedRow(data[0]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Compute KPIs from real data
  const kpis = useMemo(() => {
    const total = recruitments.length;
    const openItems = recruitments.filter(r => r.status === 'open');
    const filledItems = recruitments.filter(r => r.status === 'filled');
    const cancelledItems = recruitments.filter(r => r.status === 'cancelled');
    const openHeadcount = openItems.reduce((sum, r) => sum + (r.headcount || 0), 0);
    return {
      total,
      open: openItems.length,
      filled: filledItems.length,
      cancelled: cancelledItems.length,
      openHeadcount,
    };
  }, [recruitments]);

  // Group by BU for chart
  const buChartData = useMemo(() => {
    const buMap = {};
    recruitments.forEach(r => {
      const parsed = parseNotes(r.notes);
      const bu = parsed['BU'] || parsed['ฝ่าย'] || 'ไม่ระบุ';
      if (!buMap[bu]) buMap[bu] = { name: bu, open: 0, filled: 0, cancelled: 0 };
      if (r.status === 'open') buMap[bu].open++;
      else if (r.status === 'filled') buMap[bu].filled++;
      else if (r.status === 'cancelled') buMap[bu].cancelled++;
    });
    return Object.values(buMap).sort((a, b) => (b.open + b.filled + b.cancelled) - (a.open + a.filled + a.cancelled));
  }, [recruitments]);

  // Group by ประเภท (เพิ่ม/ทดแทน) for pie chart
  const typeChartData = useMemo(() => {
    const typeMap = {};
    recruitments.forEach(r => {
      const parsed = parseNotes(r.notes);
      const type = parsed['ประเภท'] || 'ไม่ระบุ';
      if (!typeMap[type]) typeMap[type] = { name: type, value: 0 };
      typeMap[type].value++;
    });
    return Object.values(typeMap);
  }, [recruitments]);

  const typeColors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

  // Filtered list
  const filteredRecruitments = useMemo(() => {
    if (filterStatus === 'all') return recruitments;
    return recruitments.filter(r => r.status === filterStatus);
  }, [recruitments, filterStatus]);

  // Export handler
  const handleExport = () => {
    const exportData = recruitments.map(r => {
      const parsed = parseNotes(r.notes);
      return {
        'WAMS': parsed['WAMS'] || '',
        'ตำแหน่ง': r.position_title,
        'BU': parsed['BU'] || '',
        'ฝ่าย': parsed['ฝ่าย'] || '',
        'ประเภท': parsed['ประเภท'] || '',
        'จำนวน': r.headcount,
        'การจ้าง': r.employment_type || '',
        'สถานะ': statusLabels[r.status] || r.status,
        'ผู้รับผิดชอบ': parsed['ผู้รับผิดชอบ'] || '',
        'วันเปิด': r.open_date || '',
      };
    });
    const columns = [
      { header: 'WAMS', accessor: 'WAMS', width: 22 },
      { header: 'ตำแหน่ง', accessor: 'ตำแหน่ง', width: 35 },
      { header: 'BU', accessor: 'BU', width: 14 },
      { header: 'ฝ่าย', accessor: 'ฝ่าย', width: 20 },
      { header: 'ประเภท', accessor: 'ประเภท', width: 10 },
      { header: 'จำนวน', accessor: 'จำนวน', width: 8 },
      { header: 'การจ้าง', accessor: 'การจ้าง', width: 14 },
      { header: 'สถานะ', accessor: 'สถานะ', width: 10 },
      { header: 'ผู้รับผิดชอบ', accessor: 'ผู้รับผิดชอบ', width: 12 },
      { header: 'วันเปิด', accessor: 'วันเปิด', width: 12 },
    ];
    exportToExcel({ data: exportData, columns, filename: 'ข้อมูลการสรรหา', sheetName: 'Recruitment' });
  };

  // Import handler
  const handleImportSubmit = async (mappedData) => {
    try {
      let insertedCount = 0;
      for (const row of mappedData) {
        if (!row.position) continue;
        const insertData = {
          position_title: row.position,
          headcount: row.count || 1,
          status: row.status || 'open',
          employment_type: row.employment_type || null,
          notes: row.notes || null,
        };
        const { error } = await supabase.from('hr_recruitment').insert([insertData]).select();
        if (!error) insertedCount++;
      }
      setShowImport(false);
      // Refresh data
      const { data } = await supabase.from('hr_recruitment').select('*').order('created_at', { ascending: true });
      if (data) setRecruitments(data);
      return insertedCount;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const importColumns = [
    { header: 'ตำแหน่ง', headerEn: 'Position', dbField: 'position', accessor: 'position', example: 'Software Engineer' },
    { header: 'จำนวน', headerEn: 'Count', dbField: 'count', accessor: 'count', example: '1', transform: v => parseInt(v) || 1 },
    { header: 'การจ้าง', headerEn: 'Employment Type', dbField: 'employment_type', accessor: 'employment_type', example: 'พนักงานประจำ' },
    { header: 'สถานะ', headerEn: 'Status', dbField: 'status', accessor: 'status', example: 'open' },
    { header: 'หมายเหตุ', headerEn: 'Notes', dbField: 'notes', accessor: 'notes', example: 'BU: efin.finance | ฝ่าย: IT' },
  ];

  // Selected row parsed details
  const selectedParsed = selectedRow ? parseNotes(selectedRow.notes) : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader title="สรรหา" lang={lang} />
          <ImportExportButtons onExport={handleExport} onImportClick={() => setShowImport(true)} lang={lang} />
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard icon={Briefcase} iconBg="bg-blue-100" iconColor="text-blue-600" label="ตำแหน่งทั้งหมด" value={kpis.total} />
          <KPICard icon={Clock} iconBg="bg-green-100" iconColor="text-green-600" label="เปิดรับอยู่" value={`${kpis.open} (${kpis.openHeadcount} อัตรา)`} />
          <KPICard icon={UserCheck} iconBg="bg-indigo-100" iconColor="text-indigo-600" label="ปิดแล้ว (Filled)" value={kpis.filled} />
          <KPICard icon={XCircle} iconBg="bg-red-100" iconColor="text-red-600" label="ยกเลิก" value={kpis.cancelled} />
          <KPICard icon={Users} iconBg="bg-purple-100" iconColor="text-purple-600" label="อัตราเปิดรับรวม" value={recruitments.reduce((s, r) => s + (r.headcount || 0), 0)} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Charts + Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bar: by BU */}
              <Section title="สรรหาตาม BU">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="open" name="เปิดรับ" fill="#22c55e" stackId="a" />
                      <Bar dataKey="filled" name="ปิดแล้ว" fill="#3b82f6" stackId="a" />
                      <Bar dataKey="cancelled" name="ยกเลิก" fill="#ef4444" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Section>

              {/* Pie: เพิ่ม vs ทดแทน */}
              <Section title="ประเภทการสรรหา">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}>
                        {typeChartData.map((_, i) => (
                          <Cell key={i} fill={typeColors[i % typeColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Section>
            </div>

            {/* Table */}
            <Section title="รายการสรรหาทั้งหมด">
              {/* Filter tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { key: 'all', label: `ทั้งหมด (${recruitments.length})` },
                  { key: 'open', label: `เปิดรับ (${kpis.open})` },
                  { key: 'filled', label: `ปิดแล้ว (${kpis.filled})` },
                  { key: 'cancelled', label: `ยกเลิก (${kpis.cancelled})` },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      filterStatus === tab.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">WAMS</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">ตำแหน่ง</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">ฝ่าย</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-700">อัตรา</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">การจ้าง</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-700">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRecruitments.map((r, idx) => {
                      const parsed = parseNotes(r.notes);
                      const isSelected = selectedRow?.id === r.id;
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRow(r)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="px-3 py-2.5 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2.5 text-gray-600 text-xs font-mono">{parsed['WAMS'] || '-'}</td>
                          <td className="px-3 py-2.5 text-gray-900 font-medium">{r.position_title}</td>
                          <td className="px-3 py-2.5 text-gray-600 text-xs">{parsed['ฝ่าย'] || '-'}</td>
                          <td className="px-3 py-2.5 text-center text-gray-900 font-semibold">{r.headcount}</td>
                          <td className="px-3 py-2.5 text-gray-600 text-xs">{r.employment_type || '-'}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || 'bg-gray-100 text-gray-500'}`}>
                              {statusLabels[r.status] || r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredRecruitments.length === 0 && (
                  <div className="text-center py-8 text-gray-400">ไม่มีข้อมูล</div>
                )}
              </div>
            </Section>
          </div>

          {/* Right Panel: Selected Detail */}
          <DetailPanel>
            <Section title="รายละเอียด">
              {selectedRow ? (
                <div className="space-y-4">
                  {/* Position Title */}
                  <div>
                    <p className="text-lg font-bold text-gray-900">{selectedRow.position_title}</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[selectedRow.status] || ''}`}>
                      {statusLabels[selectedRow.status] || selectedRow.status}
                    </span>
                  </div>

                  {/* Key Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm border-t pt-3">
                    <div>
                      <p className="text-xs text-gray-500">WAMS</p>
                      <p className="text-gray-900 font-mono text-xs">{selectedParsed['WAMS'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">อัตราเปิดรับ</p>
                      <p className="text-gray-900 font-semibold">{selectedRow.headcount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">BU</p>
                      <p className="text-gray-900">{selectedParsed['BU'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ฝ่าย</p>
                      <p className="text-gray-900">{selectedParsed['ฝ่าย'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">ประเภท</p>
                      <p className="text-gray-900">{selectedParsed['ประเภท'] || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">การจ้าง</p>
                      <p className="text-gray-900">{selectedRow.employment_type || '-'}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div>
                      <p className="text-xs text-gray-500">วันเปิดรับ</p>
                      <p className="text-gray-900">{selectedRow.open_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">วันครบกำหนด</p>
                      <p className="text-gray-900">{selectedRow.close_date || '-'}</p>
                    </div>
                    {selectedParsed['ปิดได้'] && (
                      <div>
                        <p className="text-xs text-gray-500">ปิดได้</p>
                        <p className="text-gray-900">{selectedParsed['ปิดได้']}</p>
                      </div>
                    )}
                    {selectedParsed['เริ่มงาน'] && (
                      <div>
                        <p className="text-xs text-gray-500">เริ่มงาน</p>
                        <p className="text-gray-900">{selectedParsed['เริ่มงาน']}</p>
                      </div>
                    )}
                  </div>

                  {/* Responsible */}
                  <div className="text-sm border-t pt-3">
                    <p className="text-xs text-gray-500">ผู้รับผิดชอบ</p>
                    <p className="text-gray-900 font-medium">{selectedParsed['ผู้รับผิดชอบ'] || '-'}</p>
                  </div>

                  {/* Remaining */}
                  {selectedParsed['อัตราคงเหลือ'] && (
                    <div className="text-sm border-t pt-3">
                      <p className="text-xs text-gray-500">อัตราคงเหลือ</p>
                      <p className="text-gray-900 font-semibold text-lg">{selectedParsed['อัตราคงเหลือ']}</p>
                    </div>
                  )}

                  {/* JD Link */}
                  {selectedRow.job_description && selectedRow.job_description.startsWith('http') && (
                    <div className="border-t pt-3">
                      <a
                        href={selectedRow.job_description}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink size={14} />
                        ดู JD
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">เลือกรายการเพื่อดูรายละเอียด</div>
              )}
            </Section>
          </DetailPanel>
        </div>

        {/* Import Modal */}
        <ImportModal
          open={showImport}
          onClose={() => setShowImport(false)}
          onImport={handleImportSubmit}
          columns={importColumns}
          tableName="Recruitment"
          lang={lang}
        />
      </div>
    </div>
  );
}
