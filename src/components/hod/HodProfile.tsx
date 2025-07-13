import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { manageProfile } from "../../utils/hod_api";
import { useToast } from "../../hooks/use-toast";

const HodProfile = ({ user: propUser, setError }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    address: "",
    bio: "",
  });
  const [error, setLocalError] = useState(null);
  const { toast } = useToast();
  const [fetchedUser, setFetchedUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
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
                role: parsedUser.role || "hod",
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
        const response = await manageProfile({}, "GET");
        if (response.success && response.data) {
          const fetchedProfile = {
            first_name: response.data.first_name || "",
            last_name: response.data.last_name || "",
            email: response.data.email || "",
            mobile_number: response.data.mobile_number || "",
            address: response.data.address || "",
            bio: response.data.bio || "",
          };
          setProfile(fetchedProfile);
        } else {
          setLocalError(response.message || "Failed to fetch profile");
          toast({
            variant: "destructive",
            title: "Error",
            description: response.message || "Failed to fetch profile",
          });
          if (response.message === "Profile not found") {
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

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
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
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profile.email)) {
        setLocalError("Invalid email format");
        toast({ variant: "destructive", title: "Error", description: "Invalid email format" });
        setLoading(false);
        return;
      }

      const updates = {};
      if (profile.first_name !== (currentUser.first_name || "")) updates.first_name = profile.first_name;
      if (profile.last_name !== (currentUser.last_name || "")) updates.last_name = profile.last_name;
      if (profile.email !== (currentUser.email || "")) updates.email = profile.email;
      if (profile.mobile_number !== (currentUser.mobile_number || "")) updates.mobile_number = profile.mobile_number;
      if (profile.address !== (currentUser.address || "")) updates.address = profile.address;
      if (profile.bio !== (currentUser.bio || "")) updates.bio = profile.bio;

      if (Object.keys(updates).length === 0) {
        toast({ title: "Info", description: "No changes to save" });
        setEditing(false);
        setLoading(false);
        return;
      }

      const response = await manageProfile(updates, "PATCH");
      if (response.success && response.data) {
        setProfile({
          first_name: response.data.first_name || "",
          last_name: response.data.last_name || "",
          email: response.data.email || "",
          mobile_number: response.data.mobile_number || "",
          address: response.data.address || "",
          bio: response.data.bio || "",
        });
        toast({ title: "Success", description: "Profile saved successfully" });
        localStorage.setItem("user", JSON.stringify({
          ...JSON.parse(localStorage.getItem("user") || "{}"),
          ...response.data,
          user_id: currentUser.user_id,
        }));
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
    <div className="min-h-screen bg-gray-50 flex justify-center items-start py-12 px-4">
      <Card className="w-full max-w-2xl border border-gray-200 shadow-md">
        <CardHeader className="flex flex-col items-start gap-2 px-6 pt-6 pb-4">
          <div className="flex w-full justify-between items-center">
            <div>
              <CardTitle className="text-lg text-gray-900">Profile Information</CardTitle>
              <p className="text-sm text-gray-500">View and update your personal information</p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (editing) handleSaveProfile();
                else setEditing(true);
              }}
              variant="outline"
              className="text-blue-600 border-blue-500 hover:bg-blue-50"
              disabled={loading}
            >
              {editing ? (loading ? "Saving..." : "Save") : "Edit Profile"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2 space-y-8">
          {error && <div className="text-red-500 text-center">{error}</div>}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-2xl font-semibold">
              {profile.first_name[0] || ""}
              {profile.last_name[0] || ""}
            </div>
            <div className="text-center mt-2">
              <div className="text-lg font-semibold text-gray-900">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="text-sm text-gray-500">Head of Department</div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div className="space-y-6">
            <div>
              <Label htmlFor="first_name" className="text-xs text-gray-500 mb-1 block">
                First Name
              </Label>
              <Input
                id="first_name"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                disabled={!editing || loading}
                className={cn("w-full", !editing && "bg-gray-100")}
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-xs text-gray-500 mb-1 block">
                Last Name
              </Label>
              <Input
                id="last_name"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                disabled={!editing || loading}
                className={cn("w-full", !editing && "bg-gray-100")}
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-xs text-gray-500 mb-1 block">
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editing || loading}
                className={cn("w-full", !editing && "bg-gray-100")}
              />
            </div>
            <div>
              <Label htmlFor="mobile_number" className="text-xs text-gray-500 mb-1 block">
                Mobile Number
              </Label>
              <Input
                id="mobile_number"
                name="mobile_number"
                value={profile.mobile_number}
                onChange={handleChange}
                disabled={!editing || loading}
                className={cn("w-full", !editing && "bg-gray-100")}
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-xs text-gray-500 mb-1 block">
                Address
              </Label>
              <Input
                id="address"
                name="address"
                value={profile.address}
                onChange={handleChange}
                disabled={!editing || loading}
                className={cn("w-full", !editing && "bg-gray-100")}
              />
            </div>
            <div>
              <Label htmlFor="bio" className="text-xs text-gray-500 mb-1 block">
                Bio
              </Label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                disabled={!editing || loading}
                className={cn("w-full p-2 border rounded-md", !editing && "bg-gray-100")}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HodProfile;