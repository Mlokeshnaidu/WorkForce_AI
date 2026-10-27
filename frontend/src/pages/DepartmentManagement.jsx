import React, { useState, useEffect } from 'react';
import { departmentService } from '../services/api';

export default function DepartmentManagement({ currentUser }) {
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [list, st] = await Promise.all([
        departmentService.getAll(),
        departmentService.getStats()
      ]);
      setDepartments(list);
      setStats(st);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      await departmentService.create({ name, code, description });
      setIsModalOpen(false);
      setName('');
      setCode('');
      setDescription('');
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, deptName) => {
    if (!window.confirm(`Are you sure you want to delete ${deptName}?`)) return;
    try {
      await departmentService.delete(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete department.');
    }
  };

  const canModify = currentUser && ['ADMIN', 'HR'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Departments & Roles</h2>
          <p className="text-xs text-slate-500 mt-1">Organizational units, headcounts, and role structures</p>
        </div>

        {canModify && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-4 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition self-start sm:self-auto shadow-xs"
          >
            + Create Department
          </button>
        )}
      </div>

      {/* Grid of Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-xs text-slate-400">
            Loading departments from MySQL...
          </div>
        ) : (
          departments.map((dept) => {
            const detailStat = stats?.breakdown?.find((s) => s.department_id === dept.id);
            return (
              <div
                key={dept.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {dept.code}
                    </span>
                    {currentUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDelete(dept.id, dept.name)}
                        className="px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5">{dept.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {dept.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="font-semibold text-slate-700">
                    <span>{dept.employee_count} {dept.employee_count === 1 ? 'Member' : 'Members'}</span>
                  </div>
                  {detailStat && (
                    <span className="font-semibold text-slate-700">
                      Avg: ₹{detailStat.average_salary.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Create New Department
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

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering & Technology"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ENG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows="3"
                  placeholder="Responsibilities, team mission, and scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  disabled={saving}
                  className="py-2.5 px-5 bg-[#1a56db] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {saving ? 'Creating...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
