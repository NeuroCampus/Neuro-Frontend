import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useTheme } from "@/context/ThemeContext";
import { API_ENDPOINT, API_BASE_URL } from "@/utils/config";
import { manageSubjects } from "@/utils/hod_api";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { useToast } from "@/hooks/use-toast";
import type { ProctorStudent } from "@/utils/faculty_api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ExamApplicationProps {
  proctorStudents?: ProctorStudent[];
  proctorStudentsLoading?: boolean;
}

const ExamApplication: React.FC<ExamApplicationProps> = ({ proctorStudents: initialProctorStudents = [], proctorStudentsLoading = false }) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [examPeriod, setExamPeriod] = useState("june_july");
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ProctorStudent | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [semesterSubjects, setSemesterSubjects] = useState<Array<any>>([]);
  const [appliedSubjects, setAppliedSubjects] = useState<Record<string, boolean>>({});
  const [studentStatuses, setStudentStatuses] = useState<Record<string, string>>({});
  const [subjectStatuses, setSubjectStatuses] = useState<Record<string, string>>({});
  const [filteredProctorStudents, setFilteredProctorStudents] = useState<ProctorStudent[]>(initialProctorStudents);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingApplications, setExistingApplications] = useState<Array<any>>([]);
  const [editingApplication, setEditingApplication] = useState<any>(null);

  // Fetch all proctor students
  useEffect(() => {
    const fetchProctorStudents = async () => {
      setLoadingFiltered(true);
      try {
        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/proctor-students/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
          setFilteredProctorStudents(result.data);
        } else {
          setFilteredProctorStudents(initialProctorStudents); // Fallback to all students
        }
      } catch (error) {
        console.error('Failed to fetch proctor students:', error);
        setFilteredProctorStudents(initialProctorStudents); // Fallback to all students
      } finally {
        setLoadingFiltered(false);
      }
    };

    fetchProctorStudents();
  }, [initialProctorStudents]);

  // Fetch student exam application statuses
  useEffect(() => {
    const fetchStudentStatuses = async () => {
      if (!filteredProctorStudents.length) return;
      
      try {
        const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/proctor-students/exam-status/?exam_period=${examPeriod}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
          const statusMap: Record<string, string> = {};
          result.data.forEach((student: any) => {
            statusMap[student.usn] = student.status;
          });
          setStudentStatuses(statusMap);
        }
      } catch (error) {
        console.error('Failed to fetch student statuses:', error);
      }
    };

    fetchStudentStatuses();
  }, [filteredProctorStudents, examPeriod]);

  const downloadHallTicket = async (student: ProctorStudent) => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/hall-ticket/${student.id}/?exam_period=${examPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download hall ticket');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hall_ticket_${student.usn}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading hall ticket:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download hall ticket",
        variant: "destructive",
      });
    }
  };

  const filtered = filteredProctorStudents.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (s.usn || "").toLowerCase().includes(q) || (s.name || "").toLowerCase().includes(q);
  });

  const openFor = async (student: ProctorStudent) => {
    setSelectedStudent(student);
    setStudentDetails(null);
    setSemesterSubjects([]);
    setAppliedSubjects({});
    setSubjectStatuses({});
    setIsEditMode(false);
    setExistingApplications([]);
    setEditingApplication(null);
    setOpen(true);
  };

  useEffect(() => {
    if (!open || !selectedStudent) return;

    const usn = selectedStudent.usn;

    const fetchDetails = async () => {
      try {
        // Fetch student details
        const res = await fetch(`${API_ENDPOINT}/public/student-data/?usn=${usn}`);
        const json = await res.json();
        if (json.success) {
          setStudentDetails(json);
          const registered = (json.subjects_registered || []).map((r: any) => r.subject_code);

          if (selectedStudent.branch_id && selectedStudent.semester_id) {
            try {
              const url = `${API_ENDPOINT}/common/subjects/?branch_id=${selectedStudent.branch_id}&semester_id=${selectedStudent.semester_id}`;
              const resp = await fetchWithTokenRefresh(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
              const subjResp = await resp.json();
              if (subjResp.success && subjResp.data) {
                const subjects = subjResp.data.filter((s: any) => !registered.includes(s.subject_code));
                setSemesterSubjects(subjects);
              }
            } catch (e) {
              console.error('Failed to fetch common subjects', e);
            }
          }
        } else {
          setStudentDetails({ error: json.message || "Failed to fetch" });
        }

        // Fetch existing exam applications for this student
        try {
          console.log('Fetching exam applications for student:', selectedStudent.id, selectedStudent.usn);
          const examAppsResponse = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/exam-applications/?student_id=${selectedStudent.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          const examAppsResult = await examAppsResponse.json();
          console.log('Exam applications response:', examAppsResult);
          
          if (examAppsResult.success) {
            // Store all applications for the existing applications section
            setExistingApplications(examAppsResult.data);
            
            // Create a map of subject codes to their application status
            // Filter by current exam period
            const subjectStatusMap: Record<string, string> = {};
            examAppsResult.data
              .filter((app: any) => app.exam_period === examPeriod) // Use selected exam period
              .forEach((app: any) => {
                console.log('Processing application:', app.subject_code, app.status, app.exam_period);
                subjectStatusMap[app.subject_code] = app.status === 'applied' ? 'Applied' : 'Not Applied';
              });
            console.log('Final subject status map:', subjectStatusMap);
            setSubjectStatuses(subjectStatusMap);
          }
        } catch (e) {
          console.error('Failed to fetch exam applications', e);
        }
      } catch (err) {
        setStudentDetails({ error: "Network error" });
      }
    };

    fetchDetails();
  }, [open, selectedStudent]);

  const handleApplyToggle = (subjectCode: string) => {
    setAppliedSubjects((s) => ({ ...s, [subjectCode]: !s[subjectCode] }));
  };

  const handleEditApplication = (application: any) => {
    setIsEditMode(true);
    setEditingApplication(application);
    // Pre-populate the form with existing data - checked if status is 'applied'
    setAppliedSubjects({ [application.subject_code]: application.status === 'applied' });
  };

  const handleUpdateApplication = async () => {
    if (!editingApplication || !selectedStudent) return;

    try {
      // Determine the new status based on whether the subject is checked
      const isSubjectChecked = appliedSubjects[editingApplication.subject_code] || false;
      const newStatus = isSubjectChecked ? 'applied' : 'not_applied';

      const updateData = {
        application_id: editingApplication.id,
        subject: editingApplication.subject,
        exam_period: editingApplication.exam_period,
        status: newStatus, // Use the new status based on checkbox
        semester: editingApplication.semester,
        batch: editingApplication.batch
      };

      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/exam-applications/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update application');
      }

      toast({
        title: "Success",
        description: "Exam application updated successfully!"
      });

      // Reset edit mode and refresh data
      setIsEditMode(false);
      setEditingApplication(null);
      setAppliedSubjects({});

      // Refresh the dialog data
      if (selectedStudent) {
        // Re-trigger the useEffect by closing and reopening
        setOpen(false);
        setTimeout(() => openFor(selectedStudent), 100);
      }

    } catch (error) {
      console.error('Application update error:', error);
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update application. Please try again.",
        variant: "destructive"
      });
    }
  };

  const exportPdf = async () => {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const [jspdfModule, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas')
      ]);

      // Resolve default vs named exports for html2canvas
      const html2canvasFn = (html2canvasModule && (html2canvasModule.default || html2canvasModule)) as any;

      // Resolve jsPDF constructor from various module shapes
      let jsPDFCtor: any = null;
      if (jspdfModule) {
        if (jspdfModule.jsPDF) jsPDFCtor = jspdfModule.jsPDF;
        else if (jspdfModule.default && jspdfModule.default.jsPDF) jsPDFCtor = jspdfModule.default.jsPDF;
        else if (jspdfModule.default) jsPDFCtor = jspdfModule.default;
        else jsPDFCtor = jspdfModule;
      }

      const element = printRef.current as HTMLElement;
      // Render element to canvas at higher scale for better quality
      const canvas = await html2canvasFn(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDFCtor('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // mm
      const contentWidth = pdfWidth - margin * 2;
      const imgWidth = contentWidth; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // mm
      const contentHeight = pdfHeight - margin * 2;

      // If content fits on one page
      if (imgHeight <= contentHeight) {
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        pdf.save(`exam-application-${selectedStudent?.usn || 'student'}.pdf`);
      } else {
        // Split into pages
        const totalPages = Math.ceil(imgHeight / contentHeight);

        // compute page slice height in pixels
        const pxPerMm = canvas.width / imgWidth; // pixels per mm
        const sliceHeightPx = Math.floor(contentHeight * pxPerMm);

        for (let page = 0; page < totalPages; page++) {
          const sourceY = page * sliceHeightPx;
          const canvasPage = document.createElement('canvas');
          canvasPage.width = canvas.width;
          // last page may be shorter
          const remaining = canvas.height - sourceY;
          canvasPage.height = remaining < sliceHeightPx ? remaining : sliceHeightPx;

          const ctx = canvasPage.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasPage.width, canvasPage.height);
            ctx.drawImage(canvas, 0, sourceY, canvas.width, canvasPage.height, 0, 0, canvasPage.width, canvasPage.height);
          }

          const pageData = canvasPage.toDataURL('image/jpeg', 1.0);
          const pageImgHeightMm = (canvasPage.height * imgWidth) / canvas.width;

          if (page > 0) pdf.addPage();
          pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, pageImgHeightMm);
        }

        pdf.save(`exam-application-${selectedStudent?.usn || 'student'}.pdf`);
      }
    } catch (err) {
      console.error('Export PDF failed', err);
      alert('Export failed. Please ensure jsPDF is installed (npm install jspdf)');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className={theme === 'dark' ? 'bg-card text-foreground shadow-md' : 'bg-white text-gray-900 shadow-md'}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Exam Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Exam Period</label>
            <Select value={examPeriod} onValueChange={setExamPeriod}>
              <SelectTrigger className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                <SelectValue placeholder="Select exam period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="june_july">June/July</SelectItem>
                <SelectItem value="nov_dec">November/December</SelectItem>
                <SelectItem value="jan_feb">January/February</SelectItem>
                <SelectItem value="apr_may">April/May</SelectItem>
                <SelectItem value="supplementary">Supplementary</SelectItem>
                <SelectItem value="revaluation">Revaluation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Input
          placeholder="Search proctor students by USN or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
        />

        <div className="max-h-[60vh] overflow-auto">
          <table className={`min-w-full rounded-md ${theme === 'dark' ? 'border border-border' : 'border border-gray-200'}`}>
            <thead className={theme === 'dark' ? 'bg-muted text-foreground' : 'bg-gray-100 text-gray-900'}>
              <tr>
                <th className="px-4 py-2 text-left text-sm">USN</th>
                <th className="px-4 py-2 text-left text-sm">Name</th>
                <th className="px-4 py-2 text-left text-sm">Semester</th>
                <th className="px-4 py-2 text-left text-sm">Status</th>
                <th className="px-4 py-2 text-left text-sm">Action</th>
              </tr>
            </thead>
            <tbody className={theme === 'dark' ? 'divide-border' : 'divide-gray-200'}>
              {(loadingFiltered || proctorStudentsLoading) && (
                <tr>
                  <td colSpan={5} className="text-center py-6">Loading...</td>
                </tr>
              )}
              {!(loadingFiltered || proctorStudentsLoading) && filtered.map((student) => (
                <tr key={student.usn} className={theme === 'dark' ? 'hover:bg-muted' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-2 text-sm">{student.usn}</td>
                  <td className="px-4 py-2 text-sm">{student.name}</td>
                  <td className="px-4 py-2 text-sm">{student.semester}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      studentStatuses[student.usn] === 'Applied' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {studentStatuses[student.usn] || 'Not Applied'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <div className="flex gap-2">
                      <Button onClick={() => openFor(student)} className="bg-[#a259ff] hover:bg-[#a259ff]/90 text-white">Open</Button>
                      {studentStatuses[student.usn] === 'Applied' && (
                        <Button 
                          onClick={() => downloadHallTicket(student)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Download Hall Ticket
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!(loadingFiltered || proctorStudentsLoading) && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6">
                    {examPeriod ? `No students found with exam applications for ${examPeriod === 'june_july' ? 'June/July' : 'January/February'} period.` : 'No students found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mt-5">
              <DialogHeader>
                <DialogTitle>Exam Application</DialogTitle>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button onClick={async () => { await exportPdf(); }} className="bg-[#a259ff] hover:bg-[#a259ff]/90 text-white">
                  {exporting ? 'Exporting...' : 'Export PDF'}
                </Button>
              </div>
            </div>
            <div className="p-1">
              {/* Existing Applications Section - NOT in PDF */}
              {!isEditMode && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h3 className="text-lg font-semibold mb-3">Existing Applications</h3>
                  {(() => {
                    // Get existing applications for current exam period
                    const currentApps = existingApplications.filter(
                      (app: any) => app.exam_period === examPeriod
                    );
                    
                    if (currentApps.length === 0) {
                      return <p className="text-gray-600">No existing applications for {examPeriod.replace('_', '/')} period.</p>;
                    }

                    return (
                      <div className="space-y-2">
                        {currentApps.map((app: any) => (
                          <div key={app.id} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div>
                              <span className="font-semibold text-gray-900">{app.subject_name} ({app.subject_code})</span>
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                app.status === 'applied' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {app.status === 'applied' ? 'Applied' : 'Not Applied'}
                              </span>
                            </div>
                            <Button 
                              onClick={() => handleEditApplication(app)}
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              Edit
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Edit Mode Banner - NOT in PDF */}
              {isEditMode && editingApplication && (
                <div className="mb-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Editing Application</h3>
                      <p className="text-blue-600">
                        Subject: {editingApplication.subject_name} ({editingApplication.subject_code})
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setIsEditMode(false);
                        setEditingApplication(null);
                        setAppliedSubjects({});
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Cancel Edit
                    </Button>
                  </div>
                </div>
              )}

              <div ref={printRef} className="mt-4">
                {/* Printable application form */}
                <div id="exam-application-printable" className="p-6 bg-white text-black" style={{minWidth: '800px', width: 'auto', margin: '0 auto'}}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <img src="/logo.jpeg" alt="Logo" style={{height: 60}} />
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">AMC ENGINEERING COLLEGE</div>
                      <div className="text-sm">Bannerghatta Road, Bangalore-560083</div>
                    </div>
                    <div style={{width: 60}} />
                  </div>

                  <hr className="mb-4" />
                  <div className="text-center mb-4">
                    <div className="font-bold text-lg">Exam Application Form</div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    
                    <div>
                      <Avatar className="w-20 h-20 rounded-md overflow-hidden">
                        {(
                          (studentDetails?.student_info && studentDetails.student_info.photo_url) ||
                          (selectedStudent && (selectedStudent.photo || selectedStudent.photo_url))
                        ) ? (
                          <img
                            src={
                              studentDetails?.student_info?.photo_url 
                                ? `${API_BASE_URL}${studentDetails.student_info.photo_url}`
                                : selectedStudent?.photo || selectedStudent?.photo_url
                            }
                            alt={selectedStudent?.name || studentDetails?.student_info?.name || 'Student'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <AvatarFallback className="text-2xl font-medium">
                            {(selectedStudent?.name || studentDetails?.name || 'U')[0]?.toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Name</div>
                        <div className="font-semibold">{selectedStudent?.name || studentDetails?.student_info?.name || ''}</div>
                        <div className="text-xs text-muted-foreground">USN</div>
                        <div className="font-semibold">{selectedStudent?.usn || ''}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Department</div>
                        <div className="font-semibold">{selectedStudent?.branch || ''}</div>
                        <div className="text-xs text-muted-foreground">Semester</div>
                        <div className="font-semibold">{selectedStudent?.semester || ''}</div>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-medium mb-2">Regular Courses</h4>
                  <table className="w-full border-collapse" style={{border: '1px solid #ddd'}}>
                    <thead>
                      <tr style={{background: '#f3f4f6'}}>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Select</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Course Code</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Course Name</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semesterSubjects.length > 0 ? semesterSubjects.map((sub) => (
                        <tr key={sub.subject_code}>
                          <td style={{border: '1px solid #ddd', padding: 8}}>
                            <input
                              type="checkbox"
                              checked={appliedSubjects[sub.subject_code] || false}
                              onChange={() => handleApplyToggle(sub.subject_code)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td style={{border: '1px solid #ddd', padding: 8}}>{sub.subject_code}</td>
                          <td style={{border: '1px solid #ddd', padding: 8}}>{sub.name}</td>
                          <td style={{border: '1px solid #ddd', padding: 8}}>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              subjectStatuses[sub.subject_code] === 'Applied' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {subjectStatuses[sub.subject_code] || 'Not Applied'}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} style={{padding: 12}}>No subjects available.</td></tr>
                      )}
                    </tbody>
                  </table>

                  <h4 className="font-medium mt-6 mb-2">Elective Courses (Registered)</h4>
                  <table className="w-full border-collapse mb-4" style={{border: '1px solid #ddd'}}>
                    <thead>
                      <tr style={{background: '#f3f4f6'}}>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Select</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Course Code</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Course Name</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((studentDetails?.subjects_registered || []).filter((x: any) => x.subject_type === 'elective')).length > 0 ? 
                        (studentDetails?.subjects_registered || []).filter((x: any) => x.subject_type === 'elective').map((r: any) => (
                          <tr key={r.subject_code}>
                            <td style={{border: '1px solid #ddd', padding: 8}}>
                              <input
                                type="checkbox"
                                checked={appliedSubjects[r.subject_code] || false}
                                onChange={() => handleApplyToggle(r.subject_code)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td style={{border: '1px solid #ddd', padding: 8}}>{r.subject_code}</td>
                            <td style={{border: '1px solid #ddd', padding: 8}}>{r.subject_name}</td>
                            <td style={{border: '1px solid #ddd', padding: 8}}>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                subjectStatuses[r.subject_code] === 'Applied' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {subjectStatuses[r.subject_code] || 'Not Applied'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                        <tr><td colSpan={4} style={{padding: 12}}>No registered electives.</td></tr>
                        )}
                    </tbody>
                  </table>

                  <h4 className="font-medium mt-6 mb-2">Open Elective Courses (Registered)</h4>
                  <table className="w-full border-collapse" style={{border: '1px solid #ddd'}}>
                    <thead>
                      <tr style={{background: '#f3f4f6'}}>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Select</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Course Code</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Course Name</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((studentDetails?.subjects_registered || []).filter((x: any) => x.subject_type === 'open_elective')).length > 0 ? 
                        (studentDetails?.subjects_registered || []).filter((x: any) => x.subject_type === 'open_elective').map((r: any) => (
                          <tr key={r.subject_code}>
                            <td style={{border: '1px solid #ddd', padding: 8}}>
                              <input
                                type="checkbox"
                                checked={appliedSubjects[r.subject_code] || false}
                                onChange={() => handleApplyToggle(r.subject_code)}
                                className="w-4 h-4"
                              />
                            </td>
                            <td style={{border: '1px solid #ddd', padding: 8}}>{r.subject_code}</td>
                            <td style={{border: '1px solid #ddd', padding: 8}}>{r.subject_name}</td>
                            <td style={{border: '1px solid #ddd', padding: 8}}>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                subjectStatuses[r.subject_code] === 'Applied' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {subjectStatuses[r.subject_code] || 'Not Applied'}
                              </span>
                            </td>
                          </tr>
                        )) : (
                        <tr><td colSpan={4} style={{padding: 12}}>No registered open electives.</td></tr>
                        )}
                    </tbody>
                  </table>

                  <h4 className="font-medium mt-6 mb-2">Fees Details</h4>
                  <table className="w-full border-collapse mb-4" style={{border: '1px solid #ddd'}}>
                    <thead>
                      <tr style={{background: '#f3f4f6'}}>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Fee Type</th>
                        <th style={{border: '1px solid #ddd', padding: 8, textAlign: 'left'}}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{border: '1px solid #ddd', padding: 8}}>Registration</td>
                        <td style={{border: '1px solid #ddd', padding: 8}}>100</td>
                      </tr>
                      <tr>
                        <td style={{border: '1px solid #ddd', padding: 8}}>Exam fees for regular Courses</td>
                        <td style={{border: '1px solid #ddd', padding: 8}}>2000</td>
                      </tr>
                      <tr>
                        <td style={{border: '1px solid #ddd', padding: 8}}>Marks card fees</td>
                        <td style={{border: '1px solid #ddd', padding: 8}}>300</td>
                      </tr>
                      <tr>
                        <td style={{border: '1px solid #ddd', padding: 8}}>Arrear course fees</td>
                        <td style={{border: '1px solid #ddd', padding: 8}}>0</td>
                      </tr>
                      <tr style={{background: '#f3f4f6', fontWeight: 'bold'}}>
                        <td style={{border: '1px solid #ddd', padding: 8}}>Total</td>
                        <td style={{border: '1px solid #ddd', padding: 8}}>2400</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              {isEditMode ? (
                <Button onClick={handleUpdateApplication} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Update Application
                </Button>
              ) : (
                <Button onClick={async () => {
                  if (!selectedStudent) return;
                  
                  // Validate that student has required data
                  if (!selectedStudent.semester_id || !selectedStudent.batch_id) {
                    toast({
                      title: "Invalid student data",
                      description: "Student must have semester and batch information to apply for exams.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Get selected subjects from all tables
                  const selectedSubjectCodes = Object.entries(appliedSubjects)
                    .filter(([_, applied]) => applied)
                    .map(([subjectCode, _]) => subjectCode);
                  
                  if (selectedSubjectCodes.length === 0) {
                    toast({
                      title: "No subjects selected",
                      description: "Please select at least one subject to apply for.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  try {
                    // Collect all applications to submit
                    const applications = [];
                    
                    // Handle semester subjects
                    for (const subjectCode of selectedSubjectCodes) {
                      const subject = semesterSubjects.find(s => s.subject_code === subjectCode);
                      if (subject) {
                        applications.push({
                          student_id: selectedStudent.id,
                          subject: subject.id,
                          exam_period: examPeriod,
                          semester: selectedStudent.semester_id,
                          batch: selectedStudent.batch_id
                        });
                      }
                    }
                    
                    // Handle registered elective subjects
                    const registeredElectives = (studentDetails?.subjects_registered || [])
                      .filter((x: any) => x.subject_type === 'elective' && selectedSubjectCodes.includes(x.subject_code));
                    
                    for (const elective of registeredElectives) {
                      applications.push({
                        student_id: selectedStudent.id,
                        subject: elective.subject_id,
                        exam_period: examPeriod,
                        semester: selectedStudent.semester_id,
                        batch: selectedStudent.batch_id
                      });
                    }
                    
                    // Handle registered open elective subjects
                    const registeredOpenElectives = (studentDetails?.subjects_registered || [])
                      .filter((x: any) => x.subject_type === 'open_elective' && selectedSubjectCodes.includes(x.subject_code));
                    
                    for (const openElective of registeredOpenElectives) {
                      applications.push({
                        student_id: selectedStudent.id,
                        subject: openElective.subject_id,
                        exam_period: examPeriod,
                        semester: selectedStudent.semester_id,
                        batch: selectedStudent.batch_id
                      });
                    }
                    
                    // Submit all applications
                    for (const application of applications) {
                      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/exam-applications/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(application)
                      });
                      
                      const result = await response.json();
                      if (!response.ok && response.status !== 200) {
                        throw new Error(result.message || 'Failed to submit application');
                      }
                      // 200 status means application already exists but was updated
                      if (response.status === 200) {
                        console.log('Application already exists:', result.message);
                      }
                    }
                    
                    // Update student status
                    setStudentStatuses(prev => ({
                      ...prev,
                      [selectedStudent.usn]: 'Applied'
                    }));
                    
                    // Refresh student statuses from API to ensure accuracy
                    const statusResponse = await fetchWithTokenRefresh(`${API_ENDPOINT}/faculty/proctor-students/exam-status/?exam_period=${examPeriod}`, {
                      method: 'GET',
                      headers: { 'Content-Type': 'application/json' }
                    });
                    if (statusResponse.ok) {
                      const statusResult = await statusResponse.json();
                      if (statusResult.success) {
                        const statusMap: Record<string, string> = {};
                        statusResult.data.forEach((student: any) => {
                          statusMap[student.usn] = student.status;
                        });
                        setStudentStatuses(statusMap);
                      }
                    }
                    
                    toast({
                      title: "Success",
                      description: `Applied for ${applications.length} subject(s) successfully!`
                    });
                    
                    // Close the dialog
                    setOpen(false);
                    
                  } catch (error) {
                    console.error('Application submission error:', error);
                    toast({
                      title: "Application Failed",
                      description: error instanceof Error ? error.message : "Failed to submit applications. Please try again.",
                      variant: "destructive"
                    });
                  }
                }} className="bg-[#a259ff] hover:bg-[#a259ff]/90 text-white">
                  Apply
                </Button>
              )}
              <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ExamApplication;

