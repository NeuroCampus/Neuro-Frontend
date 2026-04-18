import { useEffect, useState } from "react";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../ui/dialog";
import { Sliders } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Dean view: load branches -> faculties -> selected faculty profile (attendance, scheduled classes, weekly hours)
const DeanFacultyProfile = ({ facultyId: initialFacultyId, initialStartDate, initialEndDate }: { facultyId?: string, initialStartDate?: string, initialEndDate?: string }) => {
  const [branches, setBranches] = useState<Array<any>>([]);
  const [branchLoading, setBranchLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const [faculties, setFaculties] = useState<Array<any>>([]);
  const [facultiesLoading, setFacultiesLoading] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(initialFacultyId || null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [startDate, setStartDate] = useState<string>(initialStartDate || '');
  const [endDate, setEndDate] = useState<string>(initialEndDate || '');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [startDatePopoverOpen, setStartDatePopoverOpen] = useState(false);
  const [endDatePopoverOpen, setEndDatePopoverOpen] = useState(false);
  const { theme } = useTheme();

  // Set default dates to current month on mount
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // Only set defaults if not provided via props
    if (!initialStartDate) setStartDate(firstDay.toISOString().split('T')[0]);
    if (!initialEndDate) setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Update when parent passes new initial props
  useEffect(() => {
    if (initialFacultyId) setSelectedFaculty(initialFacultyId);
  }, [initialFacultyId]);

  useEffect(() => {
    if (initialStartDate !== undefined) setStartDate(initialStartDate || '');
  }, [initialStartDate]);

  useEffect(() => {
    if (initialEndDate !== undefined) setEndDate(initialEndDate || '');
  }, [initialEndDate]);

  // Load branches on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setBranchLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/branches/`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setBranches(json.data || []);
        else setError(json.message || 'Failed to load branches');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setBranchLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Load faculties when branch changes
  useEffect(() => {
    let mounted = true;
    const loadFaculties = async () => {
      if (!selectedBranch) {
        setFaculties([]);
        return;
      }
      setFacultiesLoading(true);
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/faculties/?branch_id=${selectedBranch}`);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setFaculties(json.data || []);
        else setError(json.message || 'Failed to load faculties');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setFacultiesLoading(false);
      }
    };
    loadFaculties();
    return () => { mounted = false; };
  }, [selectedBranch]);

  // Load profile when selectedFaculty changes or dates change
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!selectedFaculty) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        let url = `${API_ENDPOINT}/dean/faculty/${selectedFaculty}/profile/`;
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        if (params.toString()) url += `?${params.toString()}`;

        const res = await fetchWithTokenRefresh(url);
        const json = await res.json();
        if (!mounted) return;
        if (json.success) setProfile(json.data || json.profile || null);
        else setError(json.message || 'Failed to load profile');
      } catch (e: any) {
        setError(e?.message || 'Network error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, [selectedFaculty, startDate, endDate, reloadKey]);

  // If initialFacultyId provided, try to select its branch automatically after branches load
  useEffect(() => {
    if (!initialFacultyId) return;
    setSelectedFaculty(initialFacultyId);
  }, [initialFacultyId]);

  const handleDateFilter = () => {
    // Trigger reload by bumping reloadKey; keep profile cleared while fetching
    setProfile(null);
    setReloadKey((k) => k + 1);
  };

  const isTeacher01 = profile?.email === 'teacher01@college.edu';

  return (
    <div className={`dean-profile min-h-screen ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'} p-0` }>
      <style>{`
        @media (min-width: 481px) and (max-width: 768px) {
          .dean-profile .filters-row { display: flex !important; flex-direction: row !important; align-items: flex-end !important; gap: 1rem !important; }
          .dean-profile .filters-row .flex-1 { flex: 1 1 0% !important; min-width: 0 !important; }
          .dean-profile .filters-row .flex-shrink-0 { align-self: flex-end !important; margin-top: 0 !important; }
        }
        @media (max-width: 480px) {
          .dean-profile .filters-row { gap: 12px !important; display: flex !important; flex-direction: column !important; align-items: stretch !important; }
          .dean-profile .filters-row .flex-1 { width: 100% !important; min-width: 0 !important; }
          .dean-profile .filters-row .flex-shrink-0 { width: 100% !important; margin-top: 0.25rem !important; display: flex !important; justify-content: flex-end !important; }

          .dean-profile h1 { font-size: 28px !important; line-height: 1.4 !important; }
          .dean-profile h2 { font-size: 22px !important; line-height: 1.45 !important; }
          .dean-profile h3 { font-size: 18px !important; line-height: 1.5 !important; }
          .dean-profile, .dean-profile p, .dean-profile label, .dean-profile input, .dean-profile button { font-size: 14px !important; }

          .dean-profile .card, .dean-profile .card-content { padding-left: 12px !important; padding-right: 12px !important; }

          .dean-profile .button-group, .dean-profile .flex-row { flex-direction: column !important; gap: 8px !important; }
          .dean-profile button, .dean-profile .btn { width: 100% !important; max-width: 320px !important; padding: 10px 16px !important; min-height: 40px !important; }

          .dean-profile img, .dean-profile .responsive-img { max-width: 100% !important; height: auto !important; }

          .dean-profile table, .dean-profile .table-responsive { width: 100% !important; display: block !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }

          .dean-profile .modal, .dean-profile .popup, .dean-profile .dialog, .dean-profile .swal2-popup, .dean-profile [role="dialog"] {
            width: 90vw !important; max-width: 340px !important; padding: 20px !important; border-radius: 12px !important; left: 50% !important; top: 50% !important; transform: translate(-50%, -50%) !important; box-sizing: border-box !important; max-height: 90vh !important; overflow: auto !important;
          }

          /* Target the dialog rendered in the portal from this component */
          .dean-filters-dialog {
            width: 90vw !important;
            max-width: 320px !important;
            padding: 16px !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
          }

          .dean-profile .modal-header, .dean-profile .dialog-header, .dean-profile .swal2-title { font-size: 20px !important; margin-bottom: 12px !important; }
          .dean-profile .modal-body, .dean-profile .dialog-body, .dean-profile .swal2-html-container { font-size: 14px !important; line-height: 1.5 !important; }
          .dean-profile .modal-footer, .dean-profile .dialog-footer, .dean-profile .swal2-actions { margin-top: 16px !important; display: flex !important; gap: 8px !important; flex-direction: column !important; }
          .dean-profile .modal-button, .dean-profile .swal2-confirm, .dean-profile .swal2-cancel { width: 100% !important; padding: 10px 16px !important; min-height: 40px !important; }
        }
      `}</style>
      <Card className={theme === 'dark' ? 'w-full bg-card border border-border shadow-md' : 'w-full bg-white border border-gray-200 shadow-md'}>
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6 pb-4">
          <div className="flex w-full justify-between items-center">
            <div>
              <CardTitle className={`text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Faculty Profile</CardTitle>
              <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>View faculty attendance, schedule and assignments</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2 space-y-6">
          <div className="filters-row flex flex-col lg:flex-row gap-6 items-start lg:items-end mb-6">
        <div className="flex-1">
          <Label className={`text-sm mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>Branch</Label>
          <Select value={selectedBranch || ''} onValueChange={(val) => setSelectedBranch(val || null)}>
            <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'}`}>
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b: any) => (
                <SelectItem key={b.branch_id || b.id} value={(b.branch_id || b.id).toString()}>
                  {b.branch || b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label className={`text-sm mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>Faculty</Label>
          <Select value={selectedFaculty || ''} onValueChange={(val) => setSelectedFaculty(val || null)}>
            <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'}`} disabled={!selectedBranch || facultiesLoading}>
              <SelectValue placeholder="Select a faculty member" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((f: any) => (
                <SelectItem key={f.id} value={f.id.toString()}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-shrink-0 flex items-end mt-2 lg:mt-0">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 h-10"
                disabled={!selectedBranch || !selectedFaculty || facultiesLoading}
                title={!selectedBranch || !selectedFaculty ? 'Select branch and faculty to enable filters' : undefined}
              >
                Filters
                <Sliders className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className={`${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'} dean-filters-dialog`}>
              <DialogHeader>
                <DialogTitle>Attendance Report Filters</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label className={`text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>Start Date</Label>
                  <Popover open={startDatePopoverOpen} onOpenChange={setStartDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                          theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {startDate ? format(new Date(startDate), "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={`w-auto p-0 ${theme === 'dark' ? 'bg-card border-border' : 'bg-white'}`}>
                      <CalendarComponent
                        mode="single"
                        selected={startDate ? new Date(startDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const dateStr = format(date, "yyyy-MM-dd");
                            setStartDate(dateStr);
                            setStartDatePopoverOpen(false);
                          }
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label className={`text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>End Date</Label>
                  <Popover open={endDatePopoverOpen} onOpenChange={setEndDatePopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                          theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {endDate ? format(new Date(endDate), "MMM dd, yyyy") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className={`w-auto p-0 ${theme === 'dark' ? 'bg-card border-border' : 'bg-white'}`}>
                      <CalendarComponent
                        mode="single"
                        selected={endDate ? new Date(endDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const dateStr = format(date, "yyyy-MM-dd");
                            setEndDate(dateStr);
                            setEndDatePopoverOpen(false);
                          }
                        }}
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button onClick={() => { setStartDate(''); setEndDate(''); handleDateFilter(); }} className={`px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors`}>Clear</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={() => { handleDateFilter(); }} className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors`}>Apply</Button>
                  </DialogClose>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {profile && (
        <div>
          {/* Stats Cards */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Weekly Hours</p>
                    <p className="text-3xl font-bold text-blue-900">{profile.total_weekly_hours ?? 0}</p>
                  </div>
                      
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Present Days</p>
                    <p className="text-3xl font-bold text-green-900">{profile.attendance_summary?.present_days ?? 0}</p>
                  </div>
                      
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Absent Days</p>
                    <p className="text-3xl font-bold text-red-900">{profile.attendance_summary?.absent_days ?? 0}</p>
                  </div>
                  
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Attendance %</p>
                    <p className="text-3xl font-bold text-purple-900">{profile.attendance_summary?.percent_present ?? 'N/A'}</p>
                  </div>
                  
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Leave Days</p>
                    <p className="text-3xl font-bold text-yellow-900">{profile.attendance_summary?.leave_days ?? 0}</p>
                  </div>
                  
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Unmarked Days</p>
                    <p className="text-3xl font-bold text-amber-900">{profile.attendance_summary?.unmarked_days ?? 0}</p>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* Assignments */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Subject Assignments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {profile.assignments && profile.assignments.length ? profile.assignments.map((a: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="font-semibold text-gray-800 mb-1">{a.subject}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {a.branch}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Semester {a.semester}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Section {a.section}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    No assignments found
                  </div>
                )}
              </div>
            </div>

            {/* Scheduled Classes */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Weekly Schedule
              </h3>
              {profile.scheduled_classes && profile.scheduled_classes.length ? (
                <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {profile.scheduled_classes.map((s: any) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {s.day}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.start_time} - {s.end_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {s.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {s.section}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {s.duration_hours} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  No scheduled classes found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        </CardContent>
      </Card>
    </div>
  );
};

export default DeanFacultyProfile;
