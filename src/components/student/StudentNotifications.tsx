import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Megaphone, Bell } from "lucide-react";
import { getNotifications } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";

interface Notification {
  id: string;
  title: string;
  message: string;
}

// Sample notifications (can be removed once API is connected)
const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Internal Marks Released",
    message: "Your internal marks for Semester 4 have been published.",
  },
  {
    id: "2",
    title: "Assignment Deadline Extended",
    message: "The submission deadline for the DBMS assignment is now April 22.",
  },
  {
    id: "3",
    title: "Class Cancelled",
    message: "Tomorrow's Applied Mathematics lecture (10:00 AM) is cancelled.",
  },
];

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNotifications();
      if (data.success && Array.isArray(data.data)) {
        setNotifications(data.data);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            <CardTitle className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Notifications</CardTitle>
          </div>
          <CardDescription className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
            View all recent updates from your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-4 transition-colors ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{item.title}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.message}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                    New
                  </Badge>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Bell className="mx-auto h-8 w-8 mb-2" />
                <p>No notifications available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentNotifications;