import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardOverview from './pages/DashboardOverview';
import EmployeeDirectory from './pages/EmployeeDirectory';
import DepartmentManagement from './pages/DepartmentManagement';
import AttendanceManagement from './pages/AttendanceManagement';
import LeaveManagement from './pages/LeaveManagement';
import PayrollManagement from './pages/PayrollManagement';
import ChatCommunications from './pages/ChatCommunications';
import DocumentManagement from './pages/DocumentManagement';

// Phase 2: AI Attrition & Intelligence Pages
import AIIntelligence from './pages/AIIntelligence';
import DatasetManagement from './pages/DatasetManagement';
import WorkforceForecasting from './pages/WorkforceForecasting';

// Phase 3: Advanced Enterprise Suite Pages
import InterventionWorkflow from './pages/InterventionWorkflow';
import TaskWorkflows from './pages/TaskWorkflows';
import PerformanceReviews from './pages/PerformanceReviews';
import ReportsExport from './pages/ReportsExport';
import AuditLogs from './pages/AuditLogs';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('workforce_user');
    const token = localStorage.getItem('workforce_token');
    if (savedUser && token) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('workforce_user');
        localStorage.removeItem('workforce_token');
      }
    }
    setLoading(false);

    const handleAuthExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('workforce_token');
    localStorage.removeItem('workforce_user');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f3f6fc] flex items-center justify-center text-slate-600 text-xs gap-3">
        <span className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
        <span>Initializing Enterprise Workforce Intelligence...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#f3f6fc] flex text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen bg-[#f3f6fc]">
        <Navbar currentUser={currentUser} onLogout={handleLogout} activeTab={activeTab} />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Phase 1: Core Workforce Modules */}
          {activeTab === 'dashboard' && (
            <DashboardOverview setActiveTab={setActiveTab} />
          )}

          {activeTab === 'employees' && (
            <EmployeeDirectory currentUser={currentUser} />
          )}

          {activeTab === 'departments' && (
            <DepartmentManagement currentUser={currentUser} />
          )}

          {activeTab === 'attendance' && (
            <AttendanceManagement currentUser={currentUser} />
          )}

          {activeTab === 'leaves' && (
            <LeaveManagement currentUser={currentUser} />
          )}

          {activeTab === 'payrolls' && (
            <PayrollManagement currentUser={currentUser} />
          )}

          {activeTab === 'chats' && (
            <ChatCommunications currentUser={currentUser} />
          )}

          {activeTab === 'documents' && (
            <DocumentManagement currentUser={currentUser} />
          )}

          {/* Phase 2: AI Attrition & Intelligence Modules */}
          {activeTab === 'ai_intelligence' && (
            <AIIntelligence />
          )}

          {activeTab === 'datasets' && (
            <DatasetManagement />
          )}

          {activeTab === 'forecasting' && (
            <WorkforceForecasting />
          )}

          {/* Phase 3: Advanced Enterprise Suite Modules */}
          {activeTab === 'interventions' && (
            <InterventionWorkflow />
          )}

          {activeTab === 'tasks' && (
            <TaskWorkflows />
          )}

          {activeTab === 'performance' && (
            <PerformanceReviews />
          )}

          {activeTab === 'reports' && (
            <ReportsExport />
          )}

          {activeTab === 'audit' && (
            <AuditLogs />
          )}
        </main>
      </div>
    </div>
  );
}
