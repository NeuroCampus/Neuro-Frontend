import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";
import { useTheme } from "../../context/ThemeContext";

interface COEProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  address?: string;
  date_joined: string;
  last_login?: string;
  is_active: boolean;
  role: string;
  profile_image?: string;
  department?: string;
  designation: string;
}

const COEProfile = () => {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<COEProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/profile/`, {
        method: 'GET',
      });
      const result = await response.json();
      if (result.success) {
        setProfile(result.data);
        setFormData({
          first_name: result.data.first_name || "",
          last_name: result.data.last_name || "",
          email: result.data.email || "",
          phone_number: result.data.phone_number || "",
          address: result.data.address || "",
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/profile/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        setEditing(false);
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("New passwords don't match");
      return;
    }

    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/profile/change-password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowPasswordDialog(false);
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        alert("Password changed successfully");
      } else {
        alert(result.message || "Failed to change password");
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-300 rounded mb-4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Badge variant="outline" className="text-sm">
          Controller of Examinations
        </Badge>
      </div>

      {/* Profile Header */}
      <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profile_image} alt={profile.first_name} />
              <AvatarFallback className="text-2xl">
                {profile.first_name?.[0]}{profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-muted-foreground">{profile.designation}</p>
              <p className="text-sm text-muted-foreground">{profile.department}</p>
              <div className="flex items-center mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {profile.role}
                </Badge>
                <span className="ml-2 text-sm text-muted-foreground">
                  Active since {new Date(profile.date_joined).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setEditing(!editing)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current_password">Current Password</Label>
                      <Input
                        id="current_password"
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleChangePassword}>
                        Change Password
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                {editing ? (
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{profile.first_name}</p>
                )}
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                {editing ? (
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{profile.last_name}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              {editing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              ) : (
                <div className="flex items-center mt-1">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              {editing ? (
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                />
              ) : (
                <div className="flex items-center mt-1">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {profile.phone_number || 'Not provided'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              {editing ? (
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={3}
                />
              ) : (
                <div className="flex items-start mt-1">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {profile.address || 'Not provided'}
                  </p>
                </div>
              )}
            </div>

            {editing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleUpdateProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Username</Label>
              <div className="flex items-center mt-1">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{profile.username}</p>
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <div className="mt-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {profile.role}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Account Status</Label>
              <div className="mt-1">
                <Badge variant={profile.is_active ? "secondary" : "destructive"}
                       className={profile.is_active ? "bg-green-100 text-green-800" : ""}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            <div>
              <Label>Member Since</Label>
              <div className="flex items-center mt-1">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {new Date(profile.date_joined).toLocaleDateString()}
                </p>
              </div>
            </div>

            {profile.last_login && (
              <div>
                <Label>Last Login</Label>
                <div className="flex items-center mt-1">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {new Date(profile.last_login).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default COEProfile;