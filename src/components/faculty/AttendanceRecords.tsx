import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { getAttendanceRecordsList, getAttendanceRecordDetails } from "@/utils/faculty_api";
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
  percentage: number | string;
}

const AttendanceRecords = () => {
  const formatAttendancePercentage = (percentage: number | string): string => {
    if (percentage === "NA" || percentage === null || percentage === undefined) {
      return "NA";
    }
    if (typeof percentage === "string") {
      return percentage;
    }
    return `${percentage}%`;
  };

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [presentList, setPresentList] = useState<{ name: string; usn: string }[]>([]);
  const [absentList, setAbsentList] = useState<{ name: string; usn: string }[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
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
    <div className="p-6 space-y-4 bg-[#1c1c1e] text-gray-200">
      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-200">Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-400">
              <Loader2 className="animate-spin mr-2" /> Loading records...
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">{error}</div>
          ) : (
            <ScrollArea className="rounded border border-gray-700">
              <Table>
                <TableHeader className="bg-[#1c1c1e]">
                  <TableRow>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Subject</TableHead>
                    <TableHead className="text-gray-300">Section</TableHead>
                    <TableHead className="text-gray-300">Semester</TableHead>
                    <TableHead className="text-gray-300">Branch</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className="hover:bg-[#2e2e31]">
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>{record.section}</TableCell>
                      <TableCell>{record.semester}</TableCell>
                      <TableCell>{record.branch}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                              onClick={() => handleViewDetails(record)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px] bg-[#1c1c1e] text-gray-200 border border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-gray-200">
                                Attendance Details for {selectedRecord?.date} - {selectedRecord?.subject} ({selectedRecord?.section})
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              {loadingDetails ? (
                                <div className="flex items-center justify-center p-8 text-gray-400">
                                  <Loader2 className="animate-spin mr-2" /> Loading details...
                                </div>
                              ) : detailsError ? (
                                <div className="text-red-500 p-4">{detailsError}</div>
                              ) : (
                                <div className="flex gap-8">
                                  <div>
                                    <h4 className="font-semibold text-green-400">Present Students</h4>
                                    <ul className="list-disc ml-6 max-h-64 overflow-y-auto">
                                      {presentList.map((s) => (
                                        <li key={s.usn}>{s.name} ({s.usn})</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-red-400">Absent Students</h4>
                                    <ul className="list-disc ml-6 max-h-64 overflow-y-auto">
                                      {absentList.map((s) => (
                                        <li key={s.usn}>{s.name} ({s.usn})</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              )}
                              <div className="mt-4 flex justify-end">
                                <Button
                                  className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                                  onClick={handleExportPdf}
                                  disabled={exporting}
                                >
                                  {exporting ? "Exporting..." : "Export to PDF"}
                                </Button>
                                {pdfUrl && (
                                  <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-4 px-4 py-2 rounded-lg text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
                                  >
                                    Download PDF
                                  </a>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceRecords;
