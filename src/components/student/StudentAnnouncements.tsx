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
import { getAnnouncements } from "../../utils/student_api";
import { useTheme } from "@/context/ThemeContext";

// Style maps for optional fields (if backend expands later)
const categoryStyles = {
  academic: "bg-blue-500",
  sports: "bg-green-500",
  cultural: "bg-purple-500",
  general: "bg-gray-500",
};

const priorityStyles = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

interface Announcement {
  id?: number;
  title: string;
  content: string;
  created_at: string;
  category?: string;
  priority?: string;
  from?: string;
}

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await getAnnouncements();
        if (response.success && response.data) {
          setAnnouncements(response.data);
        } else {
          console.error("Failed to fetch announcements:", response.message);
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
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
      <Card className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200' : 'bg-white text-gray-900'}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            <CardTitle className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Announcements</CardTitle>
          </div>
          <CardDescription className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>
            Stay updated with the latest announcements and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Make announcements scrollable */}
          <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {announcements.slice(0, 6).map((announcement, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-4 transition-colors ${
                  theme === 'dark' ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{announcement.title}</h3>
                      {announcement.priority === "high" && (
                        <Badge
                          variant="destructive"
                          className="uppercase text-[10px]"
                        >
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>
                        {announcement.from || "Admin Office"}
                      </span>
                      <span>•</span>
                      <span>{announcement.created_at}</span>
                    </div>
                  </div>
                  {announcement.category && (
                    <Badge
                      variant="secondary"
                      className={`${
                        categoryStyles[
                          announcement.category as keyof typeof categoryStyles
                        ] || "bg-gray-200"
                      } text-white`}
                    >
                      {announcement.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                <Bell className="mx-auto h-8 w-8 mb-2" />
                <p>No announcements at the moment</p>
              </div>
            )}
          </div>
        </CardContent>

      </Card>
    </div>
  );
};

export default StudentAnnouncements;