import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Notification {
  title: string;
  message: string;
  role: string;
  color: string;
}

const roleColors: Record<string, string> = {
  "All Users": "bg-blue-100 text-blue-800",
  Teacher: "bg-purple-100 text-purple-800",
  "Head of Department": "bg-green-100 text-green-800",
  Student: "bg-pink-100 text-pink-800",
  Admin: "bg-orange-100 text-orange-800",
};

const Announcements = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      title: "System Maintenance",
      message: "The system will be down for maintenance on Sunday, 2AM–4AM.",
      role: "All Users",
      color: roleColors["All Users"],
    },
    {
      title: "Faculty Meeting",
      message: "All faculty members are requested to attend the meeting on Friday at …",
      role: "Teacher",
      color: roleColors["Teacher"],
    },
    {
      title: "New Curriculum",
      message: "HODs please review the new curriculum proposal by next week.",
      role: "Head of Department",
      color: roleColors["Head of Department"],
    },
    {
      title: "Fee Payment Reminder",
      message: "All students are reminded to clear pending fees by month end.",
      role: "Student",
      color: roleColors["Student"],
    },
    {
      title: "Admin Portal Update",
      message: "New features have been added to the admin portal.",
      role: "Admin",
      color: roleColors["Admin"],
    },
  ]);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<{ title?: string; message?: string; role?: string }>({});
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = () => {
    const newErrors: typeof errors = {};

    if (!title.trim()) newErrors.title = "Title is required.";
    if (!message.trim()) newErrors.message = "Message is required.";
    if (!role) newErrors.role = "Target role is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newNotification: Notification = {
      title,
      message,
      role,
      color: roleColors[role],
    };

    setNotifications((prev) => [newNotification, ...prev]);
    setTitle("");
    setMessage("");
    setRole("");
    setErrors({});

    setSuccessMessage("Notification sent successfully!");
    setTimeout(() => setSuccessMessage(""), 3000); // Hide after 3s
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-gray-900">
      <div className="grid grid-cols-3 gap-8">
        {/* Notification History */}
        <Card className="col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Notification History</CardTitle>
            <p className="text-sm text-gray-500">List of all notifications sent to users</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {notifications.map((item, index) => (
              <div key={index} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <div className="font-semibold text-gray-800">{item.title}</div>
                  <span className={`text-xs font-medium rounded-full px-2 py-1 ${item.color}`}>
                    {item.role}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{item.message}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Create Notification */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Create Notification</CardTitle>
            <p className="text-sm text-gray-500">Send a new notification to users</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {successMessage && (
              <div className="bg-green-100 text-green-800 text-sm p-2 rounded">
                {successMessage}
              </div>
            )}

            <div>
              <Input
                placeholder="Notification Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              {errors.message && <p className="text-sm text-red-500 mt-1">{errors.message}</p>}
            </div>

            <div>
              <Select value={role} onValueChange={(value) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a target role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(roleColors).map((roleKey) => (
                    <SelectItem key={roleKey} value={roleKey}>
                      {roleKey}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              Send Notification
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Announcements;
