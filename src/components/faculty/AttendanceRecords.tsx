import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { getAttendanceRecordsWithSummary, getAttendanceRecordDetails } from "@/utils/faculty_api";
import { API_BASE_URL } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { useTheme } from "@/context/ThemeContext";
import { usePagination } from "@/hooks/useOptimizations";

interface AttendanceRecord {
  id: number;
  date: string;
  subject: string | null;
  section: string | null;
  semester: number | null;
  branch: string | null;
  file_path: string | null;
  status: string;
  branch_id: number | null;
  section_id: number | null;
  subject_id: number | null;
  semester_id: number | null;
  summary: {
    present_count: number;
    absent_count: number;
    total_count: number;
    present_percentage: number;
  };
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

  const pagination = usePagination({
    queryKey: ['attendanceRecords'],
    pageSize: 20,
  });

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
  const { theme } = useTheme();

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const res = await getAttendanceRecordsWithSummary({
          page: pagination.page,
          page_size: pagination.pageSize,
        });
        if (res.success && res.data) {
          setRecords(res.data);
          pagination.updatePagination(res);
        } else {
          setError(res.message || "Failed to fetch records");
        }
      } catch (e: any) {
        setError(e.message || "Failed to fetch records");
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [pagination.page, pagination.pageSize]);

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
    <div className={`p-6 space-y-4 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className={`flex items-center justify-center p-8 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              <Loader2 className="animate-spin mr-2" /> Loading records...
            </div>
          ) : error ? (
            <div className={`p-4 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{error}</div>
          ) : (
            <ScrollArea className={`rounded ${theme === 'dark' ? 'border border-border' : 'border border-gray-300'}`}>
              <Table>
                <TableHeader className={theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}>
                  <TableRow>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Date</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Subject</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Section</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Semester</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Branch</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Present</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Absent</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Attendance %</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Status</TableHead>
                    <TableHead className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className={theme === 'dark' ? 'hover:bg-muted' : 'hover:bg-gray-50'}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>{record.section}</TableCell>
                      <TableCell>{record.semester}</TableCell>
                      <TableCell>{record.branch}</TableCell>
                      <TableCell className={theme === 'dark' ? 'text-green-400 font-semibold' : 'text-green-600 font-semibold'}>{record.summary.present_count}</TableCell>
                      <TableCell className={theme === 'dark' ? 'text-red-400 font-semibold' : 'text-red-600 font-semibold'}>{record.summary.absent_count}</TableCell>
                      <TableCell className="font-semibold">{record.summary.present_percentage}%</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                              onClick={() => handleViewDetails(record)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className={`sm:max-w-3xl max-w-[95vw] ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                            <DialogHeader>
                              <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>
                                Attendance Details
                              </DialogTitle>
                              {selectedRecord && (
                                <div className={`mt-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}`}>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Date</p>
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedRecord.date}</p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Subject</p>
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedRecord.subject} ({selectedRecord.section})</p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Semester & Branch</p>
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Sem {selectedRecord.semester}, {selectedRecord.branch}</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                                    <div>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Present</p>
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{selectedRecord.summary.present_count} Students</p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Absent</p>
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{selectedRecord.summary.absent_count} Students</p>
                                    </div>
                                    <div>
                                      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Attendance %</p>
                                      <p className={`font-medium text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedRecord.summary.present_percentage}%</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogHeader>
                            <div className="grid gap-3 py-3 max-h-[60vh] overflow-y-auto">
                              {loadingDetails ? (
                                <div className={`flex items-center justify-center p-4 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                                  <Loader2 className="animate-spin mr-2" size={16} /> Loading details...
                                </div>
                              ) : detailsError ? (
                                <div className={`p-3 rounded-lg text-sm ${theme === 'dark' ? 'bg-destructive/10 text-destructive' : 'bg-red-100 text-red-600'}`}>
                                  {detailsError}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                                    <h4 className={`text-base font-semibold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Present Students</h4>
                                    <div className="max-h-60 overflow-y-auto">
                                      {presentList.length > 0 ? (
                                        <ul className="space-y-2">
                                          {presentList.map((s, index) => (
                                            <li 
                                              key={s.usn} 
                                              className={`p-2 rounded-md text-sm ${theme === 'dark' ? 'bg-card hover:bg-accent' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}
                                            >
                                              <div className="flex justify-between">
                                                <span className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{s.name}</span>
                                                <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{s.usn}</span>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No present students</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                                    <h4 className={`text-base font-semibold mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Absent Students</h4>
                                    <div className="max-h-60 overflow-y-auto">
                                      {absentList.length > 0 ? (
                                        <ul className="space-y-2">
                                          {absentList.map((s, index) => (
                                            <li 
                                              key={s.usn} 
                                              className={`p-2 rounded-md text-sm ${theme === 'dark' ? 'bg-card hover:bg-accent' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}
                                            >
                                              <div className="flex justify-between">
                                                <span className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{s.name}</span>
                                                <span className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{s.usn}</span>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No absent students</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-200 dark:border-border">
                                <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                                  {presentList.length + absentList.length} students total
                                </div>
                                <div className="flex gap-2">
                                  {pdfUrl && (
                                    <a
                                      href={pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-muted dark:text-foreground dark:hover:bg-accent transition-colors"
                                    >
                                      Download PDF
                                    </a>
                                  )}
                                  <Button
                                    className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out text-sm px-3 py-1.5"
                                    onClick={handleExportPdf}
                                    disabled={exporting}
                                  >
                                    {exporting ? (
                                      <div className="flex items-center">
                                        <Loader2 className="animate-spin mr-1 h-3 w-3" size={12} /> Exporting...
                                      </div>
                                    ) : (
                                      "Export to PDF"
                                    )}
                                  </Button>
                                </div>
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

      {/* Pagination Controls */}
      {pagination.paginationState.totalPages > 1 && (
        <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                Showing {records.length} of {pagination.paginationState.totalItems} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => pagination.goToPage(pagination.page - 1)}
                  disabled={!pagination.paginationState.hasPrev}
                  className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                >
                  Previous
                </Button>
                <span className={`text-sm px-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                  Page {pagination.page} of {pagination.paginationState.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => pagination.goToPage(pagination.page + 1)}
                  disabled={!pagination.paginationState.hasNext}
                  className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceRecords;