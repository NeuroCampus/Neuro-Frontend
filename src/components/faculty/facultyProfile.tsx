import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { getFacultyProfile, manageProfile } from "../../utils/faculty_api";

const FacultyProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    address: "",
    bio: "",
    profile_picture: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getFacultyProfile()
      .then((res) => {
        if (res.success && res.data) {
          setFormData({
            firstName: res.data.first_name || "",
            lastName: res.data.last_name || "",
            email: res.data.email || "",
            mobile: res.data.mobile || "",
            address: res.data.address || "",
            bio: res.data.bio || "",
            profile_picture: res.data.profile_picture || "",
          });
        } else {
          setError(res.message || "Failed to load profile");
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      const res = await manageProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        // profile_picture: ... (handle file upload if needed)
      });
      if (res.success) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
      } else {
        setError(res.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading profile...</div>;
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle className="text-xl font-semibold">
              Profile Information
            </CardTitle>
            <p className="text-sm text-gray-500">
              View and update your personal information
            </p>
          </div>
          <Button
            variant="outline"
            className="text-sm px-4 py-1.5"
            onClick={() => {
              if (isEditing) handleSave();
              else setIsEditing(true);
            }}
          >
            {isEditing ? "Save" : "Edit Profile"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <div className="flex flex-col items-center mb-6 mt-4">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarFallback>FA</AvatarFallback>
          </Avatar>
          <div className="text-base font-medium">
            {formData.firstName} {formData.lastName}
          </div>
          <div className="text-sm text-gray-500">Faculty</div>
        </div>

        <div className="space-y-4">
          {[
            { label: "First Name", key: "firstName" },
            { label: "Last Name", key: "lastName" },
            { label: "Email Address", key: "email" },
            { label: "Mobile Number", key: "mobile" },
            { label: "Address", key: "address" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm text-gray-600 mb-1">{label}</label>
              {isEditing ? (
                <Input
                  value={formData[key as keyof typeof formData]}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              ) : (
                <div className="bg-gray-100 border rounded px-3 py-2 text-sm text-gray-700 hover:border-gray-400 hover:shadow-sm transition cursor-not-allowed">
                  {formData[key as keyof typeof formData]}
                </div>
              )}
            </div>
          ))}

          {/* Bio is always editable */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="resize-none bg-white"
              disabled={!isEditing}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacultyProfile;
