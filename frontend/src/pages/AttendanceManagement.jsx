import React, { useState, useEffect } from 'react';
import { attendanceService, employeeService } from '../services/api';

export default function AttendanceManagement({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedShift, setSelectedShift] = useState('MORNING');
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [empList, stats] = await Promise.all([
        employeeService.getAll(),
        attendanceService.getSummary()
      ]);
      setEmployees(empList);
      setSummary(stats);

      if (empList.length > 0) {
        const firstId = empList[0].id;
        setSelectedEmpId(firstId);
        await loadTodayStatus(firstId);
        await loadHistory(firstId);
      }
    } catch (err) {
      console.error('Failed to load attendance initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = async (e) => {
    const empId = e.target.value;
    setSelectedEmpId(empId);
    await loadTodayStatus(empId);
    await loadHistory(empId);
  };

  const loadTodayStatus = async (empId) => {
    try {
      const data = await attendanceService.getTodayStatus(empId);
      setTodayStatus(data);
    } catch (err) {
      setTodayStatus({ checked_in: false, checked_out: false });
    }
  };

  const loadHistory = async (empId) => {
    try {
      const logs = await attendanceService.getHistory({ employee_id: empId });
      setHistory(logs || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmpId) return;
    setPunching(true);
    try {
      await attendanceService.checkIn({
        employee_id: parseInt(selectedEmpId),
        shift_type: selectedShift,
        notes: 'Clocked in via WorkForce AI Pro Dashboard'
      });
      loadTodayStatus(selectedEmpId);
      loadHistory(selectedEmpId);
      const updatedSummary = await attendanceService.getSummary();
      setSummary(updatedSummary);
    } catch (err) {
      alert(err.response?.data?.detail || 'Check-in failed.');
    } finally {
      setPunching(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedEmpId) return;
    setPunching(true);
    try {
      await attendanceService.checkOut({
        employee_id: parseInt(selectedEmpId),
        notes: 'Shift completed'
      });
      loadTodayStatus(selectedEmpId);
      loadHistory(selectedEmpId);
      const updatedSummary = await attendanceService.getSummary();
      setSummary(updatedSummary);
    } catch (err) {
      alert(err.response?.data?.detail || 'Check-out failed.');
    } finally {
      setPunching(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === parseInt(selectedEmpId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance & Shifts</h2>
          <p className="text-xs text-slate-500 mt-1">Biometric shifts, clock-in tracking, and overtime calculation</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Today's Attendance Rate</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">{summary?.attendance_rate || 0}%</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {summary?.present_today || 0} of {summary?.total_workforce || 0} clocked in
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Overtime Logged</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">{summary?.total_overtime_hours || 0} hrs</p>
          <p className="text-[11px] text-slate-400 mt-1">Over regular 8-hour shifts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Avg Working Hours</span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{summary?.average_work_hours || 0} hrs</p>
          <p className="text-[11px] text-slate-400 mt-1">Daily average per employee</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Shifts Configured</span>
          </div>
          <p className="text-3xl font-extrabold text-purple-600">4 Types</p>
          <p className="text-[11px] text-slate-400 mt-1">Morning, Evening, Night, Remote</p>
        </div>
      </div>

      {/* Clock In / Out Action Panel */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Punch Clock Terminal</span>
            <h3 className="text-base font-bold text-slate-900">Record Shift Punch</h3>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Employee selector */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-medium">Select Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={handleEmployeeChange}
                  className="py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name} ({e.job_title})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift type */}
              <div>
                <label className="block text-[11px] text-slate-500 mb-1 font-medium">Shift Type</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  disabled={todayStatus?.checked_in}
                  className="py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer disabled:opacity-50"
                >
                  <option value="MORNING">Morning (09:00 - 17:00)</option>
                  <option value="EVENING">Evening (13:00 - 21:00)</option>
                  <option value="NIGHT">Night (21:00 - 05:00)</option>
                  <option value="REMOTE">Remote (Flexible)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!todayStatus?.checked_in ? (
              <button
                onClick={handleCheckIn}
                disabled={punching}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-50 shadow-xs"
              >
                Clock In Now
              </button>
            ) : !todayStatus?.checked_out ? (
              <button
                onClick={handleCheckOut}
                disabled={punching}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-50 shadow-xs"
              >
                Clock Out & Calculate Hours
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                Shift Complete ({todayStatus.work_hours} hrs, {todayStatus.overtime_hours} hrs OT)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Attendance Log for {selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employee'}
          </h3>
          <span className="text-xs text-slate-400">{history.length} records in MySQL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Check-In</th>
                <th className="py-3 px-4">Check-Out</th>
                <th className="py-3 px-4">Work Hours</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No attendance records logged yet for this employee.
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{r.date}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {r.shift_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                        <span className="text-amber-600 font-medium">In Progress</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {r.work_hours} hrs
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {r.overtime_hours > 0 ? (
                        <span className="text-xs font-bold text-amber-600">+{r.overtime_hours} hrs</span>
                      ) : (
                        <span className="text-slate-400">0.0 hrs</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
