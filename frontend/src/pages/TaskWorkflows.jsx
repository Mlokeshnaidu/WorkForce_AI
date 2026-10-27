import React, { useState, useEffect } from 'react';
import { taskService, employeeService } from '../services/api';

export default function TaskWorkflows() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'RETENTION',
    priority: 'HIGH',
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const loadData = async () => {
    try {
      const [list, s] = await Promise.all([
        taskService.getAll({ category: categoryFilter || undefined }),
        taskService.getStats()
      ]);
      setTasks(list || []);
      setStats(s || null);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await taskService.create(formData);
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        category: 'RETENTION',
        priority: 'HIGH',
        due_date: ''
      });
      await loadData();
    } catch (err) {
      console.error('Create task error', err);
    }
  };

  const handleToggleStatus = async (task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await taskService.update(task.id, { status: nextStatus });
      await loadData();
    } catch (err) {
      console.error('Toggle status error', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.delete(id);
      await loadData();
    } catch (err) {
      console.error('Delete task error', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Task & Workflow Management
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Retention checklists, onboarding/offboarding workflows, and operational HR tasks.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#1a56db] hover:bg-blue-700 text-white font-medium text-xs transition shadow-sm cursor-pointer"
        >
          <span>New HR Task</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Total Workflows</span>
            <span className="text-2xl font-extrabold text-slate-900 block">{stats.total_tasks}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Pending Review</span>
            <span className="text-2xl font-extrabold text-amber-600 block">{stats.pending}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">In Progress</span>
            <span className="text-2xl font-extrabold text-blue-600 block">{stats.in_progress}</span>
          </div>
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 block mb-1">Completed</span>
            <span className="text-2xl font-extrabold text-emerald-600 block">{stats.completed}</span>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            Active Tasks ({tasks.length})
          </h2>

          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              <option value="RETENTION">Retention</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="OFFBOARDING">Offboarding</option>
              <option value="COMPLIANCE">Compliance</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400">No active tasks found in this view.</div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition"
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-1 transition cursor-pointer"
                  >
                    {task.status === 'COMPLETED' ? (
                      <div className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold shadow-2xs">
                        Done
                      </div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-slate-300 rounded-md hover:border-blue-500 bg-white" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        task.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {task.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">{task.description}</p>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-1">
                      <span>
                        Assignee: <strong className="text-slate-700 font-medium">{task.assignee_name}</strong>
                      </span>
                      {task.due_date && (
                        <span>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(task.id)}
                  className="text-slate-400 hover:text-rose-600 transition p-1 text-xs cursor-pointer"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Create Workflow Task
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Task Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Schedule retention check-in"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Checklist steps and details..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="RETENTION">Retention</option>
                    <option value="ONBOARDING">Onboarding</option>
                    <option value="OFFBOARDING">Offboarding</option>
                    <option value="COMPLIANCE">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 block mb-1 font-semibold">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
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
                  className="px-4 py-2 bg-[#1a56db] hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
