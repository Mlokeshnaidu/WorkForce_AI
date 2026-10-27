import React, { useState, useEffect } from 'react';
import { interventionService, employeeService } from '../services/api';

export default function InterventionWorkflow() {
  const [interventions, setInterventions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    employee_id: '',
    strategy_type: 'WORKLOAD_REDUCTION',
    title: '',
    description: '',
    initial_risk_score: 0.75,
    target_risk_score: 0.25,
    cost_budget: 2500
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const [list, emps] = await Promise.all([
        interventionService.getAll({ status_filter: statusFilter || undefined }),
        employeeService.getAll({ limit: 100 })
      ]);
      setInterventions(list || []);
      setEmployees(emps.items || emps || []);
      if ((emps.items || emps || []).length > 0 && !formData.employee_id) {
        setFormData(prev => ({ ...prev, employee_id: (emps.items || emps)[0].id }));
      }
    } catch (err) {
      console.error('Failed to load interventions', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await interventionService.create(formData);
      setShowModal(false);
      setFormData({
        employee_id: employees[0]?.id || '',
        strategy_type: 'WORKLOAD_REDUCTION',
        title: '',
        description: '',
        initial_risk_score: 0.75,
        target_risk_score: 0.25,
        cost_budget: 2500
      });
      await loadData();
    } catch (err) {
      console.error('Create error', err);
      alert('Failed to create retention plan: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateStatus = async (id, newStatus, currentRisk) => {
    try {
      await interventionService.update(id, {
        status: newStatus,
        current_risk_score: currentRisk
      });
      await loadData();
    } catch (err) {
      console.error('Update status error', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Retention Interventions & Strategy Tracker
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Prescriptive retention action plans, budget tracking, and retention success metrics.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#1a56db] hover:bg-blue-700 text-white font-medium text-xs transition shadow-sm cursor-pointer"
        >
          <span>New Retention Plan</span>
        </button>
      </div>

      {/* Filter and Content List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Active Retention Plans ({interventions.length})
          </h2>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interventions.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">
              No retention interventions found matching current criteria.
            </div>
          ) : (
            interventions.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl p-5 transition space-y-4 shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
                      {item.strategy_type.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{item.title}</h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                      {item.employee_name} ({item.job_title})
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                    item.status === 'SUCCESSFUL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    item.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                  {item.description || 'Proactive retention initiative configured to mitigate key flight drivers.'}
                </p>

                {/* Risk Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Flight Risk Transition</span>
                    <span className="text-slate-800 font-medium">
                      {Math.round(item.initial_risk_score * 100)}% → <strong className="text-emerald-600">{Math.round(item.current_risk_score * 100)}%</strong> (Target: {Math.round(item.target_risk_score * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${Math.round(item.current_risk_score * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                  <span className="text-slate-500">
                    Budget: <strong className="text-slate-900">₹{item.cost_budget?.toLocaleString('en-IN')}</strong>
                  </span>

                  {item.status === 'IN_PROGRESS' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'SUCCESSFUL', 0.18)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg font-semibold transition text-xs"
                      >
                        Mark Retained
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'FAILED', item.current_risk_score)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-semibold transition text-xs"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Configure Prescriptive Retention Plan
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Select Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const emp = employees.find(x => x.id === Number(empId));
                    setFormData({
                      ...formData,
                      employee_id: empId,
                      initial_risk_score: emp?.current_risk_score || 0.75,
                      title: `Retention Strategy for ${emp?.first_name || ''} ${emp?.last_name || ''}`
                    });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.job_title} - {Math.round((emp.current_risk_score || 0.2) * 100)}% Risk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Intervention Strategy</label>
                <select
                  value={formData.strategy_type}
                  onChange={(e) => setFormData({ ...formData, strategy_type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  <option value="WORKLOAD_REDUCTION">Workload & Overtime Reduction</option>
                  <option value="SALARY_INCREMENT">Targeted Compensation Review</option>
                  <option value="PROMOTION">Promotional Career Advancement</option>
                  <option value="MENTORSHIP">Executive Mentorship & 1-on-1s</option>
                  <option value="TEAM_TRANSFER">Internal Department Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Plan Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  placeholder="e.g., Marcus Vance Overtime Balancing"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Action Plan Details</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  placeholder="Specific operational adjustments, timeline, and deliverables..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Incentive Budget (₹ INR)</label>
                  <input
                    type="number"
                    value={formData.cost_budget}
                    onChange={(e) => setFormData({ ...formData, cost_budget: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Target Risk Score</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.95"
                    value={formData.target_risk_score}
                    onChange={(e) => setFormData({ ...formData, target_risk_score: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a56db] hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm"
                >
                  Launch Intervention Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
