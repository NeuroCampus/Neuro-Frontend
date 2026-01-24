import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { publicViewResultByToken } from "@/utils/coe_api";
import { useTheme } from "@/context/ThemeContext";

const ResultsView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [usn, setUsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const { theme } = useTheme();

  const fetchResult = async () => {
    setError(null);
    setResult(null);
    if (!token) {
      setError("Invalid result link");
      return;
    }
    if (!usn) {
      setError("Please enter your USN");
      return;
    }

    setLoading(true);
    try {
      const res = await publicViewResultByToken(token, usn.trim());
      if (!res || !res.success) {
        setError(res?.message || "Failed to fetch result");
        setResult(null);
      } else {
        setResult(res);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-foreground'}`}>View Exam Result</h2>

      <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Enter your USN to view the published result for this link.</p>

      <div className="flex gap-2 mb-4">
        <Input value={usn} onChange={(e: any) => setUsn(e.target.value)} placeholder="Enter USN (e.g. 25CI003)" />
        <Button onClick={fetchResult} disabled={loading}>{loading ? 'Loading...' : 'View'}</Button>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {result && result.success && (
        <div className="mt-6">
          <div className="mb-4">
            <strong className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}>Name:</strong> <span className={theme === 'dark' ? 'text-white' : 'text-foreground'}> {result.student?.name || '-'}</span> <br />
            <strong className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}>USN:</strong> <span className={theme === 'dark' ? 'text-white' : 'text-foreground'}> {result.student?.usn || usn}</span>
          </div>

          <div className={`rounded-md overflow-hidden border ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="text-left">
                <th className={`p-2 border-b ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Subject</th>
                <th className={`p-2 border-b ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Code</th>
                <th className={`p-2 border-b ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>CIE</th>
                <th className={`p-2 border-b ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>SEE</th>
                <th className={`p-2 border-b ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Total</th>
                <th className={`p-2 border-b ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(result.marks) && result.marks.length > 0 ? (
                result.marks.map((m: any, idx: number) => (
                  <tr key={idx} className={theme === 'dark' ? 'odd:bg-slate-800 even:bg-transparent' : 'odd:bg-gray-50 even:bg-white'}>
                    <td className={`p-2 align-top ${theme === 'dark' ? 'text-white' : ''}`}>{m.subject}</td>
                    <td className={`p-2 align-top ${theme === 'dark' ? 'text-muted-foreground' : ''}`}>{m.subject_code}</td>
                    <td className={`p-2 align-top ${theme === 'dark' ? 'text-white' : ''}`}>{m.cie ?? '-'}</td>
                    <td className={`p-2 align-top ${theme === 'dark' ? 'text-white' : ''}`}>{m.see ?? '-'}</td>
                    <td className={`p-2 align-top ${theme === 'dark' ? 'text-white' : ''}`}>{m.total ?? '-'}</td>
                    <td className={`p-2 align-top ${m.status === 'pass' ? 'text-green-400' : 'text-red-400'}`}>{m.status ?? '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className={`p-2 ${theme === 'dark' ? 'text-muted-foreground' : ''}`} colSpan={6}>No marks available</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="mt-4">
            <strong className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}>Total Marks:</strong> <span className={theme === 'dark' ? 'text-white' : 'text-foreground'}> {result.aggregate?.total_marks ?? '-'}</span> <br />
            <strong className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}>Overall Status:</strong> <span className={result.aggregate?.overall_status === 'pass' ? 'text-green-400' : 'text-red-400'}> {result.aggregate?.overall_status ?? '-'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsView;
