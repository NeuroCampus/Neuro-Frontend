// FacultyProfile.tsx
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
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

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

  const handleChange = (
    field: string,
    value: string
  ) => {
    let newValue = value;
    let errorMessage = "";

    switch (field) {
      case "firstName":
      case "lastName":
        if (!/^[A-Za-z\s]{2,50}$/.test(newValue)) {
          errorMessage = "Only letters allowed (2–50 characters)";
        }
        break;

      case "email":
        if (
          !/^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(
            newValue
          )
        ) {
          errorMessage = "Invalid email format";
        }
        break;

      case "mobile":
        newValue = newValue.replace(/\D/g, "");
        if (newValue.length !== 10) {
          errorMessage = "Mobile number must be exactly 10 digits";
        }
        break;

      case "address":
        newValue = newValue.replace(/[^a-zA-Z0-9\s,./-]/g, "");
        if (newValue.trim().length < 5) {
          errorMessage = "Address must be at least 5 characters";
        } else if (newValue.length > 200) {
          newValue = newValue.slice(0, 200);
        }
        break;

      case "bio":
        newValue = newValue.replace(/[^a-zA-Z0-9\s.,!?]/g, "");
        if (newValue.trim().length < 10) {
          errorMessage = "Bio must be at least 10 characters";
        } else if (newValue.length > 300) {
          newValue = newValue.slice(0, 300);
        }
        break;
    }

    setFormData((prev) => ({ ...prev, [field]: newValue }));
    setLocalErrors((prev) => ({ ...prev, [field]: errorMessage }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    // Prevent save if validation errors exist
    const hasErrors = Object.values(localErrors).some((msg) => msg);
    if (hasErrors) {
      setError("Please fix the errors before saving.");
      return;
    }

    try {
      const res = await manageProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        bio: formData.bio,
        // profile_picture: ...
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
    <Card className="max-w-2xl mx-auto mt-10 bg-[#1c1c1e] text-gray-200">
      <CardHeader className="flex flex-col items-start gap-2">
        <div className="flex justify-between items-center w-full">
          <div>
            <CardTitle className="text-xl font-semibold">
              Profile Information
            </CardTitle>
            <p className="text-sm text-gray-300">
              View and update your personal information
            </p>
          </div>
          <Button
            variant="outline"
            className="text-sm px-4 py-1.5 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
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
          <div className="text-sm text-gray-300">Faculty</div>
        </div>

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">First Name</label>
            <Input
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              disabled={!isEditing}
              className="w-full bg-[#232326] text-gray-200 border border-gray-600 focus:border-gray-400 focus:ring-0"
              placeholder="Enter your first name"
            />
            {localErrors.firstName && (
              <p className="text-red-500 text-xs mt-1">{localErrors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">Last Name</label>
            <Input
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              disabled={!isEditing}
              className="w-full bg-[#232326] text-gray-200 border border-gray-600 focus:border-gray-400 focus:ring-0"
              placeholder="Enter your last name"
            />
            {localErrors.lastName && (
              <p className="text-red-500 text-xs mt-1">{localErrors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">Email Address</label>
            <Input
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!isEditing}
              className="w-full bg-[#232326] text-gray-200 border border-gray-600 focus:border-gray-400 focus:ring-0"
              placeholder="Enter a valid email"
            />
            {localErrors.email && (
              <p className="text-red-500 text-xs mt-1">{localErrors.email}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">Mobile Number</label>
            <Input
              value={formData.mobile}
              onChange={(e) => handleChange("mobile", e.target.value)}
              disabled={!isEditing}
              maxLength={10}
              className="w-full bg-[#232326] text-gray-200 border border-gray-600 focus:border-gray-400 focus:ring-0"
              placeholder="Enter 10-digit mobile number"
            />
            {localErrors.mobile && (
              <p className="text-red-500 text-xs mt-1">{localErrors.mobile}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">Address</label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={!isEditing}
              className="w-full bg-[#232326] text-gray-200 border border-gray-600 focus:border-gray-400 focus:ring-0"
              placeholder="Enter your address (5–200 characters)"
            />
            {localErrors.address && (
              <p className="text-red-500 text-xs mt-1">{localErrors.address}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              disabled={!isEditing}
              className="w-full bg-[#232326] text-gray-200 resize-none overflow-y-auto thin-scrollbar"
              placeholder="Tell us about yourself (10–300 characters)"
              rows={1}
              style={{ maxHeight: "200px" }}
              onInput={(e) => {
                const target = e.currentTarget;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
              }}
            />
            {localErrors.bio && (
              <p className="text-red-500 text-xs mt-1">{localErrors.bio}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacultyProfile;
