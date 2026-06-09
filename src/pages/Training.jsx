import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCompanyFilter } from '../lib/CompanyFilterContext';
import { PageHeader, KPICard, Section, DetailPanel, ProgressBar } from '../components/PageUI';
import { exportToExcel, ImportModal, ImportExportButtons } from '../components/ImportExport';
import { BookOpen, CheckCircle, Users, Clock, Wallet, Plus, X, Save, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── helpers ────────────────────────────────────────────────
const T = (lang, th, en) => lang === 'th' ? th : en;

const STATUS_COLOR = {
  completed:   'bg-green-100 text-green-700',
  ongoing:     'bg-[#E6F9F0] text-[#5A9020]',
  registering: 'bg-yellow-100 text-yellow-700',
  cancelled:   'bg-red-100 text-red-700',
};
const STATUS_LABEL = {
  completed:   { th: 'เสร็จสิ้น',        en: 'Completed' },
  ongoing:     { th: 'กำลังดำเนินการ',   en: 'Ongoing' },
  registering: { th: 'เปิดรับสมัคร',     en: 'Registering' },
  cancelled:   { th: 'ยกเลิก',           en: 'Cancelled' },
};
const CATEGORIES = ['Technical', 'Soft Skills', 'Leadership', 'Compliance', 'Digital'];
const CAT_LABEL = {
  Technical:    { th: 'เทคนิค',       en: 'Technical' },
  'Soft Skills':{ th: 'ทักษะปรับตัว', en: 'Soft Skills' },
  Leadership:   { th: 'ภาวะผู้นำ',    en: 'Leadership' },
  Compliance:   { th: 'กฎระเบียบ',   en: 'Compliance' },
  Digital:      { th: 'ดิจิทัล',      en: 'Digital' },
};
const CAT_COLOR = {
  Technical:    'bg-[#E6F9F0] text-[#5A9020]',
  'Soft Skills':'bg-pink-100 text-pink-700',
  Leadership:   'bg-purple-100 text-purple-700',
  Compliance:   'bg-orange-100 text-orange-700',
  Digital:      'bg-teal-100 text-teal-700',
};
const fmtBudget = (n) => n >= 1000000
  ? (n / 1000000).toFixed(2).replace(/\.?0+$/, '') + 'M'
  : n.toLocaleString('th-TH');

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Add / Edit Modal ────────────────────────────────────────
function TrainingModal({ open, onClose, onSaved, lang }) {
  const blank = {
    course_name: '', category: 'Technical', start_date: '', end_date: '',
    hours: '', participants_count: '', budget: '', status: 'registering', notes: '',
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (open) { setForm(blank); setError(''); } }, [open]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.course_name || !form.start_date || !form.end_date) {
      setError(T(lang, 'กรุณากรอก ชื่อหลักสูตร วันเริ่ม และวันสิ้นสุด', 'Please fill Course Name, Start Date, and End Date'));
      return;
    }
    setSaving(true); setError('');
    try {
      // upsert course into hr_training_courses
      let courseId = null;
      const { data: existing } = await supabase
        .from('hr_training_courses')
        .select('id')
        .eq('name_en', form.course_name)
        .maybeSingle();

      if (existing) {
        courseId = existing.id;
      } else {
        const { data: inserted, error: cErr } = await supabase
          .from('hr_training_courses')
          .insert({ name_th: form.course_name, name_en: form.course_name, category: form.category, duration_hours: Number(form.hours) || 0, is_active: true })
          .select('id')
          .single();
        if (cErr) throw cErr;
        courseId = inserted.id;
      }

      const { error: sErr } = await supabase.from('hr_training').insert({
        course_id:         courseId,
        course_name:       form.course_name,
        start_date:        form.start_date,
        end_date:          form.end_date,
        hours:             Number(form.hours) || 0,
        participants_count:Number(form.participants_count) || 0,
        budget:            Number(form.budget) || 0,
        status:            form.status,
        notes:             form.notes || null,
      });
      if (sErr) throw sErr;
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#7DC242]" />
            {T(lang, 'เพิ่มหลักสูตรฝึกอบรม', 'Add Training Course')}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {error && <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'ชื่อหลักสูตร','Course Name')} <span className="text-red-500">*</span></label>
            <input type="text" value={form.course_name} onChange={e => set('course_name', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'ประเภท','Category')}</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'สถานะ','Status')}</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v[lang] || v.en}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'วันเริ่มต้น','Start Date')} <span className="text-red-500">*</span></label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'วันสิ้นสุด','End Date')} <span className="text-red-500">*</span></label>
              <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'ชั่วโมง','Hours')}</label>
              <input type="number" min="0" value={form.hours} onChange={e => set('hours', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'ผู้เข้าร่วม','Participants')}</label>
              <input type="number" min="0" value={form.participants_count} onChange={e => set('participants_count', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'งบประมาณ','Budget')}</label>
              <input type="number" min="0" value={form.budget} onChange={e => set('budget', e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{T(lang,'หมายเหตุ','Notes')}</label>
            <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none" />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">{T(lang,'ยกเลิก','Cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-[#7DC242] hover:bg-[#5A9020] rounded-lg disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? T(lang,'กำลังบันทึก...','Saving...') : T(lang,'บันทึก','Save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function Training({ lang = 'th' , onNavigate, navContext = {} }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus]     = useState('all');
  const [filterYear, setFilterYear]         = useState('2026');
  const [search, setSearch]                 = useState('');
  const [selectedId, setSelectedId]         = useState(null);
  const [showAdd, setShowAdd]               = useState(false);
  const [showImport, setShowImport]         = useState(false);

  // ── Fetch ──────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hr_training')
      .select('*, hr_training_courses(name_th, name_en, category)')
      .order('start_date', { ascending: true });

    if (!error && data) {
      const normalized = data.map(s => ({
        ...s,
        category:  s.hr_training_courses?.category  || 'Other',
        name_th:   s.hr_training_courses?.name_th   || s.course_name || '',
        name_en:   s.hr_training_courses?.name_en   || s.course_name || '',
      }));
      setSessions(normalized);
      if (normalized.length > 0 && !selectedId) setSelectedId(normalized[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── Filter ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return sessions.filter(s => {
      const name = lang === 'th' ? s.name_th : s.name_en;
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterYear !== 'all' && !(s.start_date || '').startsWith(filterYear)) return false;
      return true;
    });
  }, [sessions, search, filterCategory, filterStatus, filterYear, lang]);

  const selected = useMemo(() => sessions.find(s => s.id === selectedId) || null, [sessions, selectedId]);

  // ── KPI stats ──────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:        filtered.length,
    completed:    filtered.filter(s => s.status === 'completed').length,
    participants: filtered.reduce((sum, s) => sum + (s.participants_count || 0), 0),
    totalHours:   filtered.reduce((sum, s) => sum + Number(s.hours || 0), 0),
    totalBudget:  filtered.reduce((sum, s) => sum + Number(s.budget || 0), 0),
  }), [filtered]);

  // ── Monthly training hours (Jan–Dec) ───────────────────────
  const monthlyData = useMemo(() => {
    const buckets = {};
    MONTHS_EN.forEach(m => { buckets[m] = 0; });
    filtered.forEach(s => {
      if (!s.start_date) return;
      const m = MONTHS_EN[new Date(s.start_date).getMonth()];
      buckets[m] += Number(s.hours || 0);
    });
    return MONTHS_EN.slice(0, 8).map(m => ({ month: m, hours: buckets[m] }));
  }, [filtered]);

  // ── Popular courses (top 5 by participants) ────────────────
  const popularCourses = useMemo(() =>
    [...filtered]
      .sort((a, b) => (b.participants_count || 0) - (a.participants_count || 0))
      .slice(0, 5)
      .map(s => ({
        name:         lang === 'th' ? s.name_th : s.name_en,
        participants: s.participants_count || 0,
        pct:          s.status === 'completed' ? 100 : s.status === 'ongoing' ? 65 : 30,
      })),
  [filtered, lang]);

  // ── Category registration stats ────────────────────────────
  const catStats = useMemo(() => {
    return CATEGORIES.map(cat => ({
      cat,
      count: filtered.filter(s => s.category === cat).reduce((sum, s) => sum + (s.participants_count || 0), 0),
    }));
  }, [filtered]);
  const maxCatCount = Math.max(...catStats.map(c => c.count), 1);

  // ── Skill gap — computed from category completion rate ─────
  const skillGaps = useMemo(() =>
    CATEGORIES.map(cat => {
      const rows = filtered.filter(s => s.category === cat);
      const done = rows.filter(s => s.status === 'completed').length;
      const pct  = rows.length ? Math.round((done / rows.length) * 100) : 0;
      return { skill: CAT_LABEL[cat]?.[lang] || cat, gap: pct };
    }),
  [filtered, lang]);

  // ── Export ─────────────────────────────────────────────────
  const exportColumns = [
    { header: T(lang,'ชื่อหลักสูตร','Course Name'),  accessor: r => lang === 'th' ? r.name_th : r.name_en, width: 30 },
    { header: T(lang,'ประเภท','Category'),            accessor: 'category',          width: 14 },
    { header: T(lang,'วันเริ่มต้น','Start Date'),    accessor: 'start_date',        width: 12 },
    { header: T(lang,'วันสิ้นสุด','End Date'),        accessor: 'end_date',          width: 12 },
    { header: T(lang,'สถานะ','Status'),               accessor: r => STATUS_LABEL[r.status]?.[lang] || r.status, width: 14 },
    { header: T(lang,'ผู้เข้าร่วม','Participants'),   accessor: 'participants_count', width: 12 },
    { header: T(lang,'ชั่วโมง','Hours'),              accessor: 'hours',             width: 8  },
    { header: T(lang,'งบประมาณ','Budget'),            accessor: 'budget',            width: 12 },
  ];

  const handleExport = () => exportToExcel({
    data: filtered,
    columns: exportColumns,
    filename: 'Training-Courses',
    sheetName: T(lang, 'หลักสูตรฝึกอบรม', 'Training Courses'),
  });

  // ── Import ─────────────────────────────────────────────────
  const importColumns = [
    { header: T(lang,'ชื่อหลักสูตร','Course Name'), headerEn:'Course Name', accessor:'course_name', dbField:'course_name', example:'Python Fundamentals', width:28 },
    { header: T(lang,'ประเภท','Category'),           headerEn:'Category',    accessor:'category',    dbField:'category',    example:'Technical',           width:14 },
    { header: T(lang,'วันเริ่มต้น','Start Date'),   headerEn:'Start Date',  accessor:'start_date',  dbField:'start_date',  example:'2026-01-10',           width:12 },
    { header: T(lang,'วันสิ้นสุด','End Date'),       headerEn:'End Date',    accessor:'end_date',    dbField:'end_date',    example:'2026-01-24',           width:12 },
    { header: T(lang,'สถานะ','Status'),              headerEn:'Status',      accessor:'status',      dbField:'status',      example:'registering',          width:12 },
    { header: T(lang,'ผู้เข้าร่วม','Participants'),  headerEn:'Participants', accessor:'participants_count', dbField:'participants_count', example:'30', width:12, transform: v => parseInt(v)||0 },
    { header: T(lang,'ชั่วโมง','Hours'),             headerEn:'Hours',       accessor:'hours',       dbField:'hours',       example:'16', width:8,  transform: v => parseInt(v)||0 },
    { header: T(lang,'งบประมาณ','Budget'),           headerEn:'Budget',      accessor:'budget',      dbField:'budget',      example:'150000', width:12, transform: v => parseInt(v)||0 },
  ];

  const handleImport = async (rows) => {
    const records = rows.map(r => ({
      course_name:       r.course_name || '',
      start_date:        r.start_date  || null,
      end_date:          r.end_date    || null,
      hours:             r.hours       || 0,
      participants_count:r.participants_count || 0,
      budget:            r.budget      || 0,
      status:            r.status      || 'registering',
    })).filter(r => r.course_name);

    const { error } = await supabase.from('hr_training').insert(records);
    if (error) throw new Error(error.message);
    await fetchData();
    return records.length;
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm(T(lang, 'ยืนยันลบหลักสูตรนี้?', 'Confirm delete this course?'))) return;
    await supabase.from('hr_training').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(sessions[0]?.id || null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7DC242]" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title={T(lang, 'ฝึกอบรม', 'Training')} lang={lang} />
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#7DC242] hover:bg-[#5A9020] rounded-lg transition">
            <Plus className="w-4 h-4" />{T(lang, 'เพิ่มหลักสูตร', 'Add Course')}
          </button>
          <ImportExportButtons onExport={handleExport} onImportClick={() => setShowImport(true)} lang={lang} />
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KPICard icon={BookOpen}     iconBg="bg-[#E6F9F0]"   iconColor="text-[#7DC242]"   label={T(lang,'หลักสูตรทั้งหมด','Total Courses')}    value={stats.total} />
        <KPICard icon={CheckCircle}  iconBg="bg-green-100"  iconColor="text-green-600"  label={T(lang,'เสร็จสิ้น','Completed')}             value={stats.completed} sub={T(lang,'หลักสูตร','courses')} />
        <KPICard icon={Users}        iconBg="bg-purple-100" iconColor="text-purple-600" label={T(lang,'ผู้เข้าร่วมรวม','Total Participants')} value={stats.participants.toLocaleString('th-TH')} sub={T(lang,'คน','ppl')} />
        <KPICard icon={Clock}        iconBg="bg-orange-100" iconColor="text-orange-600" label={T(lang,'ชั่วโมงอบรมรวม','Total Hours')}       value={stats.totalHours.toLocaleString('th-TH')} sub={T(lang,'ชม.','hrs')} />
        <KPICard icon={Wallet}       iconBg="bg-green-100"  iconColor="text-green-600"  label={T(lang,'งบประมาณรวม','Total Budget')}          value={fmtBudget(stats.totalBudget)} sub={T(lang,'บาท','THB')} />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-3 flex-wrap items-end">
        <div className="flex-1 min-w-36">
          <label className="block text-xs text-gray-600 mb-1 font-medium">{T(lang,'ค้นหา','Search')}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={T(lang,'ชื่อหลักสูตร...','Course name...')}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
        </div>
        <div className="min-w-32">
          <label className="block text-xs text-gray-600 mb-1 font-medium">{T(lang,'ประเภท','Category')}</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">{T(lang,'ทั้งหมด','All')}</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="min-w-32">
          <label className="block text-xs text-gray-600 mb-1 font-medium">{T(lang,'สถานะ','Status')}</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">{T(lang,'ทั้งหมด','All')}</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v[lang]||v.en}</option>)}
          </select>
        </div>
        <div className="min-w-24">
          <label className="block text-xs text-gray-600 mb-1 font-medium">{T(lang,'ปี','Year')}</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="all">{T(lang,'ทั้งหมด','All')}</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* ── Main 3-column Grid ── */}
      <div className="grid grid-cols-12 gap-5">

        {/* LEFT: Course list ~5/12 */}
        <div className="col-span-12 lg:col-span-5">
          <Section title={T(lang,'รายการหลักสูตรฝึกอบรม','Training Course List')}>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">{T(lang,'ไม่พบข้อมูล','No data found')}</p>
              )}
              {filtered.map(s => {
                const name = lang === 'th' ? s.name_th : s.name_en;
                const isSelected = s.id === selectedId;
                return (
                  <div key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-blue-300 bg-[#f0fce8]' : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'}`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{name}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[s.status] || 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[s.status]?.[lang] || s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${CAT_COLOR[s.category] || 'bg-gray-100 text-gray-600'}`}>
                        {CAT_LABEL[s.category]?.[lang] || s.category}
                      </span>
                      <span className="text-xs text-gray-500">{s.start_date} – {s.end_date}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(s.participants_count||0).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.hours} {T(lang,'ชม.','hrs')}</span>
                      <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{(s.budget||0).toLocaleString('th-TH')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* CENTER: Charts ~4/12 */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          {/* Popular courses */}
          <Section title={T(lang,'หลักสูตรยอดนิยม (ผู้เข้าร่วมสูงสุด)','Most Popular Courses')}>
            <div className="space-y-3">
              {popularCourses.map((c, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-800 truncate max-w-[200px]">{c.name}</p>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">{c.participants} {T(lang,'คน','ppl')}</span>
                  </div>
                  <ProgressBar value={c.pct} color="bg-[#7DC242]" />
                </div>
              ))}
              {popularCourses.length === 0 && <p className="text-xs text-gray-400 text-center py-4">{T(lang,'ไม่มีข้อมูล','No data')}</p>}
            </div>
          </Section>

          {/* Monthly hours bar chart */}
          <Section title={T(lang,'ชั่วโมงอบรมรายเดือน','Monthly Training Hours')}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v} hrs`]} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* RIGHT: Detail panel ~3/12 */}
        <div className="col-span-12 lg:col-span-3">
          <DetailPanel>
            {/* Selected course detail */}
            {selected ? (
              <Section title={T(lang,'รายละเอียด','Detail')}>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-bold text-gray-900 text-base leading-snug">
                      {lang === 'th' ? selected.name_th : selected.name_en}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[selected.status] || ''}`}>
                        {STATUS_LABEL[selected.status]?.[lang] || selected.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLOR[selected.category] || ''}`}>
                        {CAT_LABEL[selected.category]?.[lang] || selected.category}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-xs">
                    <div><p className="text-gray-500">{T(lang,'วันเริ่มต้น','Start')}</p><p className="font-medium">{selected.start_date || '-'}</p></div>
                    <div><p className="text-gray-500">{T(lang,'วันสิ้นสุด','End')}</p><p className="font-medium">{selected.end_date || '-'}</p></div>
                    <div><p className="text-gray-500">{T(lang,'ผู้เข้าร่วม','Participants')}</p><p className="font-bold text-[#5A9020]">{(selected.participants_count||0).toLocaleString()}</p></div>
                    <div><p className="text-gray-500">{T(lang,'ชั่วโมง','Hours')}</p><p className="font-bold text-orange-600">{selected.hours}</p></div>
                    <div className="col-span-2"><p className="text-gray-500">{T(lang,'งบประมาณ','Budget')}</p><p className="font-bold text-green-700">{(selected.budget||0).toLocaleString('th-TH')} {T(lang,'บาท','THB')}</p></div>
                  </div>
                  {selected.notes && (
                    <div className="text-xs border-t border-gray-100 pt-2">
                      <p className="text-gray-500 mb-0.5">{T(lang,'หมายเหตุ','Notes')}</p>
                      <p className="text-gray-700">{selected.notes}</p>
                    </div>
                  )}
                  <button onClick={() => handleDelete(selected.id)}
                    className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition">
                    {T(lang,'ลบหลักสูตรนี้','Delete this course')}
                  </button>
                </div>
              </Section>
            ) : (
              <Section title={T(lang,'รายละเอียด','Detail')}>
                <p className="text-xs text-gray-400 text-center py-8">{T(lang,'เลือกหลักสูตรเพื่อดูรายละเอียด','Select a course to view details')}</p>
              </Section>
            )}

            {/* Skill gap / completion by category */}
            <Section title={T(lang,'อัตราสำเร็จตามประเภท','Completion by Category')}>
              <div className="space-y-2.5">
                {skillGaps.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">{item.skill}</span>
                      <span className="text-xs text-gray-500">{item.gap}%</span>
                    </div>
                    <ProgressBar value={item.gap} color="bg-green-500" />
                  </div>
                ))}
              </div>
            </Section>
          </DetailPanel>
        </div>
      </div>

      {/* ── Bottom: Category registration bar ── */}
      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-12 lg:col-span-6">
          <Section title={T(lang,'ผู้เข้าร่วมตามประเภทหลักสูตร','Participants by Category')}>
            <div className="space-y-3">
              {catStats.map(({ cat, count }) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{CAT_LABEL[cat]?.[lang] || cat}</span>
                    <span className="text-xs text-gray-500">{count.toLocaleString()} {T(lang,'คน','ppl')}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max((count / maxCatCount) * 100, count > 0 ? 5 : 0)}%` }}>
                      {count > 0 && <span className="text-xs text-white font-medium">{Math.round((count / stats.participants) * 100) || 0}%</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <Section title={T(lang,'สัดส่วนสถานะหลักสูตร','Course Status Breakdown')}>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(STATUS_LABEL).map(([key, label]) => {
                const count = filtered.filter(s => s.status === key).length;
                const pct = filtered.length ? Math.round((count / filtered.length) * 100) : 0;
                return (
                  <div key={key} className={`rounded-xl p-3 ${STATUS_COLOR[key]?.replace('text-','bg-').replace('-700','-50') || 'bg-gray-50'} border border-gray-100`}>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{label[lang] || label.en}</p>
                    <p className="text-[11px] text-gray-400 mt-1">{pct}% {T(lang,'ของทั้งหมด','of total')}</p>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      </div>

      {/* ── Modals ── */}
      <TrainingModal open={showAdd} onClose={() => setShowAdd(false)} onSaved={fetchData} lang={lang} />
      <ImportModal
        open={showImport} onClose={() => setShowImport(false)}
        onImport={handleImport} columns={importColumns}
        tableName={T(lang, 'หลักสูตรฝึกอบรม', 'Training Courses')} lang={lang}
      />
    </div>
  );
}
