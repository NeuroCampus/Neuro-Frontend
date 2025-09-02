import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { manageAdminProfile } from "../../utils/admin_api";
import { useToast } from "../../hooks/use-toast";
import { Textarea } from "../ui/textarea";


interface AdminProfileProps {
  user: any;
  setError?: (error: string | null) => void;
}

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  address: string;
  bio: string;
}

const AdminProfile = ({ user: propUser, setError }: AdminProfileProps) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    address: "",
    bio: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const [fetchedUser, setFetchedUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log("User prop:", propUser);
      let currentUser = propUser;

      if (!currentUser || !currentUser.user_id) {
        setLoading(true);
        setLocalError(null);
        if (setError) setError(null);
        try {
          const userData = localStorage.getItem("user");
          if (userData) {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.user_id) {
              currentUser = {
                user_id: parsedUser.user_id,
                username: parsedUser.username || parsedUser.first_name || "",
                email: parsedUser.email || "",
                role: parsedUser.role || "admin",
              };
              setFetchedUser(currentUser);
            } else {
              throw new Error("User ID not found in local storage");
            }
          } else {
            throw new Error("No user data found");
          }
        } catch (err) {
          console.error("User Fetch Error:", err);
          const message = "Authentication failed. Please log in again.";
          if (setError) setError(message);
          setLocalError(message);
          toast({ variant: "destructive", title: "Error", description: message });
          setTimeout(() => (window.location.href = "/login"), 2000);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setLocalError(null);
      if (setError) setError(null);
      try {
        const response = await manageAdminProfile({ user_id: currentUser.user_id }, "GET");
        console.log("API Response:", response);
        if (response.success && response.profile) {
          const fetchedProfile = {
            first_name: response.profile.first_name || "",
            last_name: response.profile.last_name || "",
            email: response.profile.email || "",
            mobile_number: response.profile.mobile_number || "",
            address: response.profile.address || "",
            bio: response.profile.bio || "",
          };
          console.log("Fetched Profile Data:", fetchedProfile);
          setProfile(fetchedProfile);
        } else {
          setLocalError(response.message || "Failed to fetch profile");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to fetch profile",
          });
          if (response.message === "Admin profile not found. Please create a profile.") {
            setEditing(true);
            setProfile({
              first_name: currentUser.username.split(" ")[0] || "",
              last_name: currentUser.username.split(" ")[1] || "",
              email: currentUser.email || "",
              mobile_number: "",
              address: "",
              bio: "",
            });
          }
        }
      } catch (err) {
        console.error("Fetch Profile Error:", err);
        const message = "Network error";
        if (setError) setError(message);
        setLocalError(message);
        toast({ variant: "destructive", title: "Error", description: message });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [propUser, setError, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    let errorMessage = "";

    switch (name) {
      case "first_name":
      case "last_name":
        // Only alphabets, 2–50 chars
        if (!/^[A-Za-z\s]{2,50}$/.test(newValue)) {
          errorMessage = "Only letters allowed (2–50 characters)";
        }
        break;

      case "email":
        // Email format validation
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(newValue)) {
          errorMessage = "Invalid email format";
        }
        break;

      case "mobile_number":
        // Digits only, exactly 10 digits
        newValue = newValue.replace(/\D/g, "");
        if (newValue.length !== 10) {
          errorMessage = "Mobile number must be exactly 10 digits";
        }
        break;

      case "address":
        // Only allow letters, numbers, spaces, commas, dots, slashes, hyphens
        newValue = newValue.replace(/[^a-zA-Z0-9\s,./-]/g, "");
        if (newValue.trim().length < 5) {
          errorMessage = "Address must be at least 5 characters";
        } else if (newValue.length > 200) {
          newValue = newValue.slice(0, 200); // hard limit
          errorMessage = "";
        }
        break;

      case "bio":
        // Only allow letters, numbers, spaces, basic punctuation (.,!?)
        newValue = newValue.replace(/[^a-zA-Z0-9\s.,!?]/g, "");
        if (newValue.trim().length < 10) {
          errorMessage = "Bio must be at least 10 characters";
        } else if (newValue.length > 300) {
          newValue = newValue.slice(0, 300); // hard limit
          errorMessage = "";
        }
        break;
      
      default:
      newValue = value;
      break;
    }

    setProfile((prev) => ({ ...prev, [name]: newValue }));
    setLocalErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  
  const handleSaveProfile = async () => {
    setLoading(true);
    setLocalError(null);
    if (setError) setError(null);
    try {
      const currentUser = fetchedUser || propUser;
      if (!currentUser || !currentUser.user_id) {
        setLocalError("User data unavailable for update");
        toast({ variant: "destructive", title: "Error", description: "User data unavailable for update" });
        setLoading(false);
        return;
      }

      if (!profile.first_name.trim()) {
        setLocalError("First name is required");
        toast({ variant: "destructive", title: "Error", description: "First name is required" });
        setLoading(false);
        return;
      }
      if (!profile.email.trim()) {
        setLocalError("Email is required");
        toast({ variant: "destructive", title: "Error", description: "Email is required" });
        setLoading(false);
        return;
      }

      const updates = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        mobile_number: profile.mobile_number,
        address: profile.address,
        bio: profile.bio,
      };
      console.log("Sending updates to backend:", updates);

      const data = { user_id: currentUser.user_id, action: "edit", updates };
      const response = await manageAdminProfile(data, "POST");

      console.log("Save Profile Response:", response);
      if (response.success) {
        toast({ title: "Success", description: "Profile saved successfully" });
        if (response.profile) {
          setProfile({
            first_name: response.profile.first_name || "",
            last_name: response.profile.last_name || "",
            email: response.profile.email || "",
            mobile_number: response.profile.mobile_number || "",
            address: response.profile.address || "",
            bio: response.profile.bio || "",
          });
          // Update localStorage with new profile data
          localStorage.setItem("user", JSON.stringify({
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            ...response.profile,
            user_id: currentUser.user_id,
          }));
        }
        setEditing(false);
      } else {
        const message = response.message || "Failed to save profile";
        if (setError) setError(message);
        setLocalError(message);
        toast({ variant: "destructive", title: "Error", description: message });
      }
    } catch (err) {
      console.error("Save Profile Error:", err);
      const message = err.message || "Network error";
      if (setError) setError(message);
      setLocalError(message);
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black-50 flex justify-center items-start py-12 px-4">
      <Card className="w-full max-w-2xl bg-black-50 border-gray-500 shadow-md">
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6 pb-4">
          <div className="flex w-full justify-between items-center">
            <div>
              <CardTitle className="text-lg text-gray-200">Profile Information</CardTitle>
              <p className="text-sm text-gray-400">View and update your personal information</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
              if (editing) handleSaveProfile();
              else setEditing(true);
              }}
              variant="outline"
              className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500"
              disabled={loading}
            >
              {editing ? (loading ? "Saving..." : "Save") : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2 space-y-8">
          {localError && <div className="text-red-500 text-center">{localError}</div>}

          {/* Profile Avatar + Name */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-semibold">
              {profile.first_name[0]}
              {profile.last_name[0]}
            </div>
            <div className="text-center mt-2">
              <div className="text-lg font-semibold text-gray-200">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="text-sm text-gray-400">Administrator</div>
            </div>
          </div>

          <hr className="border-gray-500" />

          {/* Form Inputs */}
          <div className="space-y-6">
            {/* First Name */}
            <div>
              <Label htmlFor="first_name" className="text-xs text-gray-200 mb-1 block">
                First Name
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                disabled={!editing || loading}
                className="w-full bg-[#232326] text-gray-200"
                placeholder="Enter your first name"
              />
              {localErrors.first_name && (
                <p className="text-red-500 text-xs mt-1">{localErrors.first_name}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="last_name" className="text-xs text-gray-200 mb-1 block">
                Last Name
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                disabled={!editing || loading}
                className="w-full bg-[#232326] text-gray-200"
                placeholder="Enter your last name"
              />
              {localErrors.last_name && (
                <p className="text-red-500 text-xs mt-1">{localErrors.last_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-xs text-gray-200 mb-1 block">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing || loading}
                className="w-full bg-[#232326] text-gray-200"
                placeholder="Enter a valid email"
              />
              {localErrors.email && (
                <p className="text-red-500 text-xs mt-1">{localErrors.email}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <Label htmlFor="mobile_number" className="text-xs text-gray-200 mb-1 block">
                Mobile Number
              </Label>
              <Input
                id="mobile_number"
                name="mobile_number"
                value={profile.mobile_number}
                onChange={handleChange}
                maxLength={10}
                disabled={!editing || loading}
                className="w-full bg-[#232326] text-gray-200"
                placeholder="Enter 10-digit mobile number"
              />
              {localErrors.mobile_number && (
                <p className="text-red-500 text-xs mt-1">{localErrors.mobile_number}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-xs text-gray-200 mb-1 block">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={profile.address}
                onChange={handleChange}
                disabled={!editing || loading}
                className="w-full bg-[#232326] text-gray-200"
                placeholder="Enter your address (5–200 characters)"
              />
              {localErrors.address && (
                <p className="text-red-500 text-xs mt-1">{localErrors.address}</p>
              )}
            </div>

            {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-xs text-gray-200 mb-1 block">
              Bio
            </Label>
            <Textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              disabled={!editing || loading}
              className="w-full bg-[#232326] text-gray-200 resize-none overflow-y-auto thin-scrollbar"
              placeholder="Tell us about yourself (10–300 characters)"
              rows={1} // start small
              style={{
                maxHeight: "200px", // stops growing beyond this
              }}
              onInput={(e) => {
                const target = e.currentTarget;
                target.style.height = "auto"; // reset
                target.style.height = `${Math.min(target.scrollHeight, 200)}px`; // expand
              }}
            />
            {localErrors.bio && (
              <p className="text-red-500 text-xs mt-1">{localErrors.bio}</p>
            )}
          </div>

          </div>
        </CardContent>

      </Card>
    </div>
  );
};

export default AdminProfile;