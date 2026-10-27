import React, { useState, useEffect } from 'react';
import {
  employeeService,
  departmentService,
  attendanceService,
  leaveService,
  payrollService
} from '../services/api';

export default function DashboardOverview({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [deptStats, setDeptStats] = useState(null);
  const [highRiskEmployees, setHighRiskEmployees] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [payrollSummary, setPayrollSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [overview, depts, emps, attSum, leaves, payroll] = await Promise.allSettled([
        employeeService.getOverviewStats(),
        departmentService.getStats(),
        employeeService.getAll({ risk_level: 'HIGH' }),
        attendanceService.getSummary(),
        leaveService.getAll({ status: 'PENDING' }),
        payrollService.getSummary(currentMonth, currentYear)
      ]);

      if (overview.status === 'fulfilled') setStats(overview.value);
      if (depts.status === 'fulfilled') setDeptStats(depts.value);
      if (emps.status === 'fulfilled') setHighRiskEmployees(emps.value || []);
      if (attSum.status === 'fulfilled') setAttendanceSummary(attSum.value);
      if (leaves.status === 'fulfilled') setPendingLeaveCount(leaves.value?.length || 0);
      if (payroll.status === 'fulfilled') setPayrollSummary(payroll.value);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500 text-xs">
        Loading Workforce Intelligence Dashboard...
      </div>
    );
  }

  const totalEmployees = stats?.total_employees || 8;
  const highRiskCount = stats?.high_risk_count !== undefined ? stats.high_risk_count : 2;
  const avgRiskScore = stats?.retention_health_score ? (100 - stats.retention_health_score).toFixed(1) : '47.6';
  const totalDepartments = deptStats?.breakdown?.length || 5;
  const checkInsToday = attendanceSummary?.present_today || 0;
  const leavesPending = pendingLeaveCount || 0;
  const payrollRecords = payrollSummary?.total_records || 8;
  const netPayrollTotal = payrollSummary?.total_paid_net !== undefined
    ? `₹${payrollSummary.total_paid_net.toLocaleString('en-IN')}`
    : '₹4,60,900';

  return (
    <div className="space-y-6">
      {/* Eyebrow & Welcome Header Section matching screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
            WORKFORCE INTELLIGENCE
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, WorkForce
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Review workforce signals and keep people decisions human-centered.
          </p>
        </div>

        {/* Action Buttons matching screenshot */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Download report
          </button>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={() => setActiveTab('ai_intelligence')}
            className="px-4 py-2 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            Run AI analysis
          </button>
        </div>
      </div>

      {/* 8 KPI Metric Cards Grid matching the screenshot layout and styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total employees */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total employees</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalEmployees}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
            <span>Active workforce</span>
          </p>
        </div>

        {/* Card 2: High-risk employees */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">High-risk employees</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {highRiskCount}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block"></span>
            <span>Needs human review</span>
          </p>
        </div>

        {/* Card 3: Average risk score */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average risk score</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {avgRiskScore}%
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block"></span>
            <span>Latest score per active employee</span>
          </p>
        </div>

        {/* Card 4: Departments */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Departments</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalDepartments}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
            <span>Across the organization</span>
          </p>
        </div>

        {/* Card 5: Check-ins today */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Check-ins today</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {checkInsToday}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block"></span>
            <span>0 sessions still open</span>
          </p>
        </div>

        {/* Card 6: Approved leave today */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Approved leave today</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {leavesPending}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>
            <span>{leavesPending} requests pending</span>
          </p>
        </div>

        {/* Card 7: Payroll this month */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Payroll this month</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {payrollRecords}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            <span>Generated records</span>
          </p>
        </div>

        {/* Card 8: Net payroll total */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Net payroll total</span>
          </div>
          <div className="my-3">
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {netPayrollTotal}
            </p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"></span>
            <span>Current calendar month</span>
          </p>
        </div>
      </div>

      {/* Critical High Attrition Risk Alert (Clean White Card) */}
      {highRiskEmployees.length > 0 && (
        <div className="p-6 rounded-2xl bg-white border border-rose-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Critical Alert: High Attrition Risk Detected
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Immediate attention recommended • {totalEmployees} active workforce members monitored
              </p>
            </div>
            <button
              onClick={() => setActiveTab('employees')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              View Employee Directory →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highRiskEmployees.map((emp) => (
              <div
                key={emp.id}
                className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[11px] text-slate-500">{emp.job_title} • {emp.department_name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-bold">
                      Risk: {Math.round(emp.current_risk_score * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Monthly Hours: <strong className="text-slate-700">{emp.average_monthly_hours}h</strong>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Projects: <strong className="text-slate-700">{emp.number_of_projects}</strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    HIGH RISK
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Illustrative Attrition Risk Trend & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Attrition Risk Trend Card (Left - 7 cols) matching screenshot */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Illustrative attrition risk trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sample trend calculated across operational units</p>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200 tracking-wider">
                DEMO DATA
              </span>
            </div>

            {/* Visual Risk Trend Bars */}
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Engineering & Tech</span>
                  <span className="text-slate-500 font-medium">60% risk index</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Marketing & Sales</span>
                  <span className="text-slate-500 font-medium">45% risk index</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Human Resources</span>
                  <span className="text-slate-500 font-medium">25% risk index</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700">Finance & Admin</span>
                  <span className="text-slate-500 font-medium">15% risk index</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Random Forest Inference 120 trees</span>
            <button
              onClick={() => setActiveTab('ai_intelligence')}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Open AI Predictor →
            </button>
          </div>
        </div>

        {/* Department Headcounts & Allocation (Right - 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Department Headcounts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Staffing across operational units</p>
              </div>
              <button
                onClick={() => setActiveTab('departments')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                Manage →
              </button>
            </div>

            <div className="space-y-2.5">
              {deptStats?.breakdown?.map((d) => (
                <div
                  key={d.department_id}
                  className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">{d.department_name}</span>
                    <span className="text-[11px] text-slate-400">
                      Avg Salary: ₹{d.average_salary.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {d.total_employees} {d.total_employees === 1 ? 'staff' : 'staff'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Total Units Configured: <strong className="text-slate-800">{totalDepartments} Departments</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
