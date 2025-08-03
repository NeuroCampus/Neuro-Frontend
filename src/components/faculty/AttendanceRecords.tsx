import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { getAttendanceRecordsList, viewAttendanceRecords, getAttendanceRecordDetails } from "@/utils/faculty_api";
import { API_BASE_URL } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";

interface AttendanceRecord {
  id: number;
  date: string;
  subject: string;
  section: string;
  semester: number;
  branch: string;
  file_path: string | null;
  status: string;
  branch_id: number;
  section_id: number;
  subject_id: number;
  semester_id: number;
}

interface AttendanceDetail {
  student: string;
  usn: string;
  present: number;
  total_sessions: number;
  percentage: number;
}

const AttendanceRecords = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [details, setDetails] = useState<AttendanceDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [presentList, setPresentList] = useState<{ name: string; usn: string }[]>([]);
  const [absentList, setAbsentList] = useState<{ name: string; usn: string }[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAttendanceRecordsList()
      .then((res) => {
        if (res.success && res.data) setRecords(res.data);
        else setError(res.message || "Failed to fetch records");
      })
      .catch((e) => setError(e.message || "Failed to fetch records"))
      .finally(() => setLoading(false));
  }, []);

  const handleViewDetails = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setLoadingDetails(true);
    setDetailsError("");
    setDetails([]);
    setPresentList([]);
    setAbsentList([]);
    setPdfUrl(null);
    if (!record.branch_id || !record.section_id || !record.subject_id) {
      setDetailsError("Missing class or subject ID for this record.");
      setLoadingDetails(false);
      return;
    }
    getAttendanceRecordDetails(record.id)
      .then((res) => {
        if (res.success && res.data) {
          setPresentList(res.data.present);
          setAbsentList(res.data.absent);
          console.log('Present:', res.data.present);
          console.log('Absent:', res.data.absent);
        } else {
          setDetailsError(res.message || "Failed to fetch details");
        }
      })
      .catch((e) => setDetailsError(e.message || "Failed to fetch details"))
      .finally(() => setLoadingDetails(false));
  };

  const handleExportPdf = async () => {
    if (!selectedRecord) return;
    setExporting(true);
    setPdfUrl(null);
    setDetailsError("");
    try {
      const res = await fetchWithTokenRefresh(
        `${API_BASE_URL}/faculty/generate-statistics/?file_id=${selectedRecord.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (data.success && data.data && data.data.pdf_url) {
        setPdfUrl(data.data.pdf_url);
      } else {
        setDetailsError(data.message || "Failed to generate PDF");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setDetailsError(e.message || "Failed to generate PDF");
      } else {
        setDetailsError("Failed to generate PDF");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-white">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="animate-spin mr-2" /> Loading records...</div>
          ) : error ? (
            <div className="text-red-600 p-4">{error}</div>
          ) : (
            <ScrollArea className="rounded border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>{record.section}</TableCell>
                      <TableCell>{record.semester}</TableCell>
                      <TableCell>{record.branch}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => handleViewDetails(record)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Details Modal/Section */}
          {selectedRecord && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Attendance Details for {selectedRecord.date} - {selectedRecord.subject} ({selectedRecord.section})</h3>
              <div className="flex gap-8">
                <div>
                  <h4 className="font-semibold">Present Students</h4>
                  <ul className="list-disc ml-6">
                    {presentList.map((s) => (
                      <li key={s.usn}>{s.name} ({s.usn})</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Absent Students</h4>
                  <ul className="list-disc ml-6">
                    {absentList.map((s) => (
                      <li key={s.usn}>{s.name} ({s.usn})</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <button className="btn btn-primary" onClick={handleExportPdf} disabled={exporting}>
                  {exporting ? "Exporting..." : "Export to PDF"}
                </button>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="ml-4 text-blue-600 underline">Download PDF</a>
                )}
              </div>
              {detailsError && <div className="text-red-600 mt-2">{detailsError}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceRecords;
