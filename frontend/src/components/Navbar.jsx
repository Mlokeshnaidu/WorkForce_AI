import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';

export default function Navbar({ currentUser, onLogout, activeTab = 'dashboard' }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      const list = await notificationService.getAll();
      setNotifications(list || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getPageTitle = (tab) => {
    const map = {
      dashboard: 'Dashboard',
      employees: 'Employee Directory',
      departments: 'Departments & Roles',
      attendance: 'Attendance & Shifts',
      leaves: 'Leave Management',
      payrolls: 'Payroll & Compensation',
      documents: 'Document Vault',
      chats: 'Team Messaging',
      ai_intelligence: 'AI Attrition Prediction',
      datasets: 'Dataset Management',
      forecasting: 'Workforce Forecasting',
      interventions: 'Retention Interventions',
      tasks: 'Tasks & Workflows',
      performance: 'Performance Reviews',
      reports: 'Reports & Export Center',
      audit: 'Audit Trail & Logs',
    };
    return map[tab] || 'Dashboard';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HR':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MANAGER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const initials = currentUser?.full_name
    ? currentUser.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'WA';

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Breadcrumb Navigation matching screenshot: Workspace / Dashboard */}
      <div className="flex items-center gap-2.5 text-xs">
        <span className="text-slate-400 font-medium">Workspace</span>
        <span className="text-slate-300 font-medium">/</span>
        <span className="text-slate-900 font-bold">{getPageTitle(activeTab)}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer relative text-xs font-semibold flex items-center gap-1.5"
            title="Notifications"
          >
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
                <span className="text-xs font-bold text-slate-900">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="pt-2 first:pt-0">
                      <div>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                          n.type === 'RISK_ALERT' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {n.type === 'RISK_ALERT' ? 'Alert' : 'Info'}
                        </span>
                        <span className={`text-xs font-semibold ${n.is_read ? 'text-slate-400' : 'text-slate-900'}`}>
                          {n.title}
                        </span>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Card with initials circle matching the 'WA' avatar in screenshot */}
        {currentUser && (
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200/80 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${getRoleBadge(currentUser.role)}`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="px-3 py-1.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 text-xs font-medium transition cursor-pointer"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
