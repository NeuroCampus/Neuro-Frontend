import { useState } from "react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "../../hooks/use-toast";

const API_BASE_URL = "http://127.0.0.1:8000/api/";

interface ProfileProps {
  role: string;
  user: any;
}

const Profile = ({ role, user }: ProfileProps) => {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profile_image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setProfilePicture(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formDataObj = new FormData();
      formDataObj.append("email", formData.email);
      formDataObj.append("first_name", formData.first_name);
      formDataObj.append("last_name", formData.last_name);
      if (profilePicture) {
        formDataObj.append("profile_image", profilePicture);
      }

      const endpoint =
        role === "admin"
          ? `${API_BASE_URL}admin/users/`
          : role === "student"
          ? `${API_BASE_URL}student/update-profile/`
          : `${API_BASE_URL}${role}/profile/`;

      const method = role === "admin" ? "POST" : role === "student" ? "POST" : "PATCH";
      const body = role === "admin" ? { user_id: user.user_id, action: "edit", updates: Object.fromEntries(formDataObj) } : formDataObj;

      const response = await fetchWithTokenRefresh(endpoint, {
        method,
        headers: role === "admin" ? { "Content-Type": "application/json" } : {},
        body: role === "admin" ? JSON.stringify(body) : formDataObj,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Profile updated successfully");
        toast({ title: "Success", description: "Profile updated successfully" });
        const updatedUser = { ...user, ...formData };
        if (data.data?.profile_image) {
          updatedUser.profile_image = data.data.profile_image;
        }
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        setError(data.message || "Failed to update profile");
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to update profile" });
      }
    } catch (err) {
      setError("Error updating profile");
      toast({ variant: "destructive", title: "Error", description: "Error updating profile" });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    const firstName = formData.first_name || user?.first_name || "";
    const lastName = formData.last_name || user?.last_name || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-500 text-white p-2 rounded mb-4">{success}</div>}

        <div className="space-y-6">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Profile" />
              ) : (
                <AvatarFallback>{getInitials()}</AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="space-y-1">
            <label htmlFor="profile_image" className="text-sm font-medium">
              Profile Picture
            </label>
            <Input
              id="profile_image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="first_name" className="text-sm font-medium">
              First Name
            </label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="First Name"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="last_name" className="text-sm font-medium">
              Last Name
            </label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Last Name"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Profile;