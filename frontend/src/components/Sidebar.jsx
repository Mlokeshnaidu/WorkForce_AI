import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, currentUser }) {
  const phase1Core = [
    { id: 'dashboard', label: 'Workforce Overview' },
    { id: 'employees', label: 'Employee Directory' },
    { id: 'departments', label: 'Departments & Roles' },
    { id: 'attendance', label: 'Attendance & Shifts' },
    { id: 'leaves', label: 'Leave Management' },
    { id: 'payrolls', label: 'Payroll & Compensation' },
    { id: 'documents', label: 'Document Vault' },
    { id: 'chats', label: 'Team Messaging' },
  ];

  const phase2AI = [
    { id: 'ai_intelligence', label: 'AI Attrition Prediction' },
    { id: 'datasets', label: 'Dataset Management' },
    { id: 'forecasting', label: 'Workforce Forecasting' },
  ];

  const phase3Enterprise = [
    { id: 'interventions', label: 'Retention Interventions' },
    { id: 'tasks', label: 'Tasks & Workflows' },
    { id: 'performance', label: 'Performance Reviews' },
    { id: 'reports', label: 'Reports & Export Center' },
    { id: 'audit', label: 'Audit Trail & Logs' },
  ];

  const renderNavGroup = (title, items) => (
    <div className="space-y-1 mb-4">
      <p className="text-[10px] uppercase font-bold text-slate-400 px-3 pb-1 tracking-wider">
        {title}
      </p>
      {items.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              isActive
                ? 'bg-[#1a56db] text-white font-semibold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-64 bg-[#081534] border-r border-slate-800/60 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand Header matching screenshot */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#1a56db] flex items-center justify-center font-extrabold text-white text-base shadow-sm">
            W
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              WorkForce AI Pro
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">Workforce Intelligence</p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 pt-4">
          {renderNavGroup('Core Workforce', phase1Core)}
          {renderNavGroup('AI Analytics', phase2AI)}
          {renderNavGroup('Operations', phase3Enterprise)}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 shrink-0 bg-[#061029]">
        <div className="text-xs text-slate-400">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">Active Role</span>
          <span className="font-semibold text-slate-200 capitalize">{currentUser?.role || 'Admin'}</span>
        </div>
      </div>
    </aside>
  );
}
