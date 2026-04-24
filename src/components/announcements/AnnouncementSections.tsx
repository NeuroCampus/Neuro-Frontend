import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Trash2, Eye, Clock, User, AlertCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Announcement } from "@/utils/announcements_api";

interface AnnouncementSectionsProps {
  myAnnouncements: Announcement[];
  receivedAnnouncements: Announcement[];
  onEdit: (announcement: Announcement) => void;
  onDelete: (announcementId: number) => void;
  onToggleActive: (announcementId: number) => void;
  onMarkRead: (announcementId: number) => void;
  loading?: boolean;
  showActions?: boolean; // Whether to show edit/delete buttons
}

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
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isExpired = (expiresAt: string) => {
  return new Date(expiresAt) < new Date();
};

const AnnouncementCard = ({
  announcement,
  isOwner,
  onEdit,
  onDelete,
  onToggleActive,
  onMarkRead,
  theme,
}: {
  announcement: Announcement;
  isOwner: boolean;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcementId: number) => void;
  onToggleActive?: (announcementId: number) => void;
  onMarkRead?: (announcementId: number) => void;
  theme: string;
}) => {
  const expired = isExpired(announcement.expires_at);
  const unread = announcement.is_read === false;

  return (
    <Card
      className={`transition-all ${
        unread
          ? "border-2 border-blue-500 shadow-md"
          : "border-gray-200 dark:border-gray-700"
      } ${
        expired
          ? "opacity-60 bg-gray-50 dark:bg-gray-900"
          : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold truncate">{announcement.title}</h3>
              {unread && (
                <Badge className="bg-blue-600 text-white text-xs">NEW</Badge>
              )}
              {expired && (
                <Badge className="bg-gray-600 text-white text-xs">EXPIRED</Badge>
              )}
              {!announcement.is_active && (
                <Badge className="bg-yellow-600 text-white text-xs">INACTIVE</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {announcement.created_by_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(announcement.created_at)}
              </span>
              {announcement.branch_name && (
                <>
                  <span>•</span>
                  <span>{announcement.branch_name}</span>
                </>
              )}
            </div>
          </div>
          <Badge className={getPriorityColor(announcement.priority)}>
            {getPriorityIcon(announcement.priority)} {announcement.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
          <p className="text-sm text-foreground line-clamp-4">
            {announcement.message}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {announcement.target_roles.map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {role}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            {expired ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-3 h-3" />
                Expired on {formatDate(announcement.expires_at)}
              </span>
            ) : (
              <span>Expires: {formatDate(announcement.expires_at)}</span>
            )}
          </div>
          {announcement.is_global && (
            <Badge variant="outline" className="text-xs">
              Global
            </Badge>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          {isOwner && onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(announcement)}
              className="gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </Button>
          )}
          {isOwner && onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(announcement.id)}
              className="gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </Button>
          )}
          {isOwner && onToggleActive && (
            <Button
              size="sm"
              variant={announcement.is_active ? "default" : "outline"}
              onClick={() => onToggleActive(announcement.id)}
              className="gap-1"
            >
              {announcement.is_active ? "Deactivate" : "Activate"}
            </Button>
          )}
          {!isOwner && unread && onMarkRead && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkRead(announcement.id)}
              className="gap-1 ml-auto"
            >
              <Eye className="w-3 h-3" />
              Mark as Read
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AnnouncementSections = ({
  myAnnouncements,
  receivedAnnouncements,
  onEdit,
  onDelete,
  onToggleActive,
  onMarkRead,
  loading = false,
  showActions = true,
}: AnnouncementSectionsProps) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("my");
  const [showExpired, setShowExpired] = useState(false);

  const filteredMyAnnouncements = showExpired 
    ? myAnnouncements 
    : myAnnouncements.filter(a => !isExpired(a.expires_at));
    
  const filteredReceivedAnnouncements = showExpired 
    ? receivedAnnouncements 
    : receivedAnnouncements.filter(a => !isExpired(a.expires_at));

  const totalUnread = receivedAnnouncements.filter(
    (a) => !a.is_read && !isExpired(a.expires_at)
  ).length;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my" className="gap-2">
            My Announcements
            {filteredMyAnnouncements.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filteredMyAnnouncements.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            Received
            {totalUnread > 0 && (
              <Badge className="bg-blue-600 text-white text-xs">
                {totalUnread}
              </Badge>
            )}
            {filteredReceivedAnnouncements.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-1">
                {filteredReceivedAnnouncements.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExpired(!showExpired)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showExpired ? "Hide Expired" : "Show Expired"}
        </Button>
      </div>

      <TabsContent value="my" className="space-y-4 mt-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        ) : myAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No announcements created yet. Create your first announcement!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMyAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isOwner={true}
                onEdit={showActions ? onEdit : undefined}
                onDelete={showActions ? onDelete : undefined}
                onToggleActive={showActions ? onToggleActive : undefined}
                theme={theme}
              />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="received" className="space-y-4 mt-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        ) : receivedAnnouncements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No announcements received yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReceivedAnnouncements.map((announcement) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                isOwner={false}
                onMarkRead={onMarkRead}
                theme={theme}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default AnnouncementSections;
