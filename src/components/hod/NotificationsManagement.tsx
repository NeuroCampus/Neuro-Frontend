import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../ui/use-toast";
import { sendNotification, getNotifications, manageProfile, getSentNotifications } from "../../utils/hod_api";
import { useTheme } from "../../context/ThemeContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  role: string;
  created_at: string;
  created_by?: string; // Username of creator
}

const NotificationsManagement = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [newNotification, setNewNotification] = useState({
    action: "notify_all" as const,
    title: "",
    message: "",
    target: "",
    branch_id: "",
  });
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const profileResponse = await manageProfile({}, "GET");
        if (profileResponse.success && profileResponse.data?.branch_id) {
          const branchId = profileResponse.data.branch_id;
          setNewNotification((prev) => ({ ...prev, branch_id: branchId }));

          // Fetch received notifications
          const receivedResponse = await getNotifications(branchId);
          if (receivedResponse.success && receivedResponse.data) {
            setNotifications(receivedResponse.data);
          } else {
            setError(receivedResponse.message || "Failed to fetch received notifications");
          }

          // Fetch sent notifications
          const sentResponse = await getSentNotifications(branchId);
          if (sentResponse.success && sentResponse.data) {
            setSentNotifications(sentResponse.data);
          } else {
            setError(sentResponse.message || "Failed to fetch sent notifications");
          }
        } else {
          setError(profileResponse.message || "Failed to fetch profile");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSendNotification = async () => {
    // Trimmed values
    const title = newNotification.title.trim();
    const message = newNotification.message.trim();
    const target = newNotification.target.trim();

    if (!title) {
      setValidationError("Title cannot be empty.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Title cannot be empty.",
      });
      return;
    }

    if (!message) {
      setValidationError("Message cannot be empty.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Message cannot be empty.",
      });
      return;
    }

    if (!target) {
      setValidationError("Please select a target role.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a target role.",
      });
      return;
    }

    setValidationError("");
    setLoading(true);

    const roleMap: { [key: string]: string } = {
      "All": "all",
      "Students": "student",
      "Teachers": "teacher",
    };

    const payload = {
      action: (target === "all" ? "notify_all" : "notify") as "notify" | "notify_all" | "notify_low_attendance",
      title,
      message,
      target: (roleMap[target] || target) as "all" | "student" | "teacher",
      branch_id: newNotification.branch_id,
    };

    try {
      const response = await sendNotification(payload);
      console.log("Notification response:", response);
      if (response.success) {
        // Refresh both received and sent notifications
        const receivedResponse = await getNotifications(newNotification.branch_id);
        if (receivedResponse.success && receivedResponse.data) {
          setNotifications(receivedResponse.data);
        }

        const sentResponse = await getSentNotifications(newNotification.branch_id);
        if (sentResponse.success && sentResponse.data) {
          setSentNotifications(sentResponse.data);
        }

        setNewNotification({
          action: "notify_all",
          title: "",
          message: "",
          target: "",
          branch_id: newNotification.branch_id,
        });

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

  const getBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "all":
        return theme === 'dark' ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-600";
      case "student":
        return theme === 'dark' ? "bg-rose-900 text-rose-200" : "bg-rose-100 text-rose-600";
      case "teacher":
        return theme === 'dark' ? "bg-violet-900 text-violet-200" : "bg-violet-100 text-violet-600";
      case "hod":
        return theme === 'dark' ? "bg-green-900 text-green-200" : "bg-green-100 text-green-600";
      default:
        return theme === 'dark' ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600";
    }
  };

  const getSenderBadgeColor = (createdBy: string) => {
    switch (createdBy.toLowerCase()) {
      case "all":
        return theme === 'dark' ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-600";
      case "student":
        return theme === 'dark' ? "bg-rose-900 text-rose-200" : "bg-rose-100 text-rose-600";
      case "teacher":
        return theme === 'dark' ? "bg-violet-900 text-violet-200" : "bg-violet-100 text-violet-600";
      default:
        return theme === 'dark' ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600";
    }
  };
  
  if (loading && !notifications.length && !sentNotifications.length) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Loading...</div>;
  }

  if (error) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{error}</div>;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 p-6 min-h-screen ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={`md:col-span-2 shadow-sm ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-xl ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Received Notifications</CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Notifications sent to you</p>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[400px] md:max-h-[500px] thin-scrollbar">
          <div>
            <table className="w-full text-left text-sm">
              <thead className={`border-b sticky top-0 z-10 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                <tr>
                  <th className={`pb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Message</th>
                  <th className={`pb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Target</th>
                  <th className={`pb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Sender</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((note) => (
                  <tr key={note.id} className={`border-b ${theme === 'dark' ? 'border-border hover:bg-accent' : 'border-gray-200 hover:bg-gray-100'}`}>
                    <td className="py-3">
                      <div className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{note.title}</div>
                      <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>{note.message}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getBadgeColor(note.role)}`}>
                        {note.role.charAt(0).toUpperCase() + note.role.slice(1).replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getSenderBadgeColor(note.created_by || 'Unknown')}`}>
                        {note.created_by || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className={`max-h-[650px] shadow-sm ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-xl ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Create Notification</CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Send a new group notification</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Target Role</label>
            <Select
              value={newNotification.target}
              onValueChange={(value) => setNewNotification({ ...newNotification, target: value })}
            >
              <SelectTrigger className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                <SelectValue placeholder="Select a target role" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
                <SelectItem value="All" className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>All</SelectItem>
                <SelectItem value="Students" className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>Students</SelectItem>
                <SelectItem value="Teachers" className={theme === 'dark' ? 'focus:bg-accent' : 'focus:bg-gray-100'}>Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Title</label>
            <Input
              className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
              placeholder="Notification Title"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            />
          </div>

          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Message</label>
            <Textarea
              className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
              rows={4}
              placeholder="Write your message here..."
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            />
          </div>

          {validationError && (
            <div className={theme === 'dark' ? 'text-destructive' : 'text-red-600'}>{validationError}</div>
          )}

          <Button
            className={`w-full bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] ${theme === 'dark' ? 'shadow-lg shadow-[#a259ff]/20' : 'shadow-md'}`}
            onClick={handleSendNotification}
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Notification"}
          </Button>
        </CardContent>
      </Card>

      <Card className={`md:col-span-3 shadow-sm ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-xl ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Sent Notifications</CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Notifications you created</p>
        </CardHeader>
        <CardContent className="overflow-auto max-h-[400px] md:max-h-[500px] thin-scrollbar">
          <div>
            <table className="w-full text-left text-sm">
              <thead className={`border-b sticky top-0 z-10 ${theme === 'dark' ? 'border-border bg-card' : 'border-gray-300 bg-white'}`}>
                <tr>
                  <th className={`pb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Message</th>
                  <th className={`pb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Target</th>
                  <th className={`pb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Sender</th>
                </tr>
              </thead>
              <tbody>
                {sentNotifications.map((note) => (
                  <tr key={note.id} className={`border-b ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
                    <td className="py-3">
                      <div className={`font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>{note.title}</div>
                      <div className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>{note.message}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getBadgeColor(note.role)}`}>
                        {note.role.charAt(0).toUpperCase() + note.role.slice(1).replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getSenderBadgeColor(note.created_by || 'You')}`}>
                        {note.created_by || 'You'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsManagement;