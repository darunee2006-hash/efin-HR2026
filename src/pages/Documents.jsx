import React, { useState, useEffect, useMemo } from 'react';
import {
  PageHeader,
  KPICard,
  Section,
  DetailPanel,
  Avatar,
  StatusBadge,
  TabPills,
} from '../components/PageUI';
import {
  FileText,
  FileCheck,
  AlertCircle,
  Clock,
  Download,
  Eye,
  File,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompanyFilter } from '../lib/CompanyFilterContext';

export default function Documents({ lang = 'th' }) {
  const { filterByCompany } = useCompanyFilter();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeTab, setActiveTab] = useState('ใบอนุญาต');
  const [searchTerm, setSearchTerm] = useState('');

  const labels = {
    th: {
      title: 'เอกสาร',
      allDocs: 'เอกสารทั้งหมด',
      important: 'เอกสารสำคัญ',
      pendingReview: 'รอตรวจสอบ',
      expiringSoon: 'ใกล้หมดอายุ',
      tabLicenses: 'ใบอนุญาต',
      tabContracts: 'สัญญาจ้าง',
      tabCerts: 'ใบรับรอง',
      tabOther: 'เอกสารอื่นๆ',
      tabPDPA: 'PDPA Consent',
      number: 'ลำดับ',
      docName: 'ชื่อเอกสาร',
      type: 'ประเภท',
      owner: 'เจ้าของ',
      uploadDate: 'วันที่อัปโหลด',
      expiryDate: 'วันหมดอายุ',
      status: 'สถานะ',
      normal: 'ปกติ',
      expiringSoonLabel: 'ใกล้หมดอายุ',
      expired: 'หมดอายุ',
      pendingReviewLabel: 'รอตรวจสอบ',
      fileInfo: 'ข้อมูลเอกสาร',
      docType: 'ประเภทเอกสาร',
      uploadedBy: 'อัปโหลดโดย',
      fileSize: 'ขนาดไฟล์',
      download: 'ดาวน์โหลด',
      preview: 'ดูตัวอย่าง',
      upcomingExpiry: 'เอกสารที่ใกล้หมดอายุ',
      expiryWarning: 'เอกสารที่ใกล้หมดอายุ',
      daysLeft: 'วันที่เหลือ',
      pdpaTracking: 'การติดตามความยินยอม PDPA',
      employee: 'พนักงาน',
      consentStatus: 'สถานะการยินยอม',
      consentDate: 'วันที่ยินยอม',
      consented: 'ยินยอม',
      pending: 'รอตรวจสอบ',
      search: 'ค้นหาเอกสาร...',
      filter: 'กรอง',
    },
    en: {
      title: 'Documents',
      allDocs: 'Total Documents',
      important: 'Important Docs',
      pendingReview: 'Pending Review',
      expiringSoon: 'Expiring Soon',
      tabLicenses: 'Licenses',
      tabContracts: 'Contracts',
      tabCerts: 'Certificates',
      tabOther: 'Others',
      tabPDPA: 'PDPA Consent',
      number: 'No.',
      docName: 'Document Name',
      type: 'Type',
      owner: 'Owner',
      uploadDate: 'Upload Date',
      expiryDate: 'Expiry Date',
      status: 'Status',
      normal: 'Normal',
      expiringSoonLabel: 'Expiring Soon',
      expired: 'Expired',
      pendingReviewLabel: 'Pending Review',
      fileInfo: 'File Info',
      docType: 'Document Type',
      uploadedBy: 'Uploaded by',
      fileSize: 'File Size',
      download: 'Download',
      preview: 'Preview',
      upcomingExpiry: 'Upcoming Expiry',
      expiryWarning: 'Documents Expiring Soon',
      daysLeft: 'Days Left',
      pdpaTracking: 'PDPA Consent Tracking',
      employee: 'Employee',
      consentStatus: 'Consent Status',
      consentDate: 'Consent Date',
      consented: 'Consented',
      pending: 'Pending',
      search: 'Search documents...',
      filter: 'Filter',
    },
  };

  const t = labels[lang] || labels.th;

  // Fetch employees and documents from DB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: empData, error: empError } = await supabase
          .from('hr_employees')
          .select('id, employee_code, first_name_th, last_name_th, nickname, company_entity')
          .eq('status', 'active');

        if (empError) throw empError;

        const empList = empData || [];
        setEmployees(empList);

        // Fetch real documents from hr_documents table (empty until uploaded)
        const { data: docData } = await supabase
          .from('hr_documents')
          .select('*')
          .order('created_at', { ascending: false });
        setDocuments(docData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Company-filtered employees and documents
  const companyFilteredEmployees = useMemo(() => filterByCompany(employees), [employees, filterByCompany]);
  const companyFilteredDocuments = useMemo(() => {
    const filteredIds = new Set(companyFilteredEmployees.map(e => e.id));
    return documents.filter(d => filteredIds.has(d.owner.id));
  }, [documents, companyFilteredEmployees]);

  // Filter documents by tab and search
  const filteredDocs = companyFilteredDocuments.filter(
    (doc) =>
      doc.tabCategory === activeTab &&
      doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate KPIs
  const kpis = {
    total: companyFilteredDocuments.length,
    important: companyFilteredDocuments.filter((d) => d.status === 'pending').length,
    pendingReview: companyFilteredDocuments.filter((d) => d.status === 'pending').length,
    expiringSoon: companyFilteredDocuments.filter((d) => d.status === 'expiring').length,
  };

  // Get expiring soon docs for right panel
  const expiringDocs = companyFilteredDocuments
    .filter((d) => d.status === 'expiring')
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 5);

  // Get status badge info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'normal':
        return { color: 'bg-green-100 text-green-700', label: t.normal };
      case 'expiring':
        return { color: 'bg-yellow-100 text-yellow-700', label: t.expiringSoonLabel };
      case 'expired':
        return { color: 'bg-red-100 text-red-700', label: t.expired };
      case 'pending':
        return { color: 'bg-orange-100 text-orange-700', label: t.pendingReviewLabel };
      default:
        return { color: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  const tabOptions = [
    { key: 'ใบอนุญาต', label: t.tabLicenses, count: companyFilteredDocuments.filter((d) => d.tabCategory === 'ใบอนุญาต').length },
    { key: 'สัญญาจ้าง', label: t.tabContracts, count: companyFilteredDocuments.filter((d) => d.tabCategory === 'สัญญาจ้าง').length },
    { key: 'ใบรับรอง', label: t.tabCerts, count: companyFilteredDocuments.filter((d) => d.tabCategory === 'ใบรับรอง').length },
    { key: 'เอกสารอื่นๆ', label: t.tabOther, count: companyFilteredDocuments.filter((d) => d.tabCategory === 'เอกสารอื่นๆ').length },
    { key: 'PDPA Consent', label: t.tabPDPA, count: companyFilteredDocuments.filter((d) => d.tabCategory === 'PDPA Consent').length },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7DC242]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <PageHeader title={t.title} lang={lang} />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          icon={FileText}
          iconBg="bg-[#E6F9F0]"
          iconColor="text-[#7DC242]"
          label={t.allDocs}
          value={kpis.total}
        />
        <KPICard
          icon={FileCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          label={t.important}
          value={kpis.important}
        />
        <KPICard
          icon={AlertCircle}
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          label={t.pendingReview}
          value={kpis.pendingReview}
        />
        <KPICard
          icon={Clock}
          iconBg="bg-red-100"
          iconColor="text-red-600"
          label={t.expiringSoon}
          value={kpis.expiringSoon}
        />
      </div>

      {/* Tab Pills */}
      <div>
        <TabPills tabs={tabOptions} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Search and Filter Row */}
      <Section>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7DC242]"
          />
          <button className="px-4 py-2 bg-[#f0fce8] text-[#7DC242] rounded-lg text-sm font-medium hover:bg-[#E6F9F0] transition">
            {t.filter}
          </button>
        </div>
      </Section>

      {/* Main Content: Document List + Right Panel */}
      <div className="flex gap-5">
        {/* Left: Document List (65%) */}
        <div className="flex-1">
          <Section title={`${activeTab} (${filteredDocs.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.number}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.docName}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.type}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.owner}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.uploadDate}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.expiryDate}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      {t.status}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc, idx) => {
                    const statusInfo = getStatusInfo(doc.status);
                    return (
                      <tr
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className="border-b border-gray-50 hover:bg-[#f0fce8] cursor-pointer transition"
                      >
                        <td className="px-4 py-3 text-xs text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 flex items-center gap-2">
                          <File className="w-4 h-4 text-gray-400" />
                          {doc.name}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{doc.type}</td>
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar name={doc.owner.name} size="sm" />
                            <span className="text-gray-900">{doc.owner.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.uploadDate.toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {doc.expiryDate.toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* Right: Detail Panel (35%) */}
        <DetailPanel>
          {/* Selected Document Preview */}
          {selectedDoc && (
            <Section title={t.fileInfo}>
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full h-32 bg-gray-100 rounded-lg">
                  <File className="w-12 h-12 text-gray-400" />
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.docName}</p>
                    <p className="font-semibold text-gray-900">{selectedDoc.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.docType}</p>
                    <p className="text-gray-900">{selectedDoc.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.uploadedBy}</p>
                    <p className="text-gray-900">{selectedDoc.owner.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.fileSize}</p>
                    <p className="text-gray-900">{selectedDoc.fileSize}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t.expiryDate}</p>
                    <p className="text-gray-900">
                      {selectedDoc.expiryDate.toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#7DC242] text-white rounded-lg text-xs font-medium hover:bg-[#5A9020]">
                    <Download className="w-4 h-4" />
                    {t.download}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50">
                    <Eye className="w-4 h-4" />
                    {t.preview}
                  </button>
                </div>
              </div>
            </Section>
          )}

          {/* Expiring Soon List */}
          <Section title={t.upcomingExpiry}>
            <div className="space-y-3">
              {expiringDocs.length > 0 ? (
                expiringDocs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg cursor-pointer hover:bg-yellow-100 transition"
                  >
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{doc.owner.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-medium text-yellow-700">
                        {doc.daysUntilExpiry} {t.daysLeft}
                      </span>
                      <span className="text-xs text-gray-500">
                        {doc.expiryDate.toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">{t.expiringSoon} 0</p>
              )}
            </div>
          </Section>
        </DetailPanel>
      </div>

      {/* Bottom: PDPA Tracking Table */}
      <Section title={t.pdpaTracking}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  {t.employee}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  {t.consentStatus}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  {t.consentDate}
                </th>
              </tr>
            </thead>
            <tbody>
              {companyFilteredEmployees.slice(0, 10).map((emp, idx) => {
                const hasPDPA = companyFilteredDocuments.find(
                  (d) => d.owner.id === emp.id && d.type === 'PDPA Consent'
                );
                const status = hasPDPA ? 'consented' : 'pending';
                const statusColor =
                  status === 'consented'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700';
                return (
                  <tr key={emp.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-900">
                      {emp.first_name_th} {emp.last_name_th}{emp.nickname ? ` (${emp.nickname})` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {status === 'consented' ? t.consented : t.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {hasPDPA
                        ? hasPDPA.uploadDate.toLocaleDateString('th-TH')
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
