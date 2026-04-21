import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2, Eye, Clock, User, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { fetchAnnouncements, markAnnouncementRead, Announcement } from "@/utils/announcements_api";

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
    case "normal":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "🔴";
    case "high":
      return "🟠";
    case "normal":
      return "🔵";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

const isExpired = (expiresAt: string) => {
  try {
    return new Date(expiresAt) < new Date();
  } catch {
    return false;
  }
};

const StudentAnnouncements = () => {
  const [receivedAnnouncements, setReceivedAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "unread" | "priority">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "normal" | "high" | "urgent">("all");
  const { theme } = useTheme();

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    const response = await fetchAnnouncements(1, 100);

    if (response.success && response.data) {
      let receivedFiltered = response.data.received_announcements?.results || [];

      // Apply filters
      const applyFilters = (announcements: Announcement[]) => {
        let filtered = [...announcements];

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.title.toLowerCase().includes(query) ||
              a.message.toLowerCase().includes(query) ||
              a.created_by_name.toLowerCase().includes(query)
          );
        }

        // Filter by type
        if (filterType === "unread") {
          filtered = filtered.filter((a) => !a.is_read);
        }

        // Filter by priority
        if (priorityFilter !== "all") {
          filtered = filtered.filter((a) => a.priority === priorityFilter);
        }

        return filtered;
      };

      setReceivedAnnouncements(applyFilters(receivedFiltered));
      setError(null);
    } else {
      setError(response.message || "Failed to load announcements");
      setReceivedAnnouncements([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, [searchQuery, filterType, priorityFilter]);

  const handleMarkRead = async (announcementId: number) => {
    const response = await markAnnouncementRead(announcementId);
    if (response.success) {
      setReceivedAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, is_read: true } : a))
      );
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Stay updated with latest announcements</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Announcements</SelectItem>
            <SelectItem value="unread">Unread Only</SelectItem>
            <SelectItem value="priority">By Priority</SelectItem>
          </SelectContent>
        </Select>
        {filterType === "priority" && (
          <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Announcement Cards */}
      {!loading && !error && (
        <div className="space-y-4">
          {receivedAnnouncements.length === 0 ? (
            <Card className="text-center p-8">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No announcements found</p>
            </Card>
          ) : (
            receivedAnnouncements.map((announcement) => (
              <Card
                key={announcement.id}
                className={`hover:shadow-lg transition-shadow ${
                  !announcement.is_read ? "border-l-4 border-l-blue-500" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                          {!announcement.is_read && (
                            <Badge className="bg-blue-500">NEW</Badge>
                          )}
                          {isExpired(announcement.expires_at) && (
                            <Badge variant="destructive">EXPIRED</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{announcement.created_by_name}</span>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(announcement.created_at)}</span>
                        <span>•</span>
                        <span>{announcement.branch_name}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getPriorityIcon(announcement.priority)}</span>
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                  </div>

                  <p className="text-sm line-clamp-3">{announcement.message}</p>

                  <div className="flex flex-wrap gap-2">
                    {announcement.target_roles?.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="capitalize"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-muted-foreground">
                      Expires: {announcement.expires_at?.split("T")[0]}
                    </span>
                    {!announcement.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkRead(announcement.id)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAnnouncements;