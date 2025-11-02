import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  getFacultyNotifications,
  createAnnouncement,
  ProctorStudent,
  getFacultySentNotifications,
} from "@/utils/faculty_api";
import { useProctorStudentsQuery } from "@/hooks/useApiQueries";
import type { CreateAnnouncementRequest } from "@/utils/faculty_api";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  role: string;
  created_at: string;
  created_by: string | null;
}

const roleColors: Record<string, string> = {
  All: "bg-blue-100 text-blue-800",
  Teacher: "bg-purple-100 text-purple-800",
  HOD: "bg-green-100 text-green-800",
  Student: "bg-pink-100 text-pink-800",
  Admin: "bg-orange-100 text-orange-800",
};

const Announcements = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { data: proctorStudents = [] } = useProctorStudentsQuery();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ title?: string; message?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);
  const { theme } = useTheme();

  // Fetch notifications
  useEffect(() => {
    setLoadingNotifications(true);
    getFacultyNotifications()
      .then((res) => {
        if (res.success && res.data) {
          setNotifications(res.data);
        }
      })
      .finally(() => setLoadingNotifications(false));
  }, []);

  // Fetch sent notifications
  useEffect(() => {
    setLoadingSent(true);
    getFacultySentNotifications()
      .then((res) => {
        if (res.success && res.data) {
          setSentNotifications(res.data);
        }
      })
      .finally(() => setLoadingSent(false));
  }, []);

  // Handle select all toggle
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(proctorStudents.map((s) => s.usn));
    } else {
      setSelectedStudents([]);
    }
  }, [selectAll, proctorStudents]);

  const handleStudentSelect = (usn: string) => {
    setSelectedStudents((prev) =>
      prev.includes(usn) ? prev.filter((id) => id !== usn) : [...prev, usn]
    );
  };

  // Group students by class (branch_id, semester_id, section_id)
  const groupByClass = (students: ProctorStudent[]) => {
    const map = new Map<string, { branch_id: number; semester_id: number; section_id: number }>();
    students.forEach((s) => {
      if (s.branch_id && s.semester_id && s.section_id) {
        const key = `${s.branch_id}-${s.semester_id}-${s.section_id}`;
        map.set(key, {
          branch_id: s.branch_id!,
          semester_id: s.semester_id!,
          section_id: s.section_id!,
        });
      }
    });
    return Array.from(map.values());
  };

  const handleSubmit = async () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!message.trim()) newErrors.message = "Message is required.";
    if ((selectAll && proctorStudents.length === 0) || (!selectAll && selectedStudents.length === 0)) newErrors.message = "Select at least one student or 'All'.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setSending(true);
    let success = true;
    let errorMsg = "";
    let groups: { branch_id: number; semester_id: number; section_id: number; usns: string[] }[] = [];
    if (selectAll) {
      // All proctor students, group by class
      const grouped = groupByClass(proctorStudents);
      groups = grouped.map((g) => ({ ...g, usns: proctorStudents.filter(s => s.branch_id === g.branch_id && s.semester_id === g.semester_id && s.section_id === g.section_id).map(s => s.usn) }));
    } else {
      // Only selected students, group by class
      const selected = proctorStudents.filter((s) => selectedStudents.includes(s.usn));
      const grouped = groupByClass(selected);
      groups = grouped.map((g) => ({ ...g, usns: selected.filter(s => s.branch_id === g.branch_id && s.semester_id === g.semester_id && s.section_id === g.section_id).map(s => s.usn) }));
    }
    for (const group of groups) {
      const req: CreateAnnouncementRequest = {
        branch_id: String(group.branch_id),
        semester_id: String(group.semester_id),
        section_id: String(group.section_id),
        title,
        content: message,
        target: "student",
        student_usns: group.usns,
      };
      const res = await createAnnouncement(req);
      if (!res.success) {
        success = false;
        errorMsg = res.message || "Failed to send notification.";
        break;
      }
    }
    setSending(false);
    if (success) {
      setTitle("");
      setMessage("");
      setSelectedStudents([]);
      setSelectAll(false);
      setSuccessMessage("Notification sent successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } else {
      setErrors({ message: errorMsg });
    }
  };

  // Memoized warning for selected
  const selectedWarning = useMemo(() => {
    if (!selectAll && selectedStudents.length > 0) {
      return (
        <div className={`text-xs p-2 rounded mb-2 ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-yellow-100 text-yellow-800'}`}>
          Note: All students in the selected students' classes will receive this notification.
        </div>
      );
    }
    return null;
  }, [selectAll, selectedStudents.length, theme]);

  return (
    <div className={`p-8 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="grid grid-cols-3 gap-8">
        {/* Received Notifications */}
        <Card className={theme === 'dark' ? 'col-span-2 shadow-sm bg-card text-foreground' : 'col-span-2 shadow-sm bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle className="text-lg">Received Notifications</CardTitle>
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Notifications from HOD and Admin</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingNotifications ? (
              <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>No notifications found.</div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {notifications.map((item, index) => (
                  <div
                    key={item.id || index}
                    className={`border-b pb-4 ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className={`font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{item.title}</div>
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-1 ${
                          roleColors[item.role] || (theme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700")
                        }`}
                      >
                        {item.role}
                      </span>
                    </div>
                    <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>{item.message}</div>
                    <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                      {item.created_by ? `From: ${item.created_by}` : ""} |{" "}
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>


        {/* Create Notification */}
        <Card className={theme === 'dark' ? 'col-span-1 shadow-sm bg-card text-foreground' : 'col-span-1 shadow-sm bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle className="text-lg">Send Notification to Proctor Students</CardTitle>
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Select students or send to all</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage && (
              <div className={`text-sm p-2 rounded ${theme === 'dark' ? 'bg-green-900/30 text-green-500' : 'bg-green-100 text-green-800'}`}>
                {successMessage}
              </div>
            )}
            {errors.message && (
              <div className={`text-sm p-2 rounded ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground' : 'bg-red-100 text-red-800'}`}>
                {errors.message}
              </div>
            )}
            {selectedWarning}
            <div>
              <Input
                placeholder="Notification Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={sending}
                className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
              />
              {errors.title && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{errors.title}</p>
              )}
            </div>
            <div>
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
              />
              {errors.message && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{errors.message}</p>
              )}
            </div>
            <div>
              {/* Select All */}
              <div className="flex items-center mb-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={(checked) => setSelectAll(!!checked)}
                  id="select-all"
                  className={`border ${theme === 'dark' ? 'border-border bg-background' : 'border-gray-300 bg-white'}`}
                  disabled={sending}
                />
                <label
                  htmlFor="select-all"
                  className={`ml-2 text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}
                >
                  Select All Proctor Students
                </label>
              </div>

              {/* Scrollable Student List */}
              <div className={`max-h-52 overflow-y-auto border rounded-lg p-2 custom-scrollbar ${theme === 'dark' ? 'border-border bg-muted' : 'border-gray-300 bg-gray-50'}`}>
                {proctorStudents.length === 0 ? (
                  <div className={`text-sm text-center py-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                    No proctor students found.
                  </div>
                ) : (
                  proctorStudents.map((student) => (
                    <div
                      key={student.usn}
                      className={`flex items-center mb-1 rounded px-1 ${theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}`}
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.usn) || selectAll}
                        onCheckedChange={() => handleStudentSelect(student.usn)}
                        id={`student-${student.usn}`}
                        disabled={selectAll || sending}
                        className={`border ${theme === 'dark' ? 'border-border bg-background' : 'border-gray-300 bg-white'}`}
                      />
                      <label
                        htmlFor={`student-${student.usn}`}
                        className={`ml-2 text-sm cursor-pointer ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}
                      >
                        {student.name} ({student.usn})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>


            <Button
              className="w-full flex items-center justify-center bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md"
              onClick={handleSubmit}
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} /> Sending...
                </>
              ) : (
                "Send Notification"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Sent Notifications Section */}
        <Card className={theme === 'dark' ? 'col-span-3 shadow-sm bg-card text-foreground' : 'col-span-3 shadow-sm bg-white text-gray-900'}>
          <CardHeader>
            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Sent Notifications</CardTitle>
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Notifications you have sent</p>
          </CardHeader>

          {/* Scrollable Content */}
          <CardContent className="max-h-72 overflow-y-auto space-y-6 custom-scrollbar">
            {loadingSent ? (
              <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Loading...</div>
            ) : sentNotifications.length === 0 ? (
              <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>No sent notifications found.</div>
            ) : (
              sentNotifications.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`border-b pb-4 ${theme === 'dark' ? 'border-border' : 'border-gray-300'}`}
                >
                  <div className="flex justify-between items-center">
                    <div className={`font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{item.title}</div>
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-1 ${
                        roleColors[item.role] || (theme === 'dark' ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700")
                      }`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>{item.message}</div>
                  <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                    {item.created_by ? `By: ${item.created_by}` : ""} |{" "}
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>

  );
};

export default Announcements;