import React, { useState, useEffect } from 'react';
import { performanceService, employeeService } from '../services/api';

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    employee_id: '',
    review_period: 'Q1 2026',
    rating: 4.5,
    goals_met_percent: 95,
    strengths: '',
    areas_for_improvement: '',
    comments: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [list, sm, emps] = await Promise.all([
        performanceService.getAll(),
        performanceService.getSummary(),
        employeeService.getAll({ limit: 100 })
      ]);
      setReviews(list || []);
      setSummary(sm || null);
      setEmployees(emps.items || emps || []);
      if ((emps.items || emps || []).length > 0 && !formData.employee_id) {
        setFormData(prev => ({ ...prev, employee_id: (emps.items || emps)[0].id }));
      }
    } catch (err) {
      console.error('Failed to load performance data', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await performanceService.create(formData);
      setShowModal(false);
      setFormData({
        employee_id: employees[0]?.id || '',
        review_period: 'Q1 2026',
        rating: 4.5,
        goals_met_percent: 95,
        strengths: '',
        areas_for_improvement: '',
        comments: ''
      });
      await loadData();
    } catch (err) {
      console.error('Create review error', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Performance Reviews & Appraisals
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Performance evaluations, manager appraisals, and synchronization with AI telemetry.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#1a56db] hover:bg-blue-700 text-white font-medium text-xs transition shadow-sm cursor-pointer"
        >
          <span>New Appraisal</span>
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Total Appraisals</span>
            <span className="text-2xl font-extrabold text-slate-900 block">{summary.total_reviews}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Average Organization Rating</span>
            <span className="text-2xl font-extrabold text-blue-600 block">{summary.average_rating} / 5.0</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Top Tier Performers</span>
            <span className="text-2xl font-extrabold text-emerald-600 block">{summary.rating_distribution?.["5_star"] || 0}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Under-review Personnel</span>
            <span className="text-2xl font-extrabold text-amber-600 block">{summary.rating_distribution?.["below_3"] || 0}</span>
          </div>
        </div>
      )}

      {/* Reviews Grid */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-900 pb-2 border-b border-slate-100">
          Recorded Appraisals & Feedback ({reviews.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.length === 0 ? (
            <div className="col-span-2 py-12 text-center text-slate-400">No appraisals recorded yet.</div>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{r.employee_name}</h3>
                    <span className="text-xs text-slate-500">{r.job_title} • {r.review_period}</span>
                  </div>
                  <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-bold text-xs">
                    <span>Score: {r.rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {r.strengths && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
                      <strong className="text-emerald-700 block mb-0.5">Core Strengths:</strong>
                      {r.strengths}
                    </div>
                  )}
                  {r.areas_for_improvement && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950">
                      <strong className="text-amber-700 block mb-0.5">Development Areas:</strong>
                      {r.areas_for_improvement}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px] text-slate-500">
                  <span>Reviewer: <strong className="text-slate-700 font-normal">{r.reviewer_name}</strong></span>
                  <span>Goals Met: <strong className="text-emerald-600 font-normal">{r.goals_met_percent}%</strong></span>
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
              Submit Formal Performance Appraisal
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Select Employee</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.job_title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Review Period</label>
                  <input
                    type="text"
                    value={formData.review_period}
                    onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                    placeholder="e.g. Q1 2026"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Rating (1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Key Strengths</label>
                <textarea
                  rows="2"
                  value={formData.strengths}
                  onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  placeholder="Key competencies demonstrated..."
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Areas for Improvement</label>
                <textarea
                  rows="2"
                  value={formData.areas_for_improvement}
                  onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  placeholder="Growth areas for next cycle..."
                />
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
                  className="px-4 py-2 bg-[#1a56db] hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm cursor-pointer"
                >
                  Save Appraisal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
