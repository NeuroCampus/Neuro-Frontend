import React, { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { publicViewResultByToken } from '@/utils/coe_api'

const ResultsView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [usn, setUsn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const calcPassPercent = (marks: any[]) => {
    if (!Array.isArray(marks) || marks.length === 0) return null;
    const total = marks.length;
    const passed = marks.filter((m: any) => m.status === 'pass').length;
    return Math.round((passed / total) * 100);
  };

  const fetchResult = async () => {
    setError(null);
    setResult(null);
    setMessage(null);
    if (!token) {
      setError('Invalid result link');
      return;
    }
    if (!usn) {
      setError('Please enter your USN');
      return;
    }

    setLoading(true);
    try {
      const res = await publicViewResultByToken(token, usn.trim());
      if (!res || !res.success) {
        setError(res?.message || 'Failed to fetch result');
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

  const exportMarksCard = async () => {
    if (!result) {
      setMessage('No result to export');
      return;
    }
    setExporting(true);
    setMessage(null);
    try {
      // dynamic import to keep bundle small (html2canvas & jspdf are in deps)
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      if (!cardRef.current) {
        setMessage('Export failed: preview element missing');
        setExporting(false);
        return;
      }

      // ensure white background
      const canvas = await html2canvas(cardRef.current as HTMLElement, { backgroundColor: '#ffffff', scale: 2 });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth - 20; // margin
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      const filename = `${(result.student?.usn || usn || 'marks')}_marks_card.pdf`;
      pdf.save(filename);
      setMessage('Exported marks card');
    } catch (e: any) {
      setMessage(e?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const passPercent = result ? calcPassPercent(result.marks || []) : null;

  return (
    <div className="min-h-screen flex items-start justify-center bg-white py-8 px-4">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <img src="/logo.jpeg" alt="AMC Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AMC - Neuro Campus</h1>
              <p className="text-xs text-gray-500">Official marks portal</p>
            </div>
          </div>
          <div className="text-sm text-gray-600 text-right">Secure public result view</div>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-700 font-medium">Instructions</div>
          <ul className="text-xs text-gray-600 mt-2 list-disc list-inside space-y-1">
            <li>Enter your USN exactly as on your ID (input will convert to UPPERCASE).</li>
            <li>Results shown are official. Use the export to download a marks card.</li>
            <li>Passing requires meeting the minimum criteria set by the examination board.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start mb-4">
          <Input value={usn} onChange={(e: any) => setUsn(String(e.target.value).toUpperCase())} placeholder="Enter USN (e.g. 25CI003)" maxLength={20} className="bg-white text-gray-900 border border-gray-300" />
          <div className="flex-shrink-0">
            <Button onClick={fetchResult} disabled={loading}className="bg-indigo-600 hover:bg-indigo-700 text-white">{loading ? 'Loading...' : 'View'}</Button>
          </div>
        </div>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {message && <div className="text-sm text-gray-700 mb-4">{message}</div>}

        {result && result.success && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">{result.declared_on ? 'Declared on: ' + result.declared_on : 'Results declared'}</div>
              <div className="flex items-center gap-2">
                <Button onClick={exportMarksCard} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700 text-white">{exporting ? 'Exporting...' : 'Export PDF'}</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <div className="text-gray-700"><strong>Name:</strong> <span className="text-gray-900">{result.student?.name || '-'}</span></div>
                <div className="text-gray-700"><strong>USN:</strong> <span className="text-gray-900">{result.student?.usn || usn}</span></div>
              </div>
             
            </div>

            <div className="rounded-md overflow-hidden border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2 border-b text-gray-700">Subject</th>
                      <th className="p-2 border-b text-gray-700">Code</th>
                      <th className="p-2 border-b text-gray-700 text-right">CIE</th>
                      <th className="p-2 border-b text-gray-700 text-right">SEE</th>
                      <th className="p-2 border-b text-gray-700 text-right">Total</th>
                      <th className="p-2 border-b text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(result.marks) && result.marks.length > 0 ? (
                      result.marks.map((m: any, idx: number) => (
                        <tr key={idx} className="odd:bg-gray-50 even:bg-white">
                          <td className="p-2 text-gray-900">{m.subject}</td>
                          <td className="p-2 text-gray-700">{m.subject_code}</td>
                          <td className="p-2 text-gray-900 text-right">{m.cie ?? '-'}</td>
                          <td className="p-2 text-gray-900 text-right">{m.see ?? '-'}</td>
                          <td className="p-2 text-gray-900 text-right">{m.total ?? '-'}</td>
                          <td className={m.status === 'pass' ? 'p-2 text-green-600' : 'p-2 text-red-600'}>{m.status ?? '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2 text-gray-600" colSpan={6}>No marks available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-gray-700"><strong>Total Marks:</strong> <span className="text-gray-900">{result.aggregate?.total_marks ?? '-'}</span></div>
              <div className="text-gray-700"><strong>Overall Status:</strong> <span className={result.aggregate?.overall_status === 'pass' ? 'text-green-600' : 'text-red-600'}> {result.aggregate?.overall_status ?? '-'}</span></div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded text-sm text-gray-700">
              <strong>Notes:</strong>
              <div className="text-xs text-gray-600 mt-1">This marks card is official. For disputes contact the examination office within 7 days.</div>
            </div>

            <div style={{ position: 'absolute', left: -9999, top: 0 }}>
              <div ref={cardRef as any} style={{ width: 800, padding: 20, background: '#fff', color: '#000' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src="/logo.jpeg" alt="AMC" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>AMC - Neuro Campus</div>
                    <div style={{ fontSize: 12 }}>Official Marks Card</div>
                  </div>
                </div>
                <hr style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div><strong>Name:</strong> {result.student?.name || '-'}</div>
                  <div><strong>USN:</strong> {result.student?.usn || usn}</div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 6 }}>Subject</th>
                      <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 6 }}>Code</th>
                      <th style={{ borderBottom: '1px solid #ddd', textAlign: 'right', padding: 6 }}>CIE</th>
                      <th style={{ borderBottom: '1px solid #ddd', textAlign: 'right', padding: 6 }}>SEE</th>
                      <th style={{ borderBottom: '1px solid #ddd', textAlign: 'right', padding: 6 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(result.marks) && result.marks.map((m: any, i: number) => (
                      <tr key={i}>
                        <td style={{ padding: 6 }}>{m.subject}</td>
                        <td style={{ padding: 6 }}>{m.subject_code}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{m.cie ?? '-'}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{m.see ?? '-'}</td>
                        <td style={{ padding: 6, textAlign: 'right' }}>{m.total ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>Total:</strong> {result.aggregate?.total_marks ?? '-'}</div>
                  <div><strong>Status:</strong> {result.aggregate?.overall_status ?? '-'}</div>
                </div>
                <div style={{ marginTop: 18, fontSize: 11 }}>This is an official marks card generated from AMC - Neuro Campus.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultsView
