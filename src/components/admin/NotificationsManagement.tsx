
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { manageNotifications } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  message: string;
  role: string;
  color: string;
  target_role: string; // Added target_role property
}

interface NotificationsManagementProps {
  setError: (error: string | null) => void;
  toast: (options: any) => void;
}

const NotificationsManagement = ({ setError, toast }: NotificationsManagementProps) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await manageNotifications();
        console.log("Fetch Notifications Response:", response); // Debug log
        if (response.success) {
          setNotifications(
            response.notifications.map((note: any) => ({
              ...note,
              color: getBadgeColor(note.target_role),
            }))
          );
        } else {
          setError(response.message || "Failed to fetch notifications");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to fetch notifications",
          });
        }
      } catch (err) {
        setError("Network error");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Network error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [setError, toast]);

  const handleSendNotification = async () => {
    if (!title || !message || !targetRole) {
      setValidationError("Please fill out all fields before sending.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out all fields.",
      });
      return;
    }

    setValidationError("");
    setLoading(true);
    setError(null);

    // Map frontend role to backend expected role
    const roleMap: { [key: string]: string } = {
      "All Users": "all",
      "Student": "student",
      "Teacher": "teacher",
      "Head of Department": "hod",
    };
    const backendRole = roleMap[targetRole] || targetRole;

    try {
      const payload = { title, message, target_role: backendRole };
      console.log("Send Notification Payload:", payload); // Debug log
      const response = await manageNotifications(payload, "POST"); // Pass method as separate argument
      console.log("Send Notification Response:", response); // Debug log
      if (response.success) {
        // Refetch notifications to get the new notification with its ID
        const updatedResponse = await manageNotifications();
        if (updatedResponse.success) {
          setNotifications(
            updatedResponse.notifications.map((note: any) => ({
              ...note,
              color: getBadgeColor(note.target_role),
            }))
          );
        }
        setTitle("");
        setMessage("");
        setTargetRole("");
        toast({ title: "Success", description: "Notification sent successfully" });
      } else {
        setError(response.message || "Failed to send notification");
        toast({
          variant: "destructive",
          title: "Error",
          description: response.message || "Failed to send notification",
        });
      }
    } catch (err) {
      console.error("Send Notification Error:", err); // Debug log
      setError("Network error while sending notification");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while sending notification",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (role: string) => {
    switch (role) {
      case "all":
      case "All Users":
        return "bg-blue-100 text-blue-800";
      case "teacher":
      case "Teacher":
        return "bg-purple-100 text-purple-800";
      case "hod":
      case "Head of Department":
        return "bg-green-100 text-green-800";
      case "student":
      case "Student":
        return "bg-pink-100 text-pink-800";
      case "admin":
      case "Admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-black-50 text-gray-900 min-h-screen">
      <Card className="md:col-span-2 bg-black-50 border border-gray-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200">
            Notification History
          </CardTitle>
          <p className="text-sm text-gray-400">
            List of all notifications sent to users
          </p>
        </CardHeader>
        <CardContent>
          {loading && notifications.length === 0 ? (
            <div className="text-center py-6">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-300">
                  <tr>
                    <th className="pb-2 text-gray-200">Message</th>
                    <th className="pb-2 text-gray-200">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((note) => (
                    <tr
                      key={note.id}
                      className="border-b border-gray-200"
                    >
                      <td className="py-3">
                        <div className="font-medium text-gray-400">{note.title}</div>
                        <div className="text-gray-400 text-sm">{note.message}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${note.color}`}
                        >
                          {note.target_role.charAt(0).toUpperCase() + note.target_role.slice(1).replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-black-50 border border-gray-500 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200">Create Notification</CardTitle>
          <p className="text-sm text-gray-400">Send a new notification to users</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-200">Title</label>
            <Input
              className="bg-[#232326] text-gray-200 border-gray-300"
              placeholder="Notification Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setValidationError("");
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-200">Message</label>
            <Textarea
              className="bg-[#232326] text-gray-200 border-gray-300"
              rows={4}
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setValidationError("");
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-200">Target Role</label>
            <Select
              value={targetRole}
              onValueChange={(val) => {
                setTargetRole(val);
                setValidationError("");
              }}
            >
              <SelectTrigger className="bg-[#232326] text-gray-200 border-gray-300">
                <SelectValue placeholder="Select a target role" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-200 border-gray-200">
                <SelectItem value="All Users">All Users</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Teacher">Teacher</SelectItem>
                <SelectItem value="Head of Department">Head of Department</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {validationError && (
            <div className="text-red-600 text-sm font-medium">{validationError}</div>
          )}
          <Button
            className="w-full text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
            onClick={handleSendNotification}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsManagement;
