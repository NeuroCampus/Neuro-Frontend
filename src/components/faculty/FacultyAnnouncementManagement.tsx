import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementActive,
  markAnnouncementRead,
  Announcement,
  CreateAnnouncementRequest,
} from "@/utils/announcements_api";
import AnnouncementSections from "@/components/announcements/AnnouncementSections";

const FacultyAnnouncementManagement = () => {
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [receivedAnnouncements, setReceivedAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { theme } = useTheme();

  // Form state
  const [formData, setFormData] = useState<CreateAnnouncementRequest>({
    title: "",
    message: "",
    target_roles: ["student"],
    is_global: false,
    expires_at: "",
    priority: "normal",
  });

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);
    const response = await fetchAnnouncements(1, 50);

    if (response.success && response.data) {
      setMyAnnouncements(response.data.my_announcements.results || []);
      setReceivedAnnouncements(response.data.received_announcements.results || []);
      setError(null);
    } else {
      setError(response.message || "Failed to load announcements");
      setMyAnnouncements([]);
      setReceivedAnnouncements([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert("Please fill all required fields");
      return;
    }

    try {
      // Faculty announcements are always for students only and branch-specific
      const payload: CreateAnnouncementRequest = {
        ...formData,
        target_roles: ["student"],
        is_global: false,
      };

      if (editingId) {
        const response = await updateAnnouncement(editingId, payload);
        if (response.success) {
          setMyAnnouncements((prev) =>
            prev.map((a) => (a.id === editingId ? response.data : a))
          );
          alert("Announcement updated successfully");
        } else {
          alert(response.message || "Failed to update announcement");
        }
      } else {
        const response = await createAnnouncement(payload);
        if (response.success) {
          setMyAnnouncements((prev) => [response.data, ...prev]);
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
      target_roles: ["student"],
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
        setMyAnnouncements((prev) => prev.filter((a) => a.id !== deletingId));
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
        setMyAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId ? response.data : a))
        );
        setReceivedAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId ? response.data : a))
        );
      } else {
        alert(response.message || "Failed to toggle announcement");
      }
    } catch (error: any) {
      alert(error.message || "An error occurred");
    }
  };

  const handleMarkRead = async (announcementId: number) => {
    try {
      const response = await markAnnouncementRead(announcementId);
      if (response.success) {
        setReceivedAnnouncements((prev) =>
          prev.map((a) => (a.id === announcementId ? { ...a, is_read: true } : a))
        );
      }
    } catch (error: any) {
      console.error("Failed to mark as read:", error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      message: "",
      target_roles: ["student"],
      is_global: false,
      expires_at: "",
      priority: "normal",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Announcements for Proctor Students
          </h1>
          <p className="text-muted-foreground">
            Create and manage announcements for your proctor group
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
                {editingId
                  ? "Edit Announcement"
                  : "Create Announcement for Proctor Students"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the announcement details below"
                  : "Create a new announcement that will be sent to your proctor students"}
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
                  placeholder="Announcement message"
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
                  ℹ️ This announcement will be visible to your proctor students only
                </p>
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

      {/* Announcement Sections */}
      {!loading && !error && (
        <AnnouncementSections
          myAnnouncements={myAnnouncements}
          receivedAnnouncements={receivedAnnouncements}
          onEdit={handleEdit}
          onDelete={(id) => setDeletingId(id)}
          onToggleActive={handleToggleActive}
          onMarkRead={handleMarkRead}
          loading={loading}
          showActions={true}
        />
      )}

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

export default FacultyAnnouncementManagement;
