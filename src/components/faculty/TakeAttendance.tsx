import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Check, X, UploadCloud } from "lucide-react";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { getTakeAttendanceBootstrap, takeAttendance, aiAttendance, FacultyAssignment, ClassStudent, GetTakeAttendanceBootstrapResponse } from "@/utils/faculty_api";
import { useFacultyAssignmentsQuery } from "@/hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";

const TakeAttendance = () => {
  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError } = useFacultyAssignmentsQuery();
  const [branchId, setBranchId] = useState<number | null>(null);
  const [semesterId, setSemesterId] = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [attendance, setAttendance] = useState<{ [studentId: number]: boolean }>({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [recentRecords, setRecentRecords] = useState<GetTakeAttendanceBootstrapResponse['data']['recent_records']>([]);
  const [aiPhoto, setAiPhoto] = useState<File | null>(null);
  const [aiResults, setAiResults] = useState<any>(null);
  const [processingAI, setProcessingAI] = useState(false);
  const { theme } = useTheme();

  // Assignments are now loaded via context

  // Reset selections if branch/semester/section/subject changes
  useEffect(() => {
    setStudents([]);
    setAttendance({});
    setRecentRecords([]);
    setSuccessMsg("");
    setErrorMsg("");
    if (branchId && semesterId && sectionId && subjectId) {
      setLoadingStudents(true);
      getTakeAttendanceBootstrap({
        branch_id: branchId.toString(),
        semester_id: semesterId.toString(),
        section_id: sectionId.toString(),
        subject_id: subjectId.toString(),
      })
        .then(response => {
          if (response.success && response.data) {
            setStudents(response.data.students);
            setRecentRecords(response.data.recent_records || []);
          } else {
            setErrorMsg(response.message || "Failed to load data");
          }
        })
        .catch(e => setErrorMsg(e.message || "Failed to load data"))
        .finally(() => setLoadingStudents(false));
    }
  }, [branchId, semesterId, sectionId, subjectId]);

  // Dropdown options (deduplicated by id)
  const branches = Array.from(new Map(assignments.map(a => [a.branch_id, { id: a.branch_id, name: a.branch }])).values());
  const semesters = branchId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId).map(a => [a.semester_id, { id: a.semester_id, name: a.semester.toString() }])).values()) : [];
  const sections = branchId && semesterId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId && a.semester_id === semesterId).map(a => [a.section_id, { id: a.section_id, name: a.section }])).values()) : [];
  const subjects = branchId && semesterId && sectionId ? Array.from(new Map(assignments.filter(a => a.branch_id === branchId && a.semester_id === semesterId && a.section_id === sectionId).map(a => [a.subject_id, { id: a.subject_id, name: a.subject_name }])).values()) : [];

  const handleAttendance = (studentId: number, present: boolean) => {
    setAttendance(prev => ({ ...prev, [studentId]: present }));
  };

  const handleSubmit = async () => {
    if (!branchId || !semesterId || !sectionId || !subjectId) return;
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const attendanceArr = students.map(s => ({ student_id: s.id.toString(), status: !!attendance[s.id] }));
      const res = await takeAttendance({
        branch_id: branchId.toString(),
        semester_id: semesterId.toString(),
        section_id: sectionId.toString(),
        subject_id: subjectId.toString(),
        method: "manual",
        attendance: attendanceArr,
      });
      if (res.success) {
        setSuccessMsg("Attendance submitted successfully!");
      } else {
        setErrorMsg(res.message || "Failed to submit attendance");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorMsg(e.message || "Failed to submit attendance");
      } else {
        setErrorMsg("Failed to submit attendance");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAiPhoto(file);
      setAiResults(null);
      setErrorMsg("");
    }
  };

  const handleAIProcess = async () => {
    if (!branchId || !semesterId || !sectionId || !subjectId || !aiPhoto) return;
    setProcessingAI(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await aiAttendance({
        branch_id: branchId.toString(),
        semester_id: semesterId.toString(),
        section_id: sectionId.toString(),
        subject_id: subjectId.toString(),
        photo: aiPhoto,
      });
      if (res.success) {
        setAiResults(res.data);
        setSuccessMsg("AI attendance processed successfully!");
      } else {
        setErrorMsg(res.message || "Failed to process AI attendance");
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setErrorMsg(e.message || "Failed to process AI attendance");
      } else {
        setErrorMsg("Failed to process AI attendance");
      }
    } finally {
      setProcessingAI(false);
    }
  };

  return (
    <div className={`space-y-4 p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}>
        <CardHeader>
          <CardTitle>Take Attendance</CardTitle>
          <CardDescription className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Record student attendance for your classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Select value={branchId?.toString()} onValueChange={v => setBranchId(Number(v))}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {branches.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={semesterId?.toString()} onValueChange={v => setSemesterId(Number(v))} disabled={!branchId}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} disabled={!branchId}>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {semesters.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={sectionId?.toString()} onValueChange={v => setSectionId(Number(v))} disabled={!semesterId}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} disabled={!semesterId}>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={subjectId?.toString()} onValueChange={v => setSubjectId(Number(v))} disabled={!sectionId}>
                <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'} disabled={!sectionId}>
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue="manual">
              <TabsList className={`inline-flex h-10 items-center justify-center rounded-md p-1 ${theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-500'}`}>
                <TabsTrigger 
                  value="manual" 
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm ${theme === 'dark' 
                    ? 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' 
                    : 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
                >
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger 
                  value="ai" 
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm ${theme === 'dark' 
                    ? 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground' 
                    : 'data-[state=active]:bg-[#a259ff] data-[state=active]:text-white data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-900'}`}
                >
                  AI Processing
                </TabsTrigger>
              </TabsList>

              {/* Manual Entry Tab */}
              <TabsContent value="manual">
                {loadingStudents ? (
                  <div className={theme === 'dark' ? 'text-muted-foreground mt-6' : 'text-gray-500 mt-6'}>Loading students...</div>
                ) : students.length > 0 ? (
                  <div className={`border rounded-md mt-4 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                    <div className={`p-4 font-semibold border-b ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>Student Attendance</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className={theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}>
                          <tr>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>#</th>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>USN</th>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Name</th>
                            <th className={`text-left px-4 py-3 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((s, idx) => (
                            <tr 
                              key={s.id} 
                              className={`border-t ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                              <td className="px-4 py-3">{idx + 1}</td>
                              <td className="px-4 py-3 font-medium">{s.usn}</td>
                              <td className="px-4 py-3">{s.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleAttendance(s.id, true)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                                      attendance[s.id] === true 
                                        ? (theme === 'dark' 
                                            ? "bg-green-500/20 text-green-400 border-2 border-green-500/50" 
                                            : "bg-green-100 text-green-600 border-2 border-green-200")
                                        : (theme === 'dark' 
                                            ? "bg-muted text-muted-foreground hover:bg-green-500/10 hover:text-green-400 border border-border" 
                                            : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600 border border-gray-200")
                                    }`}
                                    title="Mark Present"
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    onClick={() => handleAttendance(s.id, false)}
                                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                                      attendance[s.id] === false 
                                        ? (theme === 'dark' 
                                            ? "bg-red-500/20 text-red-400 border-2 border-red-500/50" 
                                            : "bg-red-100 text-red-600 border-2 border-red-200")
                                        : (theme === 'dark' 
                                            ? "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-400 border border-border" 
                                            : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200")
                                    }`}
                                    title="Mark Absent"
                                  >
                                    <X size={18} />
                                  </button>
                                  {attendance[s.id] === true && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-800'}`}>
                                      Present
                                    </span>
                                  )}
                                  {attendance[s.id] === false && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-800'}`}>
                                      Absent
                                    </span>
                                  )}
                                  {attendance[s.id] === undefined && (
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-muted text-muted-foreground' : 'bg-gray-100 text-gray-500'}`}>
                                      Not marked
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        {Object.keys(attendance).filter(key => attendance[Number(key)] === true).length} Present, 
                        {Object.keys(attendance).filter(key => attendance[Number(key)] === false).length} Absent
                      </div>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white shadow-md"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                          </>
                        ) : (
                          "Submit Attendance"
                        )}
                      </Button>
                    </div>
                    {successMsg && <div className={`text-green-400 text-sm p-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{successMsg}</div>}
                    {errorMsg && <div className={`text-red-400 text-sm p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errorMsg}</div>}
                  </div>
                ) : (
                  <div className={theme === 'dark' ? 'text-muted-foreground mt-6' : 'text-gray-500 mt-6'}>Select class details to load students.</div>
                )}
              </TabsContent>
              
              {/* AI Tab */}
              <TabsContent value="ai">
                {loadingStudents ? (
                  <div className={theme === 'dark' ? 'text-muted-foreground mt-6' : 'text-gray-500 mt-6'}>Loading students...</div>
                ) : students.length > 0 ? (
                  <div className={`border rounded-md mt-4 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                    <div className={`p-4 font-semibold border-b ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}>AI Attendance Processing</div>
                    <div className="p-6">
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                          <UploadCloud className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>AI Attendance Processing</h3>
                        <p className={`text-sm mb-6 text-center max-w-md ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          Upload a class photo for automatic attendance marking using facial recognition technology.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label
                            htmlFor="photo-upload"
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md border cursor-pointer text-center transition ${
                              theme === 'dark'
                                ? 'border-border text-foreground hover:bg-accent'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {aiPhoto ? aiPhoto.name : 'Upload Photo'}
                          </label>
                          <Button
                            onClick={handleAIProcess}
                            disabled={processingAI || !aiPhoto}
                            className="flex-1 flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
                          >
                            {processingAI ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                            ) : (
                              "Process Attendance"
                            )}
                          </Button>
                        </div>
                      </div>

                      {aiResults && (
                        <div className={`mt-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                          <h4 className={`font-medium mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>AI Processing Results:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                              <div className="text-2xl font-bold text-green-600">{aiResults.present_count}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Present</div>
                            </div>
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                              <div className="text-2xl font-bold text-red-600">{aiResults.absent_count}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Absent</div>
                            </div>
                            <div className={`p-3 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                              <div className="text-2xl font-bold text-blue-600">{aiResults.total_students}</div>
                              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Total Students</div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Present Students:</h5>
                              <div className={`max-h-32 overflow-y-auto p-2 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                                {aiResults.present_students.length > 0 ? (
                                  aiResults.present_students.map((student: any) => (
                                    <div key={student.id} className="text-sm">
                                      {student.name} ({student.usn})
                                    </div>
                                  ))
                                ) : (
                                  <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No students detected as present</div>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Absent Students:</h5>
                              <div className={`max-h-32 overflow-y-auto p-2 rounded ${theme === 'dark' ? 'bg-background' : 'bg-white'}`}>
                                {aiResults.absent_students.length > 0 ? (
                                  aiResults.absent_students.map((student: any) => (
                                    <div key={student.id} className="text-sm">
                                      {student.name} ({student.usn})
                                    </div>
                                  ))
                                ) : (
                                  <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>All students detected as present</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`mt-8 p-4 rounded-lg ${theme === 'dark' ? 'bg-muted' : 'bg-gray-50'}`}>
                        <h4 className={`font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>How it works:</h4>
                        <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          <li>• Take a clear photo of your entire class</li>
                          <li>• Upload the image using the button above</li>
                          <li>• Our AI will recognize students and mark attendance automatically</li>
                          <li>• Review and confirm the results before submitting</li>
                        </ul>
                      </div>
                    </div>
                    {successMsg && <div className={`text-green-400 text-sm p-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{successMsg}</div>}
                    {errorMsg && <div className={`text-red-400 text-sm p-4 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{errorMsg}</div>}
                  </div>
                ) : (
                  <div className={`border rounded-md mt-4 p-8 text-center ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                    <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>No Students Found</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                      Please select class details above to load students for AI processing.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TakeAttendance;