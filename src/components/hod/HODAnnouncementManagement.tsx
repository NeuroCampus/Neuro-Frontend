import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit, Trash2, Eye, Users, Calendar } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
  getAnnouncementReaders,
  Announcement,
  CreateAnnouncementRequest,
} from "@/utils/announcements_api";

const HODAnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReadersDialog, setShowReadersDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<number | null>(null);
  const [readers, setReaders] = useState<any[]>([]);
  const [readersLoading, setReadersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const { theme } = useTheme();

  // Get current user
  const getCurrentUser = () => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  };

  const currentUser = getCurrentUser();

  // Form state
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: "",
    message: "",
    target_roles: ["student", "teacher"],
    is_global: false,
    expires_at: "",
    priority: "normal",
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    const response = await fetchAnnouncements(1, 50);

    if (response.success && response.data) {
      // Filter to show only announcements for this HOD's branch
      // In production, the backend would filter these based on user permissions
      let filtered = response.data.results || [];

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.message.toLowerCase().includes(query)
        );
      }

      if (filterActive !== "all") {
        filtered = filtered.filter(
          (a) => a.is_active === (filterActive === "active")
        );
      }

      setAnnouncements(filtered);
      setError(null);
    } else {
      setError(response.message || "Failed to load announcements");
      setAnnouncements([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, [filterActive]);

  const handleViewReaders = async (announcementId: number) => {
    setSelectedAnnouncementId(announcementId);
    setReadersLoading(true);
    const response = await getAnnouncementReaders(announcementId);
    if (response.success && response.data) {
      setReaders(response.data);
    }
    setReadersLoading(false);
    setShowReadersDialog(true);
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.target_roles.length === 0) {
      alert("Please select at least one target role");
      return;
    }

    try {
      // HOD announcements are always branch-specific and not global
      const payload: CreateAnnouncementRequest = {
        ...formData,
        is_global: false,
      };

      if (editingId) {
        const response = await updateAnnouncement(editingId, payload);
        if (response.success) {
          setAnnouncements((prev) =>
            prev.map((a) => (a.id === editingId ? response.data : a))
          );
          alert("Announcement updated successfully");
        } else {
          alert(response.message || "Failed to update announcement");
        }
      } else {
        const response = await createAnnouncement(payload);
        if (response.success) {
          setAnnouncements((prev) => [response.data, ...prev]);
          alert("Announcement created successfully");
        } else {
          alert(response.message || "Failed to create announcement");
        }
      }

      setShowCreateDialog(false);
      resetForm();
    } catch (error: any) {
      alert(error.message || "An error occurred");
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      target_roles: announcement.target_roles,
      is_global: false,
      branch: announcement.branch,
      expires_at: announcement.expires_at?.split("T")[0] || "",
      priority: announcement.priority,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await deleteAnnouncement(deletingId);
      if (response.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== deletingId));
        alert("Announcement deleted successfully");
      } else {
        alert(response.message || "Failed to delete announcement");
      }
      setDeletingId(null);
    } catch (error: any) {
      alert(error.message || "An error occurred");
    }
  };

  const handleToggleActive = async (announcementId: number) => {
    try {
      const response = await toggleAnnouncementActive(announcementId);
      if (response.success) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId ? response.data : a))
        );
      } else {
        alert(response.message || "Failed to toggle announcement");
      }
    } catch (error: any) {
      alert(error.message || "An error occurred");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      message: "",
      target_roles: ["student", "teacher"],
      is_global: false,
      expires_at: "",
      priority: "normal",
    });
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const roles = ["student", "teacher", "faculty"];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Branch Announcements</h1>
          <p className="text-muted-foreground">
            Create and manage announcements for your branch
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the announcement details below"
                  : "Create a new announcement for your branch"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Announcement title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Announcement message (supports HTML)"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expires At</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) =>
                      setFormData({ ...formData, expires_at: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  ℹ️ This announcement will be visible to your branch only
                </p>
              </div>

              <div className="space-y-2">
                <Label>Target Roles *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <div key={role} className="flex items-center gap-2">
                      <Checkbox
                        id={role}
                        checked={formData.target_roles.includes(role)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              target_roles: [
                                ...formData.target_roles,
                                role,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              target_roles: formData.target_roles.filter(
                                (r) => r !== role
                              ),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={role} className="font-normal capitalize">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateOrUpdate}>
                  {editingId ? "Update" : "Create"} Announcement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select value={filterActive} onValueChange={(value: any) => setFilterActive(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Announcements Grid */}
      {!loading && !error && (
        <div className="grid gap-4">
          {announcements.length > 0 ? (
            announcements.map((announcement) => (
              <Card key={announcement.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {announcement.title}
                        </CardTitle>
                        <Badge className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                        <Badge
                          variant={announcement.is_active ? "default" : "secondary"}
                        >
                          {announcement.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{announcement.read_count} read</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Created:{" "}
                            {formatDate(announcement.created_at)}
                          </span>
                        </div>
                        {announcement.expires_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Expires:{" "}
                              {formatDate(announcement.expires_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    className="text-sm leading-relaxed text-foreground/80 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: announcement.message,
                    }}
                  />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {announcement.target_roles.map((role) => (
                      <Badge key={role} variant="outline" className="capitalize">
                        {role}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReaders(announcement.id)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Readers ({announcement.read_count})
                    </Button>
                    {currentUser && announcement.created_by === currentUser.id && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(announcement)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant={announcement.is_active ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleToggleActive(announcement.id)}
                        >
                          {announcement.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingId(announcement.id)}
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No announcements found</p>
            </Card>
          )}
        </div>
      )}

      {/* Readers Dialog */}
      <Dialog open={showReadersDialog} onOpenChange={setShowReadersDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Announcement Readers</DialogTitle>
            <DialogDescription>
              Users who have viewed this announcement
            </DialogDescription>
          </DialogHeader>
          {readersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : readers.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {readers.map((reader) => (
                <Card key={reader.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{reader.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reader.user_email}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reader.read_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No readers yet
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HODAnnouncementManagement;
