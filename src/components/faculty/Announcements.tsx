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
        <div className="bg-yellow-100 text-yellow-800 text-xs p-2 rounded mb-2">
          Note: All students in the selected students' classes will receive this notification.
        </div>
      );
    }
    return null;
  }, [selectAll, selectedStudents.length]);

  return (
    <div className="p-8 bg-[#1c1c1e] text-gray-200 min-h-screen ">
      <div className="grid grid-cols-3 gap-8">
        {/* Received Notifications */}
        <Card className="col-span-2 shadow-sm bg-[#1c1c1e] text-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Received Notifications</CardTitle>
            <p className="text-sm text-gray-400">Notifications from HOD and Admin</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingNotifications ? (
              <div>Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-400">No notifications found.</div>
            ) : (
              <div className="max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {notifications.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="border-b border-gray-700 pb-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-gray-100">{item.title}</div>
                      <span
                        className={`text-xs font-medium rounded-full px-2 py-1 ${
                          roleColors[item.role] || "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {item.role}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{item.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
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
        <Card className="col-span-1 shadow-sm bg-[#1c1c1e] text-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Send Notification to Proctor Students</CardTitle>
            <p className="text-sm text-gray-200">Select students or send to all</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage && (
              <div className="bg-green-100 text-green-800 text-sm p-2 rounded">
                {successMessage}
              </div>
            )}
            {errors.message && (
              <div className="bg-red-100 text-red-800 text-sm p-2 rounded">
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
                className="bg-[#232326] text-gray-200"
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                className="bg-[#232326] text-gray-200"
              />
              {errors.message && (
                <p className="text-sm text-red-500 mt-1">{errors.message}</p>
              )}
            </div>
            <div>
              {/* Select All */}
              <div className="flex items-center mb-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={(checked) => setSelectAll(!!checked)}
                  id="select-all"
                  className="cursor-pointer bg-gray-500"
                  disabled={sending}
                />
                <label
                  htmlFor="select-all"
                  className="ml-2 text-sm font-medium text-gray-200"  // 👈 Added text color
                >
                  Select All Proctor Students
                </label>
              </div>

              {/* Scrollable Student List */}
              <div className="max-h-52 overflow-y-auto border border-gray-700 rounded-lg p-2 bg-[#232326] text-gray-200 custom-scrollbar">
                {proctorStudents.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-2">
                    No proctor students found.
                  </div>
                ) : (
                  proctorStudents.map((student) => (
                    <div
                      key={student.usn}
                      className="flex items-center mb-1 hover:bg-gray-700/30 rounded px-1"
                    >
                      <Checkbox
                        checked={selectedStudents.includes(student.usn) || selectAll}
                        onCheckedChange={() => handleStudentSelect(student.usn)}
                        id={`student-${student.usn}`}
                        disabled={selectAll || sending}
                        className="cursor-pointer bg-gray-500"
                      />
                      <label
                        htmlFor={`student-${student.usn}`}
                        className="ml-2 text-sm cursor-pointer text-gray-200" // 👈 ensure visibility
                      >
                        {student.name} ({student.usn})
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>


            <Button
              className="w-full flex items-center justify-center text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
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
        <Card className="col-span-3 shadow-sm bg-[#1c1c1e] text-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-100">Sent Notifications</CardTitle>
            <p className="text-sm text-gray-400">Notifications you have sent</p>
          </CardHeader>

          {/* Scrollable Content */}
          <CardContent className="max-h-72 overflow-y-auto space-y-6 custom-scrollbar">
            {loadingSent ? (
              <div className="text-gray-400">Loading...</div>
            ) : sentNotifications.length === 0 ? (
              <div className="text-gray-500">No sent notifications found.</div>
            ) : (
              sentNotifications.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border-b border-gray-700 pb-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-gray-100">{item.title}</div>
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-1 ${
                        roleColors[item.role] || "bg-gray-500 text-gray-200"
                      }`}
                    >
                      {item.role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mt-1">{item.message}</div>
                  <div className="text-xs text-gray-300 mt-1">
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
