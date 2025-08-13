import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../ui/use-toast";
import { manageNotifications, manageProfile, getSentNotifications } from "../../utils/hod_api";

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
          const receivedResponse = await manageNotifications({ branch_id: branchId }, "GET", "received");
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
    if (!newNotification.title || !newNotification.message || !newNotification.target) {
      setValidationError("Please fill out all required fields.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill out all required fields.",
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
      ...newNotification,
      target: roleMap[newNotification.target] || newNotification.target,
    };

    try {
      const response = await manageNotifications(payload, "POST");
      console.log("Notification response:", response);
      if (response.success) {
        // Refresh both received and sent notifications
        const receivedResponse = await manageNotifications({ branch_id: newNotification.branch_id }, "GET", "received");
        if (receivedResponse.success && receivedResponse.data) {
          setNotifications(receivedResponse.data);
        }
        const sentResponse = await getSentNotifications(newNotification.branch_id);
        if (sentResponse.success && sentResponse.data) {
          setSentNotifications(sentResponse.data);
        }
        setNewNotification({ action: "notify_all", title: "", message: "", target: "", branch_id: newNotification.branch_id });
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
        return "bg-blue-100 text-blue-600"; // Matches light blue badge
      case "student":
        return "bg-rose-100 text-rose-600"; // Matches light red/pink badge
      case "teacher":
        return "bg-violet-100 text-violet-600"; // Matches light violet badge
      case "hod":
        return "bg-green-100 text-green-600"; // Matches light green badge
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getSenderBadgeColor = (createdBy: string) => {
    switch (createdBy.toLowerCase()) {
      case "all":
        return "bg-blue-100 text-blue-600";
      case "student":
        return "bg-rose-100 text-rose-600";
      case "teacher":
        return "bg-violet-100 text-violet-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  if (loading && !notifications.length && !sentNotifications.length) {
    return <div className="text-center py-6">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#1c1c1e] text-gray-200 min-h-screen">
      <Card className="md:col-span-2 bg-[#1c1c1e] text-gray-200 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200">Received Notifications</CardTitle>
          <p className="text-sm text-gray-400">Notifications sent to you</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="pb-2 text-gray-200">Message</th>
                  <th className="pb-2 text-gray-200">Target</th>
                  <th className="pb-2 text-gray-200">Sender</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((note) => (
                  <tr key={note.id} className="border-b border-gray-200 hover:bg-gray-500 transition">
                    <td className="py-3">
                      <div className="font-medium text-gray-200">{note.title}</div>
                      <div className="text-gray-400 text-sm">{note.message}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getBadgeColor(note.role)}`}>
                        {note.role.charAt(0).toUpperCase() + note.role.slice(1).replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-200">
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

      <Card className="bg-[#1c1c1e] text-gray-200 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200">Create Notification</CardTitle>
          <p className="text-sm text-gray-400">Send a new group notification</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-400">Target Role</label>
            <Select
              value={newNotification.target}
              onValueChange={(value) => setNewNotification({ ...newNotification, target: value })}
            >
              <SelectTrigger className="bg-[#232326] text-gray-400 border-gray-300">
                <SelectValue placeholder="Select a target role" />
              </SelectTrigger>
              <SelectContent className="bg-[#232326] text-gray-400 border-gray-200">
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Students">Students</SelectItem>
                <SelectItem value="Teachers">Teachers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-400">Title</label>
            <Input
              className="bg-[#232326] text-gray-200 border-gray-300"
              placeholder="Notification Title"
              value={newNotification.title}
              onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-gray-400">Message</label>
            <Textarea
              className="bg-[#232326] text-gray-200 border-gray-300"
              rows={4}
              placeholder="Write your message here..."
              value={newNotification.message}
              onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
            />
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

      <Card className="md:col-span-3 bg-[#1c1c1e] text-gray-200 border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-200">Sent Notifications</CardTitle>
          <p className="text-sm text-gray-400">Notifications you created</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-300">
                <tr>
                  <th className="pb-2 text-gray-200">Message</th>
                  <th className="pb-2 text-gray-200">Target</th>
                  <th className="pb-2 text-gray-200">Sender</th>
                </tr>
              </thead>
              <tbody>
                {sentNotifications.map((note) => (
                  <tr key={note.id} className="border-b border-gray-200 transition">
                    <td className="py-3">
                      <div className="font-medium text-gray-200">{note.title}</div>
                      <div className="text-gray-400 text-sm">{note.message}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${getBadgeColor(note.role)}`}>
                        {note.role.charAt(0).toUpperCase() + note.role.slice(1).replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
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
