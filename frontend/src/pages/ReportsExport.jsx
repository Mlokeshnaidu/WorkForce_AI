import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';

export default function ReportsExport() {
  const [reports, setReports] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await reportService.getSummary();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports', err);
    }
  };

  const triggerDownload = (endpoint, filename) => {
    const token = localStorage.getItem('workforce_token');
    const url = `http://localhost:8000${endpoint}`;
    setDownloading(endpoint);
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename || endpoint.split('/').filter(Boolean).pop();
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(err => {
        console.error('Download error', err);
        alert('Failed to download report. Please ensure you have valid permissions.');
      })
      .finally(() => setDownloading(null));
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Reports & Export Center (Module 19)
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Export enterprise workforce telemetry, attrition flight risks, payroll ledgers, and attendance in CSV, Excel (.xlsx), and PDF formats.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-6 shadow-xs flex flex-col justify-between transition space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  Report ID: {report.id}
                </span>
                <div className="flex items-center gap-1.5">
                  {(report.formats || ['CSV']).map((fmt) => (
                    <span
                      key={fmt}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        fmt === 'PDF'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : fmt === 'EXCEL'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{report.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {report.description}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-[11px] text-slate-400">
                Live database synced
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                {report.endpoints ? (
                  Object.entries(report.endpoints).map(([fmt, ep]) => (
                    <button
                      key={fmt}
                      disabled={downloading === ep}
                      onClick={() => triggerDownload(ep, `${report.id}_report.${fmt.toLowerCase() === 'excel' ? 'xlsx' : fmt.toLowerCase()}`)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs ${
                        fmt === 'PDF'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : fmt === 'EXCEL'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-[#1a56db] hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>Export {fmt}</span>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => triggerDownload(report.endpoint)}
                    className="px-3.5 py-1.5 bg-[#1a56db] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer"
                  >
                    <span>Export CSV</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
