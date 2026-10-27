import React, { useState, useEffect } from 'react';
import { leaveService, employeeService } from '../services/api';

export default function LeaveManagement({ currentUser }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [balances, setBalances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  // Apply Leave Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'ANNUAL',
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [empData, allLeaves] = await Promise.all([
        employeeService.getAll(),
        leaveService.getAll()
      ]);
      const empList = Array.isArray(empData) ? empData : (empData?.items || []);
      const leaveList = Array.isArray(allLeaves) ? allLeaves : (allLeaves?.items || []);
      setEmployees(empList);
      setLeaves(leaveList);

      if (empList.length > 0) {
        const firstId = empList[0].id;
        setSelectedEmpId(firstId);
        setFormData((prev) => ({ ...prev, employee_id: firstId }));
        await loadBalances(firstId);
      }
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async (empId) => {
    try {
      const data = await leaveService.getBalances(empId);
      const balList = Array.isArray(data) ? data : (data?.balances || []);
      setBalances(balList);
    } catch (err) {
      console.error('Failed to load balances:', err);
      setBalances([]);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await leaveService.apply({
        ...formData,
        employee_id: parseInt(formData.employee_id)
      });
      setIsModalOpen(false);
      setFormData({
        employee_id: selectedEmpId,
        leave_type: 'ANNUAL',
        start_date: '',
        end_date: '',
        reason: ''
      });
      const updated = await leaveService.getAll();
      setLeaves(Array.isArray(updated) ? updated : (updated?.items || []));
      loadBalances(selectedEmpId);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (leaveId, decision) => {
    const notes = prompt(`Enter optional review notes for ${decision}:`) || '';
    try {
      await leaveService.review(leaveId, {
        status: decision,
        review_notes: notes
      });
      const updated = await leaveService.getAll();
      setLeaves(Array.isArray(updated) ? updated : (updated?.items || []));
      if (selectedEmpId) loadBalances(selectedEmpId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to review leave.');
    }
  };

  const canReview = currentUser && ['ADMIN', 'HR', 'MANAGER'].includes(currentUser?.role?.toUpperCase());
  const pendingLeaves = (leaves || []).filter((l) => l.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave Management</h2>
          <p className="text-xs text-slate-500 mt-1">Leave balance allocations, approval workflows, and vacation tracking</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition self-start sm:self-auto shadow-xs"
        >
          + Apply for Leave
        </button>
      </div>

      {/* Leave Entitlement & Balance Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leave Balance Entitlements</span>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setFormData((prev) => ({ ...prev, employee_id: e.target.value }));
                loadBalances(e.target.value);
              }}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400">Standard Annual Allowance</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {balances.map((b) => (
            <div key={b.leave_type} className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                {b.leave_type} Leave
              </span>
              <p className="text-2xl font-extrabold text-slate-900">
                {b.remaining} <span className="text-xs text-slate-400 font-normal">/ {b.entitled} days left</span>
              </p>
              <div className="h-1.5 w-full bg-slate-200 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${(b.remaining / b.entitled) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Approval Requests Section (For HR/Managers/Admin) */}
      {canReview && pendingLeaves.length > 0 && (
        <div className="p-6 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-bold text-amber-900">
              Pending Leave Approvals ({pendingLeaves.length} requests awaiting action)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingLeaves.map((l) => (
              <div
                key={l.id}
                className="p-4 bg-white border border-amber-200 rounded-xl flex items-center justify-between shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{l.employee_name}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong>{l.leave_type}</strong> • {l.days_count} {l.days_count === 1 ? 'day' : 'days'} ({l.start_date} to {l.end_date})
                  </p>
                  <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">"{l.reason}"</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleReview(l.id, 'APPROVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(l.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Leave Applications & History</h3>
          <span className="text-xs text-slate-400">{leaves.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Dates</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Review Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{l.employee_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {l.leave_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {l.start_date} to {l.end_date}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                    {l.days_count} {l.days_count === 1 ? 'day' : 'days'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{l.reason}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 italic">
                    {l.review_notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Submit Leave Application
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 rounded-lg bg-slate-100 cursor-pointer font-semibold text-xs"
              >
                Close
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.first_name} {e.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Leave Category</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="ANNUAL">Annual Leave (Vacation)</option>
                  <option value="SICK">Sick Leave (Medical)</option>
                  <option value="CASUAL">Casual Leave (Personal)</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Reason for Leave</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Provide context for manager approval..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-5 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
