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

    // Allow viewing details using the record id even when branch/section/subject IDs
    // are not present (open electives or legacy records may omit them).

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
    <div className={`p-3 md:p-4 space-y-3 md:space-y-3 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
        <CardHeader>
          <CardTitle className={`text-sm md:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance Records</CardTitle>
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
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Date</TableHead>
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Subject</TableHead>
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Section</TableHead>
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Semester</TableHead>
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Branch</TableHead>
                    <TableHead className={`hidden lg:table-cell text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Present</TableHead>
                    <TableHead className={`hidden lg:table-cell text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Absent</TableHead>
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance</TableHead>
                    <TableHead className={`hidden lg:table-cell text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Status</TableHead>
                    <TableHead className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className={theme === 'dark' ? 'hover:bg-muted' : 'hover:bg-gray-50'}>
                      <TableCell className="text-xs md:text-xs lg:text-sm">{record.date}</TableCell>
                      <TableCell className="text-xs md:text-xs lg:text-sm">{record.subject}</TableCell>
                      <TableCell className="text-xs md:text-xs lg:text-sm">{record.section}</TableCell>
                      <TableCell className="text-xs md:text-xs lg:text-sm">{record.semester}</TableCell>
                      <TableCell className="text-xs md:text-xs lg:text-sm">{record.branch}</TableCell>
                      <TableCell className={`hidden lg:table-cell text-xs md:text-xs lg:text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{record.summary.present_count}</TableCell>
                      <TableCell className={`hidden lg:table-cell text-xs md:text-xs lg:text-sm font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{record.summary.absent_count}</TableCell>
                      <TableCell className="text-xs md:text-xs lg:text-sm font-semibold">{record.summary.present_percentage}%</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs md:text-xs lg:text-sm">{record.status}</TableCell>
                      <TableCell className="text-xs md:text-xs lg:text-sm">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="text-xs md:text-sm px-2 md:px-2 py-1 whitespace-nowrap bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md"
                              onClick={() => handleViewDetails(record)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className={`max-w-[95vw] md:max-w-lg lg:max-w-3xl ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}`}>
                            <DialogHeader>
                              <DialogTitle className={`text-sm md:text-sm lg:text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                                Attendance Details
                              </DialogTitle>
                              {selectedRecord && (
                                <div className={`mt-2 p-1.5 md:p-1.5 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}`}>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-1.5">
                                    <div>
                                      <p className={`font-semibold text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Date</p>
                                      <p className={`text-xs md:text-sm lg:text-base ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedRecord.date}</p>
                                    </div>
                                    <div>
                                      <p className={`font-semibold text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Subject</p>
                                      <p className={`text-xs md:text-sm lg:text-base ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedRecord.subject}</p>
                                    </div>
                                    <div>
                                      <p className={`font-semibold text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Semester & Branch</p>
                                      <p className={`text-xs md:text-sm lg:text-base ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Sem {selectedRecord.semester}, {selectedRecord.branch}</p>
                                    </div>
                                    <div>
                                      <p className={`font-semibold text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance %</p>
                                      <p className={`text-xs md:text-sm lg:text-base ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{selectedRecord.summary.present_percentage}%</p>
                                    </div>
                                    <div>
                                      <p className={`font-semibold text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Present</p>
                                      <p className={`text-xs md:text-sm lg:text-base ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{selectedRecord.summary.present_count}</p>
                                    </div>
                                    <div>
                                      <p className={`font-semibold text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Absent</p>
                                      <p className={`text-xs md:text-sm lg:text-base ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{selectedRecord.summary.absent_count}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogHeader>
                            <div className="grid gap-1.5 md:gap-1.5 py-1.5 md:py-1.5 max-h-[60vh] overflow-y-auto">
                              {loadingDetails ? (
                                <div className={`flex items-center justify-center p-2 md:p-1.5 text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                                  <Loader2 className="animate-spin mr-2" size={14} /> Loading details...
                                </div>
                              ) : detailsError ? (
                                <div className={`p-2 md:p-1.5 rounded-lg text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'bg-destructive/10 text-destructive' : 'bg-red-100 text-red-600'}`}>
                                  {detailsError}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 md:gap-1.5">
                                  <div className={`p-1.5 md:p-1.5 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                                    <h4 className={`text-xs md:text-sm lg:text-base font-semibold mb-1.5 md:mb-1.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>Present Students</h4>
                                    <div className="max-h-60 overflow-y-auto">
                                      {presentList.length > 0 ? (
                                        <ul className="space-y-2">
                                          {presentList.map((s, index) => (
                                            <li 
                                              key={s.usn} 
                                              className={`p-1.5 md:p-1 rounded-md text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'bg-card hover:bg-accent' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}
                                            >
                                              <div className="flex justify-between gap-1">
                                                <span className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{s.name}</span>
                                                <span className={`text-xs md:text-xs lg:text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{s.usn}</span>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No present students</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className={`p-1.5 md:p-1.5 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                                    <h4 className={`text-xs md:text-sm lg:text-base font-semibold mb-1.5 md:mb-1.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Absent Students</h4>
                                    <div className="max-h-60 overflow-y-auto">
                                      {absentList.length > 0 ? (
                                        <ul className="space-y-2">
                                          {absentList.map((s, index) => (
                                            <li 
                                              key={s.usn} 
                                              className={`p-1.5 md:p-1 rounded-md text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'bg-card hover:bg-accent' : 'bg-white hover:bg-gray-100'} border ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}
                                            >
                                              <div className="flex justify-between gap-1">
                                                <span className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{s.name}</span>
                                                <span className={`text-xs md:text-xs lg:text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{s.usn}</span>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No absent students</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="mt-1.5 md:mt-1.5 flex flex-col gap-1.5 md:gap-1.5 pt-1.5 md:pt-1.5 border-t border-gray-200 dark:border-border">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-1.5 md:gap-1.5">
                                  <div className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                                    {presentList.length + absentList.length} students total
                                  </div>
                                  <div className="flex flex-col md:flex-row gap-1 md:gap-1">
                                    {pdfUrl && (
                                      <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full md:w-auto px-2 md:px-2 py-0.5 md:py-0.5 rounded-md text-xs md:text-xs lg:text-sm text-center md:text-left bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-muted dark:text-foreground dark:hover:bg-accent transition-colors"
                                      >
                                        Download PDF
                                      </a>
                                    )}
                                    {selectedRecord && selectedRecord.summary && selectedRecord.summary.total_count > 0 && (
                                      <Button
                                        className="w-full md:w-auto text-xs md:text-xs lg:text-sm px-2 md:px-2 py-0.5 md:py-0.5 whitespace-nowrap bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out"
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
                                    )}
                                  </div>
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
          <CardContent className="pt-3 md:pt-4">
            <div className="flex justify-between items-center gap-2 md:gap-2">
              <div className={`text-xs md:text-xs lg:text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                Showing {records.length} of {pagination.paginationState.totalItems} records
              </div>
              <div className="flex items-center gap-1 md:gap-1">
                <Button
                  variant="outline"
                  onClick={() => pagination.goToPage(1)}
                  disabled={pagination.page === 1}
                  aria-label="First page"
                  className="text-xs md:text-xs px-1.5 md:px-2 py-0.5 md:py-0.5 whitespace-nowrap bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
                >
                  First
                </Button>

                <Button
                  variant="outline"
                  onClick={() => pagination.goToPage(pagination.page - 1)}
                  disabled={!pagination.paginationState.hasPrev}
                  aria-label="Previous page"
                  className="text-xs md:text-xs px-1.5 md:px-2 py-0.5 md:py-0.5 whitespace-nowrap bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
                >
                  Prev
                </Button>

                {/* Numeric page buttons (windowed) */}
                <div className="flex items-center space-x-0.5 md:space-x-0.5">
                  {(() => {
                    const total = pagination.paginationState.totalPages || 1;
                    const current = pagination.page || 1;
                    const maxButtons = 5;
                    let start = Math.max(1, current - Math.floor(maxButtons / 2));
                    let end = Math.min(total, start + maxButtons - 1);
                    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
                    const buttons = [];
                    for (let p = start; p <= end; p++) {
                      buttons.push(
                        <Button
                          key={p}
                          variant={p === current ? undefined : 'ghost'}
                          onClick={() => pagination.goToPage(p)}
                          aria-current={p === current ? 'page' : undefined}
                          aria-label={`Page ${p}`}
                          className={`px-1.5 md:px-2 py-0.5 md:py-0.5 text-xs md:text-xs lg:text-sm ${p === current ? 'bg-[#a259ff] text-white border-[#a259ff]' : 'bg-white text-gray-700 border border-gray-200'} rounded-md`}
                        >
                          {p}
                        </Button>
                      );
                    }
                    return buttons;
                  })()}
                </div>

                <Button
                  variant="outline"
                  onClick={() => pagination.goToPage(pagination.page + 1)}
                  disabled={!pagination.paginationState.hasNext}
                  aria-label="Next page"
                  className="text-xs md:text-xs px-1.5 md:px-2 py-0.5 md:py-0.5 whitespace-nowrap bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
                >
                  Next
                </Button>

                <Button
                  variant="outline"
                  onClick={() => pagination.goToPage(pagination.paginationState.totalPages)}
                  disabled={pagination.page === pagination.paginationState.totalPages}
                  aria-label="Last page"
                  className="text-xs md:text-xs px-1.5 md:px-2 py-0.5 md:py-0.5 whitespace-nowrap bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
                >
                  Last
                </Button>

                <span className={`text-xs md:text-xs lg:text-sm px-1.5 md:px-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>
                  Page {pagination.page} of {pagination.paginationState.totalPages}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceRecords;