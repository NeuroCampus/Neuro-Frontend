// FacultyProfile.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { getFacultyProfile, manageProfile } from "../../utils/faculty_api";
import { useTheme } from "@/context/ThemeContext";
import { showSuccessAlert, showErrorAlert } from "../../utils/sweetalert";

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
    // faculty-specific fields returned in the new `profile` object
    department: "",
    designation: "",
    qualification: "",
    branch: "",
    experience_years: "",
    office_location: "",
    office_hours: "",
    date_of_birth: "",
    gender: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "contact" | "about">("personal");
  const { theme } = useTheme();

  useEffect(() => {
    setLoading(true);
    getFacultyProfile()
      .then((res) => {
        // Backend now returns { success: true, profile: { ... } }
        const payload = res.profile || res.data || null;
        if (res.success && payload) {
          setFormData({
            firstName: payload.first_name || "",
            lastName: payload.last_name || "",
            email: payload.email || "",
            mobile: payload.mobile_number || payload.mobile || "",
            address: payload.address || "",
            bio: payload.bio || "",
            profile_picture: payload.profile_picture || payload.profile_picture_url || "",
            department: payload.department || "",
            designation: payload.designation || "",
            qualification: payload.qualification || "",
            branch: payload.branch || "",
            experience_years: payload.experience_years ? String(payload.experience_years) : "",
            office_location: payload.office_location || "",
            office_hours: payload.office_hours || "",
            date_of_birth: payload.date_of_birth || "",
            gender: payload.gender || "",
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
      });

      // Backend may return updated profile under `profile` or `data`
      const payload = res.profile || res.data || null;
      if (res.success) {
        showSuccessAlert("Success", "Profile updated successfully!");
        // Update local formData from returned payload when available
        if (payload) {
          setFormData((prev) => ({ ...prev, firstName: payload.first_name || prev.firstName, lastName: payload.last_name || prev.lastName, email: payload.email || prev.email, mobile: payload.mobile_number || payload.mobile || prev.mobile, address: payload.address || prev.address, bio: payload.bio || prev.bio, profile_picture: payload.profile_picture || prev.profile_picture }));
        }
        setIsEditing(false);
      } else {
        setError(res.message || "Failed to update profile");
        showErrorAlert("Error", res.message || "Failed to update profile");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (loading) {
    return <div className={`p-6 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading profile...</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "personal":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>First Name</label>
                <Input value={formData.firstName} onChange={(e) => handleChange("firstName", e.target.value)} disabled={!isEditing} placeholder="First name" />
                {localErrors.firstName && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.firstName}</p>}
              </div>

              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Last Name</label>
                <Input value={formData.lastName} onChange={(e) => handleChange("lastName", e.target.value)} disabled={!isEditing} placeholder="Last name" />
                {localErrors.lastName && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Date of Birth</label>
              <Input value={formData.date_of_birth} onChange={(e) => handleChange("date_of_birth", e.target.value)} disabled={!isEditing} placeholder="YYYY-MM-DD" />
            </div>

            <div>
              <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Gender</label>
              <Input value={formData.gender} onChange={(e) => handleChange("gender", e.target.value)} disabled={!isEditing} placeholder="Gender" />
            </div>
          </div>
        );

      case "academic":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Department</label>
                <Input value={formData.department} onChange={(e) => handleChange("department", e.target.value)} disabled={!isEditing} placeholder="Department" />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Designation</label>
                <Input value={formData.designation} onChange={(e) => handleChange("designation", e.target.value)} disabled={!isEditing} placeholder="Designation" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Qualification</label>
                <Input value={formData.qualification} onChange={(e) => handleChange("qualification", e.target.value)} disabled={!isEditing} placeholder="Qualification" />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Branch</label>
                <Input value={formData.branch} onChange={(e) => handleChange("branch", e.target.value)} disabled={!isEditing} placeholder="Branch" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Experience (years)</label>
                <Input value={formData.experience_years} onChange={(e) => handleChange("experience_years", e.target.value)} disabled={!isEditing} placeholder="Experience" />
              </div>
              <div>
                <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Office Location</label>
                <Input value={formData.office_location} onChange={(e) => handleChange("office_location", e.target.value)} disabled={!isEditing} placeholder="Office" />
              </div>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Email</label>
              <Input value={formData.email} onChange={(e) => handleChange("email", e.target.value)} disabled={!isEditing} placeholder="Email address" />
              {localErrors.email && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.email}</p>}
            </div>

            <div>
              <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Mobile</label>
              <Input value={formData.mobile} onChange={(e) => handleChange("mobile", e.target.value)} disabled={!isEditing} maxLength={10} placeholder="10-digit mobile" />
              {localErrors.mobile && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.mobile}</p>}
            </div>

            <div>
              <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Address</label>
              <Textarea value={formData.address} onChange={(e) => handleChange("address", e.target.value)} disabled={!isEditing} placeholder="Address" rows={3} />
              {localErrors.address && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.address}</p>}
            </div>
          </div>
        );

      case "about":
        return (
          <div>
            <label className={`block text-sm mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Bio</label>
            <Textarea value={formData.bio} onChange={(e) => handleChange("bio", e.target.value)} disabled={!isEditing} placeholder="Tell us about yourself" rows={4} />
            {localErrors.bio && <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.bio}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={theme === 'dark' ? 'max-w-4xl mx-auto mt-8 bg-card text-foreground' : 'max-w-4xl mx-auto mt-8 bg-white text-gray-900'}>
      <CardHeader className="flex items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg font-semibold">Faculty Profile</CardTitle>
          <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Manage your profile and academic details</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-sm" onClick={() => { if (isEditing) { setIsEditing(false); } else { setIsEditing(true); } }}>{isEditing ? 'Cancel' : 'Edit'}</Button>
          <Button className="text-sm px-4 py-1.5 bg-[#6b46c1] text-white border-[#6b46c1] hover:bg-[#5a3db0]" onClick={() => { if (isEditing) handleSave(); else setIsEditing(true); }}>{isEditing ? 'Save' : 'Edit Profile'}</Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && <div className={`mb-3 ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column: avatar and basic */}
          <div className="col-span-1 flex flex-col items-center md:items-start">
            <div className={`w-24 h-24 rounded-full bg-[#6b46c1] text-white flex items-center justify-center text-2xl font-semibold mb-3`}>
              {(formData.firstName && formData.firstName[0]) || ""}{(formData.lastName && formData.lastName[0]) || ""}
            </div>
            <div className="text-lg font-medium">{formData.firstName} {formData.lastName}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Faculty</div>

            <div className="mt-4 w-full">
              <h4 className={`text-sm font-medium mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Quick Info</h4>
              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}><strong>Department:</strong> {formData.department || '—'}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}><strong>Designation:</strong> {formData.designation || '—'}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}><strong>Office:</strong> {formData.office_location || '—'}</div>
            </div>
          </div>

          {/* Right column: tabs and content */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4 border-b pb-2">
              <button onClick={() => setActiveTab('personal')} className={`px-3 py-1 rounded-md ${activeTab === 'personal' ? 'bg-[#6b46c1] text-white' : theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Personal</button>
              <button onClick={() => setActiveTab('academic')} className={`px-3 py-1 rounded-md ${activeTab === 'academic' ? 'bg-[#6b46c1] text-white' : theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Academic</button>
              <button onClick={() => setActiveTab('contact')} className={`px-3 py-1 rounded-md ${activeTab === 'contact' ? 'bg-[#6b46c1] text-white' : theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Contact</button>
              <button onClick={() => setActiveTab('about')} className={`px-3 py-1 rounded-md ${activeTab === 'about' ? 'bg-[#6b46c1] text-white' : theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>About</button>
            </div>

            <div className={`p-4 rounded-md ${theme === 'dark' ? 'bg-card border border-input' : 'bg-gray-50 border border-gray-200'}`}>
              {renderTabContent()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacultyProfile;