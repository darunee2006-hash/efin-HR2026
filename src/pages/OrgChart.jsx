import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCompanyFilter } from '../lib/CompanyFilterContext';
import { PageHeader, KPICard, Section } from '../components/PageUI';
import { Building2, Users, GitBranch, Layers, ChevronDown, ChevronRight, User, X } from 'lucide-react';

/* ─── Colors ────────────────────────────────────────── */
const LEVEL_COLORS = {
  G12: { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-500', label: 'CEO' },
  G11: { bg: 'bg-amber-400', text: 'text-white', border: 'border-amber-400', label: 'C-Level' },
  G10: { bg: 'bg-red-500',   text: 'text-white', border: 'border-red-500',   label: 'C-Level' },
  G9:  { bg: 'bg-red-400',   text: 'text-white', border: 'border-red-400',   label: 'Director' },
  G8:  { bg: 'bg-rose-400',  text: 'text-white', border: 'border-rose-400',  label: 'Director' },
  G7:  { bg: 'bg-[#7DC242]',  text: 'text-white', border: 'border-[#7DC242]',  label: 'Manager' },
  G6:  { bg: 'bg-blue-400',  text: 'text-white', border: 'border-blue-400',  label: 'Manager' },
  G5:  { bg: 'bg-emerald-500',text:'text-white',  border: 'border-emerald-500',label:'Lead' },
  G4:  { bg: 'bg-purple-400',text: 'text-white', border: 'border-purple-400',label: 'Senior' },
  G3:  { bg: 'bg-slate-400', text: 'text-white', border: 'border-slate-400', label: 'Staff' },
};
const defaultLvl = { bg: 'bg-gray-400', text: 'text-white', border: 'border-gray-400', label: '' };
const getLvl = (l) => LEVEL_COLORS[l] || defaultLvl;

const DEPT_PALETTE = [
  '#DC2626','#7DC242','#0891B2','#7C3AED','#D97706',
  '#2563EB','#E11D48','#65A30D','#4F46E5','#EA580C',
  '#0D9488','#8B5CF6','#BE185D','#0369A1','#B45309',
];

/* ─── Level Badge ───────────────────────────────────── */
function LevelBadge({ level }) {
  const lv = getLvl(level);
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${lv.bg} ${lv.text}`}>
      {level}{lv.label ? ` · ${lv.label}` : ''}
    </span>
  );
}

/* ─── Employee Card ─────────────────────────────────── */
function EmpCard({ emp, lang, compact, onNavigate }) {
  const name = lang === 'th'
    ? `${emp.first_name_th || ''} ${emp.last_name_th || ''}`.trim()
    : `${emp.first_name_en || emp.first_name_th || ''} ${emp.last_name_en || emp.last_name_th || ''}`.trim();
  const nick = emp.nickname;
  const pos = lang === 'th' ? (emp.position_th || emp.position_en || '') : (emp.position_en || emp.position_th || '');
  const lv = getLvl(emp.level);
  const lvNum = parseInt((emp.level || '').replace('G', '')) || 0;
  const isExec = lvNum >= 9;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-2 py-1.5 rounded border-l-3 ${lv.border} bg-white hover:bg-gray-50 transition`}
        onClick={() => onNavigate && onNavigate('employees', {employeeCode: emp.employee_code})}
        style={{cursor: onNavigate ? 'pointer' : 'default'}}>
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-gray-800 truncate">{name}{nick ? ` (${nick})` : ''}</div>
          <div className="text-[10px] text-gray-400 truncate">{pos}</div>
        </div>
        <LevelBadge level={emp.level} />
      </div>
    );
  }

  return (
    <div className={`rounded-lg border-2 ${lv.border} bg-white shadow-sm hover:shadow-md transition p-3 ${isExec ? 'ring-2 ring-amber-200' : ''}`}
      onClick={() => onNavigate && onNavigate('employees', {employeeCode: emp.employee_code})}
      style={{cursor: onNavigate ? 'pointer' : 'default'}}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${isExec ? 'bg-amber-100' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
          <User className={`w-5 h-5 ${isExec ? 'text-amber-600' : 'text-gray-500'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900">{name}</div>
          {nick && <div className="text-xs text-gray-400">({nick})</div>}
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{pos}</div>
          <div className="mt-1.5"><LevelBadge level={emp.level} /></div>
        </div>
      </div>
    </div>
  );
}

/* ─── Department Section ────────────────────────────── */
function DeptSection({ dept, emps, lang, color, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const head = emps[0];
  const headName = lang === 'th'
    ? `${head?.first_name_th || ''} ${head?.last_name_th || ''}${head?.nickname ? ' (' + head.nickname + ')' : ''}`.trim()
    : `${head?.first_name_en || head?.first_name_th || ''} ${head?.last_name_en || head?.last_name_th || ''}${head?.nickname ? ' (' + head.nickname + ')' : ''}`.trim();

  return (
    <div
      className={`rounded-xl border-2 transition cursor-pointer ${isSelected ? 'border-[#7DC242] bg-[#f0fce8]/50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'}`}
      onClick={() => onSelect(dept)}
    >
      <div className="p-3 flex items-center gap-3">
        <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-900 truncate">{dept}</div>
          <div className="text-xs text-gray-500 truncate">{headName}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold" style={{ color }}>{emps.length}</div>
          <div className="text-[10px] text-gray-400">{lang === 'th' ? 'คน' : 'emp'}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Panel ──────────────────────────────────── */
function OrgDetailPanel({ deptName, emps, lang, color, onClose, groupBy = 'level', deptMap = {}, onNavigate }) {
  // Group by level
  const levelGroups = useMemo(() => {
    if (groupBy !== 'level') return [];
    const groups = {};
    emps.forEach(emp => {
      const lvl = emp.level || 'N/A';
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(emp);
    });
    // Sort levels descending
    return Object.entries(groups).sort((a, b) => {
      const numA = parseInt(a[0].replace('G', '')) || 0;
      const numB = parseInt(b[0].replace('G', '')) || 0;
      return numB - numA;
    });
  }, [emps, groupBy]);

  // Group by department
  const deptGroups = useMemo(() => {
    if (groupBy !== 'department') return [];
    const groups = {};
    emps.forEach(emp => {
      const dept = deptMap[emp.department_id];
      const name = dept ? (lang === 'th' ? dept.name_th : (dept.name_en || dept.name_th)) : (lang === 'th' ? 'ไม่ระบุแผนก' : 'Unassigned');
      if (!groups[name]) groups[name] = [];
      groups[name].push(emp);
    });
    // Sort employees within each dept by level descending
    Object.values(groups).forEach(arr => {
      arr.sort((a, b) => {
        const la = parseInt((a.level || '').replace('G', '')) || 0;
        const lb = parseInt((b.level || '').replace('G', '')) || 0;
        return lb - la;
      });
    });
    // Sort departments by highest-level employee, then by headcount
    return Object.entries(groups).sort((a, b) => {
      const aUnassigned = a[0].includes('ไม่ระบุ') || a[0] === 'Unassigned';
      const bUnassigned = b[0].includes('ไม่ระบุ') || b[0] === 'Unassigned';
      if (aUnassigned && !bUnassigned) return 1;
      if (!aUnassigned && bUnassigned) return -1;
      const maxA = parseInt((a[1][0]?.level || '').replace('G', '')) || 0;
      const maxB = parseInt((b[1][0]?.level || '').replace('G', '')) || 0;
      if (maxB !== maxA) return maxB - maxA;
      return b[1].length - a[1].length;
    });
  }, [emps, groupBy, deptMap, lang]);

  const groups = groupBy === 'department' ? deptGroups : levelGroups;
  const groupLabel = groupBy === 'department'
    ? (lang === 'th' ? 'ฝ่ายงาน' : 'departments')
    : (lang === 'th' ? 'ระดับ' : 'levels');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 text-white relative" style={{ backgroundColor: color }}>
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-lg font-bold pr-8">{deptName}</h3>
        <div className="flex gap-4 mt-2 text-sm opacity-90">
          <span>{emps.length} {lang === 'th' ? 'คน' : 'employees'}</span>
          <span>{groups.length} {groupLabel}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {groups.map(([groupName, groupEmps]) => {
          if (groupBy === 'department') {
            return (
              <div key={groupName}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#f0fce8] text-[#5A9020] border border-[#C5E888]">
                    <Building2 className="w-3 h-3 mr-1" />
                    {groupName}
                  </span>
                  <span className="text-xs text-gray-400">{groupEmps.length} {lang === 'th' ? 'คน' : ''}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-1.5 pl-2">
                  {groupEmps.map(emp => <EmpCard key={emp.id} emp={emp} lang={lang} compact onNavigate={onNavigate} />)}
                </div>
              </div>
            );
          }
          const lv = getLvl(groupName);
          return (
            <div key={groupName}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${lv.bg} ${lv.text}`}>
                  {groupName} · {lv.label}
                </span>
                <span className="text-xs text-gray-400">{groupEmps.length} {lang === 'th' ? 'คน' : ''}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-1.5 pl-2">
                {groupEmps.map(emp => <EmpCard key={emp.id} emp={emp} lang={lang} compact onNavigate={onNavigate} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── CEO Card ──────────────────────────────────────── */
function CEOCard({ emp, lang }) {
  if (!emp) return null;
  const name = lang === 'th'
    ? `${emp.first_name_th || ''} ${emp.last_name_th || ''}`.trim()
    : `${emp.first_name_en || emp.first_name_th || ''} ${emp.last_name_en || emp.last_name_th || ''}`.trim();
  const pos = lang === 'th' ? (emp.position_th || '') : (emp.position_en || emp.position_th || '');

  return (
    <div className="flex justify-center mb-2">
      <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl p-4 shadow-lg text-center min-w-64 max-w-sm">
        <div className="w-14 h-14 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2">
          <User className="w-7 h-7 text-white" />
        </div>
        <div className="text-white font-bold text-base">{name}</div>
        {emp.nickname && <div className="text-amber-100 text-xs">({emp.nickname})</div>}
        <div className="text-amber-100 text-xs mt-1">{pos}</div>
        <LevelBadge level={emp.level} />
      </div>
    </div>
  );
}

/* ─── C-Level Row ───────────────────────────────────── */
function CLevelRow({ emps, lang }) {
  if (!emps.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-4">
      {emps.map(emp => (
        <div key={emp.id} className="bg-white rounded-lg border-2 border-red-400 p-3 shadow-sm text-center min-w-48 max-w-56">
          <div className="w-10 h-10 mx-auto rounded-full bg-red-50 flex items-center justify-center mb-1">
            <User className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-sm font-semibold text-gray-900">
            {lang === 'th' ? `${emp.first_name_th} ${emp.last_name_th}` : `${emp.first_name_en || emp.first_name_th} ${emp.last_name_en || emp.last_name_th}`}
          </div>
          {emp.nickname && <div className="text-xs text-gray-400">({emp.nickname})</div>}
          <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{lang === 'th' ? emp.position_th : (emp.position_en || emp.position_th)}</div>
          <div className="mt-1"><LevelBadge level={emp.level} /></div>
        </div>
      ))}
    </div>
  );
}

/* ─── Dept List Item (for list view) ────────────────── */
function DeptListItem({ deptName, data, color, lang, onNavigate }) {
  const [open, setOpen] = useState(false);

  const sortedLevels = useMemo(() => {
    const levelGroups = {};
    data.employees.forEach(emp => {
      const lvl = emp.level || 'N/A';
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(emp);
    });
    return Object.entries(levelGroups).sort((a, b) => {
      const na = parseInt(a[0].replace('G', '')) || 0;
      const nb = parseInt(b[0].replace('G', '')) || 0;
      return nb - na;
    });
  }, [data.employees]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left"
      >
        <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-gray-900">{deptName}</div>
          <div className="text-xs text-gray-400">
            {data.employees[0]?.first_name_th} {data.employees[0]?.last_name_th}{data.employees[0]?.nickname ? ` (${data.employees[0].nickname})` : ''}
          </div>
        </div>
        <div className="text-lg font-bold" style={{ color }}>{data.employees.length}</div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {sortedLevels.map(([level, lvlEmps]) => {
            const lv = getLvl(level);
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lv.bg} ${lv.text}`}>
                    {level} · {lv.label}
                  </span>
                  <span className="text-[10px] text-gray-400">{lvlEmps.length} {lang === 'th' ? 'คน' : ''}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 pl-2">
                  {lvlEmps.map(emp => <EmpCard key={emp.id} emp={emp} lang={lang} compact onNavigate={onNavigate} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Company Config ────────────────────────────────── */
const COMPANIES = [
  { code: 'ONL',   name: 'Online Asset',   nameTh: 'Online Asset Co., Ltd.',                  color: '#7DC242', bg: '#f0fce8' },
  { code: 'EFINX', name: 'EFIN Xpert',     nameTh: 'EFIN Xpert Company Limited',              color: '#2563EB', bg: '#eff6ff' },
  { code: 'ATESS', name: 'ATESS',          nameTh: 'ATESS Power Technology (Thailand) Co., Ltd.', color: '#DC2626', bg: '#fef2f2' },
  { code: 'SMT',   name: 'Smart Medtech',  nameTh: 'Smart Medtech Co., Ltd.',                 color: '#7C3AED', bg: '#f5f3ff' },
];

/* ─── Company Org View ──────────────────────────────── */
function CompanyOrgView({ employees, deptMap, lang, company, onNavigate }) {
  const [selectedBU, setSelectedBU] = useState(null);

  const compEmps = useMemo(() => {
    return employees.filter(e => {
      const code = e.company_entity || '';
      if (company.code === 'ONL') return code === 'ONL' || (!code && /^5/.test(e.employee_code || ''));
      if (company.code === 'EFINX') return code === 'EFINX';
      if (company.code === 'ATESS') return code === 'ATESS';
      if (company.code === 'SMT') return code === 'SMT';
      return false;
    }).sort((a, b) => {
      const la = parseInt((a.level || '').replace('G', '')) || 0;
      const lb = parseInt((b.level || '').replace('G', '')) || 0;
      return lb - la;
    });
  }, [employees, company]);

  const ceo = compEmps.find(e => parseInt((e.level || '').replace('G', '')) >= 12);
  const cLevel = compEmps.filter(e => {
    const n = parseInt((e.level || '').replace('G', '')) || 0;
    return n >= 10 && n < 12;
  });

  // For ONL: group by BU; for others: group by department
  const isONL = company.code === 'ONL';

  const buGroups = useMemo(() => {
    if (!isONL) return [];
    const groups = {};
    compEmps.forEach(emp => {
      const buName = emp.bu || (lang === 'th' ? 'ไม่ระบุ BU' : 'Unassigned');
      if (!groups[buName]) groups[buName] = [];
      groups[buName].push(emp);
    });
    return Object.entries(groups).sort((a, b) => {
      const aU = a[0].includes('ไม่ระบุ') || a[0] === 'Unassigned';
      const bU = b[0].includes('ไม่ระบุ') || b[0] === 'Unassigned';
      if (aU && !bU) return 1; if (!aU && bU) return -1;
      return b[1].length - a[1].length;
    });
  }, [compEmps, isONL, lang]);

  const deptGroups = useMemo(() => {
    if (isONL) return [];
    const groups = {};
    compEmps.forEach(emp => {
      const dept = deptMap[emp.department_id];
      const name = dept ? (lang === 'th' ? dept.name_th : (dept.name_en || dept.name_th)) : (lang === 'th' ? 'ไม่ระบุแผนก' : 'Unassigned');
      if (!groups[name]) groups[name] = [];
      groups[name].push(emp);
    });
    return Object.entries(groups).sort((a, b) => {
      const la = parseInt((a[1][0]?.level || '').replace('G', '')) || 0;
      const lb = parseInt((b[1][0]?.level || '').replace('G', '')) || 0;
      if (lb !== la) return lb - la;
      return b[1].length - a[1].length;
    });
  }, [compEmps, isONL, deptMap, lang]);

  const groups = isONL ? buGroups : deptGroups;
  const [selectedGroup, setSelectedGroup] = useState(null);
  const selectedData = groups.find(([n]) => n === selectedGroup);

  if (compEmps.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 text-sm">
        {lang === 'th' ? 'ไม่มีข้อมูลพนักงานในบริษัทนี้' : 'No employee data for this company'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Company Header */}
      <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: company.bg, border: `1.5px solid ${company.color}30` }}>
        <div>
          <div className="text-lg font-bold" style={{ color: company.color }}>{company.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{company.nameTh}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: company.color }}>{compEmps.length}</div>
          <div className="text-xs text-gray-400">{lang === 'th' ? 'คน' : 'employees'}</div>
        </div>
      </div>

      {/* CEO */}
      {ceo && (
        <div className="flex justify-center">
          <div className="rounded-xl p-4 shadow text-center min-w-56" style={{ background: company.color }}>
            <div className="w-12 h-12 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-2">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="text-white font-bold text-sm">
              {lang === 'th' ? `${ceo.first_name_th} ${ceo.last_name_th}` : `${ceo.first_name_en || ceo.first_name_th} ${ceo.last_name_en || ceo.last_name_th}`}
            </div>
            {ceo.nickname && <div className="text-white/70 text-xs">({ceo.nickname})</div>}
            <div className="text-white/80 text-[11px] mt-1">{lang === 'th' ? ceo.position_th : (ceo.position_en || ceo.position_th)}</div>
            <LevelBadge level={ceo.level} />
          </div>
        </div>
      )}

      {/* C-Level */}
      {cLevel.length > 0 && (
        <>
          {ceo && <div className="flex justify-center"><div className="w-px h-5 bg-gray-300" /></div>}
          <div className="text-center text-xs text-gray-400 font-medium mb-1">{lang === 'th' ? 'บอร์ดบริหาร' : 'Executive Board'}</div>
          <div className="flex flex-wrap justify-center gap-3">
            {cLevel.map(emp => (
              <div key={emp.id} className="bg-white rounded-lg border-2 p-3 shadow-sm text-center min-w-44" style={{ borderColor: company.color + '80' }}>
                <div className="w-9 h-9 mx-auto rounded-full flex items-center justify-center mb-1" style={{ background: company.bg }}>
                  <User className="w-4 h-4" style={{ color: company.color }} />
                </div>
                <div className="text-xs font-semibold text-gray-900">
                  {lang === 'th' ? `${emp.first_name_th} ${emp.last_name_th}` : `${emp.first_name_en || emp.first_name_th} ${emp.last_name_en || emp.last_name_th}`}
                </div>
                {emp.nickname && <div className="text-[10px] text-gray-400">({emp.nickname})</div>}
                <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{lang === 'th' ? emp.position_th : (emp.position_en || emp.position_th)}</div>
                <div className="mt-1"><LevelBadge level={emp.level} /></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* BU / Department Groups */}
      {(ceo || cLevel.length > 0) && <div className="flex justify-center"><div className="w-px h-5 bg-gray-300" /></div>}
      <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
        <Building2 className="w-4 h-4" style={{ color: company.color }} />
        {isONL ? (lang === 'th' ? 'Business Unit' : 'Business Units') : (lang === 'th' ? 'ฝ่ายงาน' : 'Departments')}
        <span className="text-gray-400 font-normal">({groups.length})</span>
      </div>

      <div className="flex gap-6">
        <div className={`${selectedData ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
          <div className={`grid ${selectedData ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-3`}>
            {groups.map(([name, emps], i) => {
              const color = DEPT_PALETTE[i % DEPT_PALETTE.length];
              const head = emps.find(e => {
                const pos = (e.position_th || '').toLowerCase();
                return pos.includes('head') || pos.includes('ผู้อำนวยการ') || pos.includes('ceo') || pos.includes('ประธาน');
              }) || emps[0];
              const isSelected = selectedGroup === name;
              return (
                <div
                  key={name}
                  className={`rounded-xl border-2 transition cursor-pointer ${isSelected ? 'shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'}`}
                  style={isSelected ? { borderColor: company.color, background: company.bg } : {}}
                  onClick={() => setSelectedGroup(prev => prev === name ? null : name)}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 truncate">{name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {lang === 'th'
                          ? `${head?.first_name_th || ''} ${head?.last_name_th || ''}${head?.nickname ? ' (' + head.nickname + ')' : ''}`.trim()
                          : `${head?.first_name_en || head?.first_name_th || ''} ${head?.last_name_en || head?.last_name_th || ''}`.trim()}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold" style={{ color }}>{emps.length}</div>
                      <div className="text-[10px] text-gray-400">{lang === 'th' ? 'คน' : 'emp'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedData && (
          <div className="w-1/2 transition-all duration-300">
            <OrgDetailPanel
              deptName={selectedData[0]}
              emps={selectedData[1]}
              lang={lang}
              color={DEPT_PALETTE[groups.findIndex(([n]) => n === selectedGroup) % DEPT_PALETTE.length]}
              onClose={() => setSelectedGroup(null)}
              groupBy="level"
              deptMap={deptMap}
            />
          </div>
        )}
      </div>

      {!selectedData && (
        <div className="text-center text-gray-400 text-sm mt-2">
          {lang === 'th' ? 'คลิกเลือกเพื่อดูรายละเอียดพนักงาน' : 'Click to view employee details'}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────── */
export default function OrgChart({ lang, onNavigate }) {
  const { filterByCompany } = useCompanyFilter();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState(null);
  const [viewMode, setViewMode] = useState('company'); // company | chart | list | bu
  const [selectedBU, setSelectedBU] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState('ONL');

  const t = {
    title: lang === 'th' ? 'โครงสร้างองค์กร' : 'Organization Chart',
    empCount: lang === 'th' ? 'จำนวนพนักงาน' : 'Total Employees',
    deptCount: lang === 'th' ? 'ฝ่าย' : 'Departments',
    levelCount: lang === 'th' ? 'ระดับตำแหน่ง' : 'Job Grades',
    buCount: lang === 'th' ? 'Business Unit' : 'Business Units',
    cLevel: lang === 'th' ? 'บอร์ดบริหาร' : 'Executive Board',
    seniorExecs: lang === 'th' ? 'บอร์ดบริหาร' : 'Executive Board',
    loading: lang === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading...',
    companyView: lang === 'th' ? 'แยกบริษัท' : 'By Company',
    chartView: lang === 'th' ? 'ภาพรวม' : 'Overview',
    listView: lang === 'th' ? 'รายชื่อ' : 'List View',
    buView: lang === 'th' ? 'โครงสร้าง BU' : 'BU Structure',
    selectDept: lang === 'th' ? 'เลือกแผนกเพื่อดูรายละเอียดพนักงาน' : 'Select a department to view employees',
    selectBU: lang === 'th' ? 'เลือก BU เพื่อดูรายละเอียดพนักงาน' : 'Select a BU to view employees',
    allDepts: lang === 'th' ? 'ฝ่ายทั้งหมด' : 'All Departments',
    allBUs: lang === 'th' ? 'Business Unit ทั้งหมด' : 'All Business Units',
  };

  // Fetch data
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [empRes, deptRes] = await Promise.all([
          supabase.from('hr_employees')
            .select('id,employee_code,first_name_th,last_name_th,first_name_en,last_name_en,nickname,position_th,position_en,level,department_id,bu,status,company_entity')
            .eq('status', 'active')
            .order('level', { ascending: false }),
          supabase.from('hr_departments').select('id,name_th,name_en,parent_id')
        ]);
        if (empRes.error) throw empRes.error;
        if (deptRes.error) throw deptRes.error;
        setEmployees(empRes.data || []);
        setDepartments(deptRes.data || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Filtered employees
  const filtered = useMemo(() => filterByCompany(employees), [employees, filterByCompany]);

  // Build dept map
  const deptMap = useMemo(() => {
    const map = {};
    departments.forEach(d => { map[d.id] = d; });
    return map;
  }, [departments]);

  // CEO, C-level (G10+), and Senior Executives (G9)
  const { ceo, cLevel, seniorExecs } = useMemo(() => {
    let ceo = null;
    const cLevel = [];
    const seniorExecs = [];
    filtered.forEach(emp => {
      const num = parseInt((emp.level || '').replace('G', '')) || 0;
      if (num >= 12) ceo = emp;
      else if (num >= 10) cLevel.push(emp);
      else if (num === 9) {
        const pos = (emp.position_th || '') + ' ' + (emp.position_en || '');
        if (/Head|ผู้อำนวยการ|บรรณาธิการบริหาร|Executive Editor/i.test(pos)) seniorExecs.push(emp);
      }
    });
    return { ceo, cLevel, seniorExecs };
  }, [filtered]);

  // Group by department
  const deptGroups = useMemo(() => {
    const groups = {};
    filtered.forEach(emp => {
      const deptId = emp.department_id;
      const dept = deptMap[deptId];
      const deptName = dept ? (lang === 'th' ? dept.name_th : (dept.name_en || dept.name_th)) : (lang === 'th' ? 'ไม่ระบุแผนก' : 'Unassigned');

      if (!groups[deptName]) groups[deptName] = { deptId, employees: [] };
      groups[deptName].employees.push(emp);
    });

    // Sort employees within each dept by level descending
    Object.values(groups).forEach(g => {
      g.employees.sort((a, b) => {
        const la = parseInt((a.level || '').replace('G', '')) || 0;
        const lb = parseInt((b.level || '').replace('G', '')) || 0;
        return lb - la;
      });
    });

    // Sort departments by headcount descending
    const sorted = Object.entries(groups).sort((a, b) => {
      // Put highest-level employee's dept first
      const maxA = parseInt((a[1].employees[0]?.level || '').replace('G', '')) || 0;
      const maxB = parseInt((b[1].employees[0]?.level || '').replace('G', '')) || 0;
      if (maxB !== maxA) return maxB - maxA;
      return b[1].employees.length - a[1].employees.length;
    });

    return sorted;
  }, [filtered, deptMap, lang]);

  // Build BU Head map from ALL employees (cross-BU heads like สมบัติศิริ who heads Atess but is in BU IT Solution - MOL)
  const buHeadMap = useMemo(() => {
    const map = {};
    filtered.forEach(emp => {
      const pos = emp.position_th || '';
      // Split by comma to handle multiple titles like "Head BU IT Solution , Head BU Atess"
      const parts = pos.split(/[,，]/);
      parts.forEach(part => {
        const trimmed = part.trim();
        // Match "Head BU X" pattern
        const headBuMatch = trimmed.match(/Head\s+BU\s+(.+)/i);
        if (headBuMatch) {
          const buTarget = headBuMatch[1].trim().replace(/\s+and\s+.*/i, ''); // remove "and ..." suffix
          // Store with "BU " prefix (as it appears in emp.bu field) and without
          map['BU ' + buTarget] = emp;
          map[buTarget] = emp;
          // Also lowercase versions
          map[('BU ' + buTarget).toLowerCase()] = emp;
          map[buTarget.toLowerCase()] = emp;
        }
        // Match "Head Center" / "Head Cost Center"
        if (/Head\s+(Cost\s+)?Center/i.test(trimmed)) {
          map['Cost Center'] = emp;
          map['cost center'] = emp;
          map['Center'] = emp;
          map['center'] = emp;
        }
        // Match "Head Team IT Dev efin.finance" etc.
        const headTeamMatch = trimmed.match(/Head\s+Team\s+(.+)/i);
        if (headTeamMatch) {
          const teamTarget = headTeamMatch[1].trim();
          map[teamTarget] = emp;
          map[teamTarget.toLowerCase()] = emp;
        }
      });
    });
    return map;
  }, [filtered]);

  // Group by BU
  const buGroups = useMemo(() => {
    const groups = {};
    filtered.forEach(emp => {
      const buName = emp.bu || (lang === 'th' ? 'ไม่ระบุ BU' : 'Unassigned');
      if (!groups[buName]) groups[buName] = { employees: [] };
      groups[buName].employees.push(emp);
    });

    // Sort employees within each BU by level descending
    Object.values(groups).forEach(g => {
      g.employees.sort((a, b) => {
        const la = parseInt((a.level || '').replace('G', '')) || 0;
        const lb = parseInt((b.level || '').replace('G', '')) || 0;
        return lb - la;
      });
    });

    // Sort BUs by headcount descending, but put "ไม่ระบุ" last
    return Object.entries(groups).sort((a, b) => {
      const aUnassigned = a[0].includes('ไม่ระบุ') || a[0] === 'Unassigned';
      const bUnassigned = b[0].includes('ไม่ระบุ') || b[0] === 'Unassigned';
      if (aUnassigned && !bUnassigned) return 1;
      if (!aUnassigned && bUnassigned) return -1;
      return b[1].employees.length - a[1].employees.length;
    });
  }, [filtered, lang]);

  // KPIs
  const kpis = useMemo(() => {
    const levels = new Set(filtered.map(e => e.level).filter(Boolean));
    const busWithData = buGroups.filter(([name]) => !name.includes('ไม่ระบุ') && name !== 'Unassigned');
    return {
      total: filtered.length,
      depts: deptGroups.length,
      bus: busWithData.length,
      levels: levels.size,
    };
  }, [filtered, deptGroups, buGroups]);

  // Selected dept data
  const selectedData = useMemo(() => {
    if (!selectedDept) return null;
    const found = deptGroups.find(([name]) => name === selectedDept);
    return found ? { name: found[0], ...found[1] } : null;
  }, [selectedDept, deptGroups]);

  const handleSelectDept = useCallback((name) => {
    setSelectedDept(prev => prev === name ? null : name);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7DC242] mx-auto mb-3" />
          <div className="text-gray-500 text-sm">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t.title} lang={lang} />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard icon={Users} iconBg="bg-[#E6F9F0]" iconColor="text-[#7DC242]" label={t.empCount} value={kpis.total} />
        <KPICard icon={Building2} iconBg="bg-green-100" iconColor="text-green-600" label={t.deptCount} value={kpis.depts} />
        <KPICard icon={GitBranch} iconBg="bg-orange-100" iconColor="text-orange-600" label={t.buCount} value={kpis.bus} />
        <KPICard icon={Layers} iconBg="bg-purple-100" iconColor="text-purple-600" label={t.levelCount} value={kpis.levels} />
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setViewMode('company')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'company' ? 'bg-[#7DC242] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >{t.companyView}</button>
        <button
          onClick={() => setViewMode('chart')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'chart' ? 'bg-[#7DC242] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >{t.chartView}</button>
        <button
          onClick={() => setViewMode('bu')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'bu' ? 'bg-[#7DC242] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >{t.buView}</button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${viewMode === 'list' ? 'bg-[#7DC242] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >{t.listView}</button>
      </div>

      {/* Company tabs (shown when viewMode === 'company') */}
      {viewMode === 'company' && (
        <div className="flex gap-2 flex-wrap">
          {COMPANIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSelectedCompany(c.code)}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold border-2 transition"
              style={selectedCompany === c.code
                ? { background: c.color, color: '#fff', borderColor: c.color }
                : { background: '#fff', color: c.color, borderColor: c.color + '60' }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'company' ? (
        /* ═══ COMPANY VIEW ═══ */
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <CompanyOrgView
            key={selectedCompany}
            employees={employees}
            deptMap={deptMap}
            lang={lang}
            company={COMPANIES.find(c => c.code === selectedCompany) || COMPANIES[0]}
            onNavigate={onNavigate}
          />
        </div>
      ) : viewMode === 'bu' ? (
        /* ═══ BU VIEW ═══ */
        <div className="bg-gradient-to-b from-orange-50/50 to-white rounded-2xl border border-gray-200 p-6">
          <div className="flex gap-6">
            {/* BU Cards */}
            <div className={`${selectedBU ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
              <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-orange-500" />
                {t.allBUs} ({buGroups.length})
              </div>
              <div className={`grid ${selectedBU ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-3`}>
                {buGroups.map(([buName, data], i) => {
                  const color = DEPT_PALETTE[i % DEPT_PALETTE.length];
                  // Use buHeadMap first (handles cross-BU heads), then fallback to searching within BU
                  const head = buHeadMap[buName] || buHeadMap[buName.toLowerCase()]
                    || data.employees.find(e => e.position_th && e.position_th.toLowerCase().includes('head bu'))
                    || data.employees.find(e => e.position_th && e.position_th.toLowerCase().includes('head center'))
                    || data.employees.find(e => e.position_th && e.position_th.toLowerCase().includes('head team'))
                    || data.employees.find(e => e.position_th && (e.position_th.includes('CEO') || e.position_th.includes('ประธาน')))
                    || data.employees[0];
                  const isSelected = selectedBU === buName;
                  return (
                    <div
                      key={buName}
                      className={`rounded-xl border-2 transition cursor-pointer ${isSelected ? 'border-orange-500 bg-orange-50/50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow'}`}
                      onClick={() => setSelectedBU(prev => prev === buName ? null : buName)}
                    >
                      <div className="p-3 flex items-center gap-3">
                        <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-900 truncate">{buName}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {lang === 'th'
                              ? `${head?.first_name_th || ''} ${head?.last_name_th || ''}${head?.nickname ? ' (' + head.nickname + ')' : ''}`.trim()
                              : `${head?.first_name_en || head?.first_name_th || ''} ${head?.last_name_en || head?.last_name_th || ''}`.trim()
                            }
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold" style={{ color }}>{data.employees.length}</div>
                          <div className="text-[10px] text-gray-400">{lang === 'th' ? 'คน' : 'emp'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BU Detail Panel */}
            {selectedBU && (() => {
              const buData = buGroups.find(([n]) => n === selectedBU);
              if (!buData) return null;
              const buIdx = buGroups.findIndex(([n]) => n === selectedBU);
              const color = DEPT_PALETTE[buIdx % DEPT_PALETTE.length];
              return (
                <div className="w-1/2 transition-all duration-300">
                  <OrgDetailPanel
                    deptName={`BU: ${selectedBU}`}
                    emps={buData[1].employees}
                    lang={lang}
                    color={color}
                    onClose={() => setSelectedBU(null)}
                    groupBy="department"
                    deptMap={deptMap}
                  />
                </div>
              );
            })()}
          </div>

          {!selectedBU && (
            <div className="text-center text-gray-400 text-sm mt-4">{t.selectBU}</div>
          )}
        </div>
      ) : viewMode === 'chart' ? (
        /* ═══ CHART VIEW ═══ */
        <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-gray-200 p-6">
          {/* CEO */}
          <CEOCard emp={ceo} lang={lang} />

          {/* Connector line */}
          {ceo && <div className="flex justify-center mb-2"><div className="w-px h-6 bg-amber-400" /></div>}

          {/* บอร์ดบริหาร (C-Level + Senior Execs combined) */}
          {(cLevel.length > 0 || seniorExecs.length > 0) && (
            <>
              <div className="text-center text-xs text-gray-400 font-medium mb-2">{t.cLevel}</div>
              <CLevelRow emps={[...cLevel, ...seniorExecs]} lang={lang} />
              <div className="flex justify-center mb-4"><div className="w-px h-4 bg-gray-300" /></div>
            </>
          )}

          {/* Department Grid + Detail Panel */}
          <div className="flex gap-6">
            {/* Department Cards */}
            <div className={`${selectedData ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
              <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                {t.allDepts} ({deptGroups.length})
              </div>
              <div className={`grid ${selectedData ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-3`}>
                {deptGroups.map(([name, data], i) => (
                  <DeptSection
                    key={name}
                    dept={name}
                    emps={data.employees}
                    lang={lang}
                    color={DEPT_PALETTE[i % DEPT_PALETTE.length]}
                    isSelected={selectedDept === name}
                    onSelect={handleSelectDept}
                  />
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedData && (
              <div className="w-1/2 transition-all duration-300">
                <OrgDetailPanel
                  deptName={selectedData.name}
                  emps={selectedData.employees}
                  lang={lang}
                  color={DEPT_PALETTE[deptGroups.findIndex(([n]) => n === selectedDept) % DEPT_PALETTE.length]}
                  onClose={() => setSelectedDept(null)}
                />
              </div>
            )}
          </div>

          {!selectedData && (
            <div className="text-center text-gray-400 text-sm mt-4">{t.selectDept}</div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(LEVEL_COLORS).map(([level, cfg]) => (
                <div key={level} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded ${cfg.bg}`} />
                  <span className="text-[10px] text-gray-500">{level} · {cfg.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ═══ LIST VIEW ═══ */
        <div className="space-y-4">
          {deptGroups.map(([deptName, data], deptIdx) => (
            <DeptListItem
              key={deptName}
              deptName={deptName}
              data={data}
              color={DEPT_PALETTE[deptIdx % DEPT_PALETTE.length]}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  );
}
