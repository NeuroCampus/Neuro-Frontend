import React, { useState } from "react";
import { API_ENDPOINT } from "../../utils/config";
import { fetchWithTokenRefresh } from "../../utils/authService";

const DeanReports = () => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/college/`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      setReport(data.report || null);
    } catch (e: any) {
      setError(e.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    // Use regular window fetch to get binary and download
    const url = `${API_ENDPOINT}/dean/reports/export-excel/`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={loadReport} disabled={loading}>{loading ? 'Loading...' : 'Load Report'}</button>
        <button className="btn btn-outline" onClick={downloadExcel}>Export Excel</button>
      </div>

      {error && <div className="text-red-500">{error}</div>}

      {report && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded shadow">
            <h3 className="font-bold">Totals</h3>
            <ul className="mt-2">
              <li>Total Branches: {report.total_branches}</li>
              <li>Total Students: {report.total_students}</li>
              <li>Total Faculty: {report.total_faculty}</li>
              <li>Total Subjects: {report.total_subjects}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeanReports;
