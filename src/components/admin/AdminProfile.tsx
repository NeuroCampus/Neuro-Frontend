import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";
import { manageAdminProfile } from "../../utils/admin_api";
import { Textarea } from "../ui/textarea";
import { useTheme } from "../../context/ThemeContext";
import { showSuccessAlert, showErrorAlert } from "../../utils/sweetalert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { fetchWithTokenRefresh } from "../../utils/authService";
import { API_ENDPOINT } from "../../utils/config";

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
  const [fetchedUser, setFetchedUser] = useState<any>(null);
  const { theme } = useTheme();

  // Change password states
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [showPasswords, setShowPasswords] = useState({ current: false, next: false, confirm: false });
  const passwordDialogContentRef = useRef<HTMLDivElement | null>(null);

  // Tabs: details (Personal + Contact) and other (Address + Bio)
  const [activeTab, setActiveTab] = useState<'details' | 'other'>('details');

  useEffect(() => {
    const fetchProfile = async () => {
      let currentUser = propUser;
      if (!currentUser || !currentUser.user_id) {
        try {
          const userData = localStorage.getItem('user');
          if (userData) {
            const parsed = JSON.parse(userData);
            if (parsed.user_id) {
              currentUser = { user_id: parsed.user_id, username: parsed.username || parsed.first_name || '', email: parsed.email || '', role: parsed.role || 'admin' };
              setFetchedUser(currentUser);
            }
          }
        } catch (e) {
          console.error('User load error', e);
        }
      }

      if (!currentUser || !currentUser.user_id) {
        setLocalError('No user');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLocalError(null);
      if (setError) setError(null);

      try {
        const response = await manageAdminProfile({ user_id: currentUser.user_id }, 'GET');
        if (response.success && response.profile) {
          setProfile({
            first_name: response.profile.first_name || '',
            last_name: response.profile.last_name || '',
            email: response.profile.email || '',
            mobile_number: response.profile.mobile_number || '',
            address: response.profile.address || '',
            bio: response.profile.bio || '',
          });
        } else {
          setLocalError(response.message || 'Failed to fetch profile');
          showErrorAlert('Error', response.message || 'Failed to fetch profile');
          if (response.message === 'Admin profile not found. Please create a profile.') {
            setEditing(true);
            setProfile({
              first_name: (currentUser.username || '').split(' ')[0] || '',
              last_name: (currentUser.username || '').split(' ')[1] || '',
              email: currentUser.email || '',
              mobile_number: '',
              address: '',
              bio: '',
            });
          }
        }
      } catch (err) {
        console.error('Fetch Profile Error:', err);
        setLocalError('Network error');
        showErrorAlert('Error', 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [propUser, setError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    let newValue = value;
    let errorMessage = '';

    if (name === 'first_name' || name === 'last_name') {
      if (newValue.length > 50) errorMessage = 'Max 50 characters';
    }
    if (name === 'email') {
      if (newValue && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newValue)) errorMessage = 'Invalid email';
    }
    if (name === 'mobile_number') {
      newValue = newValue.replace(/[^0-9]/g, '').slice(0, 10);
      if (newValue && newValue.length !== 10) errorMessage = 'Enter 10 digits';
    }
    if (name === 'bio' || name === 'address') {
      if (newValue.length > 300) errorMessage = 'Too long';
    }

    setProfile((p) => ({ ...p, [name]: newValue }));
    setLocalErrors((errs) => ({ ...errs, [name]: errorMessage }));
  };

  const validateProfile = () => {
    const errs: Record<string, string> = {};
    if (!profile.first_name || profile.first_name.trim().length < 1) errs.first_name = 'First name required';
    if (!profile.last_name || profile.last_name.trim().length < 1) errs.last_name = 'Last name required';
    if (profile.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email)) errs.email = 'Invalid email';
    if (profile.mobile_number && profile.mobile_number.length !== 10) errs.mobile_number = 'Enter 10 digits';
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setLoading(true);
    setLocalError(null);
    if (setError) setError(null);

    try {
      const currentUser = fetchedUser || propUser;
      if (!currentUser || !currentUser.user_id) {
        setLocalError('User data unavailable for update');
        showErrorAlert('Error', 'User data unavailable for update');
        setLoading(false);
        return;
      }

      const updates = { ...profile };
      const data = { user_id: currentUser.user_id, action: 'edit', updates };
      const response = await manageAdminProfile(data, 'POST');

      if (response.success) {
        showSuccessAlert('Success', 'Profile saved successfully');
        if (response.profile) {
          setProfile({
            first_name: response.profile.first_name || '',
            last_name: response.profile.last_name || '',
            email: response.profile.email || '',
            mobile_number: response.profile.mobile_number || '',
            address: response.profile.address || '',
            bio: response.profile.bio || '',
          });
          localStorage.setItem('user', JSON.stringify({
            ...JSON.parse(localStorage.getItem('user') || '{}'),
            ...response.profile,
            user_id: currentUser.user_id,
          }));
        }
        setEditing(false);
      } else {
        const message = response.message || 'Failed to save profile';
        if (setError) setError(message);
        setLocalError(message);
        showErrorAlert('Error', message);
      }
    } catch (err: any) {
      console.error('Save Profile Error:', err);
      const message = err?.message || 'Network error';
      if (setError) setError(message);
      setLocalError(message);
      showErrorAlert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      showErrorAlert('Missing fields', 'Please fill in current, new and confirm password fields.');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      showErrorAlert('Password mismatch', "New passwords don't match");
      return;
    }
    if (passwordData.current_password === passwordData.new_password) {
      showErrorAlert('Invalid new password', 'Current password and new password cannot be the same.');
      return;
    }

    try {
      const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/profile/change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
          confirm_password: passwordData.confirm_password,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setShowPasswordDialog(false);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        showSuccessAlert('Password changed', 'Your password has been updated successfully.');
      } else {
        showErrorAlert('Unable to change password', result.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showErrorAlert('Unable to change password', 'Failed to change password');
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'details') {
      return (
        <div className="space-y-6">
          {/* Personal */}
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              <div className="w-full">
                <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>First Name</label>
                <Input value={profile.first_name} name="first_name" onChange={handleChange} disabled={!editing} placeholder="First name" className="text-xs sm:text-sm h-8 sm:h-9 md:h-10 w-full disabled:opacity-80 disabled:placeholder-opacity-80" />
                {localErrors.first_name && <p className={`text-xs mt-1 sm:mt-1.5 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.first_name}</p>}
              </div>
              <div className="w-full">
                <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Last Name</label>
                <Input value={profile.last_name} name="last_name" onChange={handleChange} disabled={!editing} placeholder="Last name" className="text-xs sm:text-sm h-8 sm:h-9 md:h-10 w-full disabled:opacity-80 disabled:placeholder-opacity-80" />
                {localErrors.last_name && <p className={`text-xs mt-1 sm:mt-1.5 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.last_name}</p>}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Email</label>
              <Input value={profile.email} name="email" onChange={handleChange} disabled={!editing} placeholder="Email address" className="text-xs sm:text-sm h-8 sm:h-10 w-full disabled:opacity-80 disabled:placeholder-opacity-80" />
              {localErrors.email && <p className={`text-xs mt-1 sm:mt-1.5 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.email}</p>}
            </div>

            <div>
              <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Mobile</label>
              <Input value={profile.mobile_number} name="mobile_number" onChange={handleChange} disabled={!editing} maxLength={10} placeholder="10-digit mobile" className="text-xs sm:text-sm h-8 sm:h-10 w-full disabled:opacity-80 disabled:placeholder-opacity-80" />
              {localErrors.mobile_number && <p className={`text-xs mt-1 sm:mt-1.5 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.mobile_number}</p>}
            </div>
          </div>
        </div>
      );
    }

    // other tab: Address + Bio
    return (
      <div className="space-y-6">
        <div>
          <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Address</label>
          <Textarea value={profile.address} name="address" onChange={handleChange} disabled={!editing} placeholder="Address" rows={3} className="text-xs sm:text-sm w-full disabled:opacity-80 disabled:placeholder-opacity-80" />
          {localErrors.address && <p className={`text-xs mt-1 sm:mt-1.5 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.address}</p>}
        </div>

        <div>
          <label className={`block text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Bio</label>
          <Textarea value={profile.bio} name="bio" onChange={handleChange} disabled={!editing} placeholder="Tell us about yourself" rows={4} className="text-xs sm:text-sm w-full disabled:opacity-80 disabled:placeholder-opacity-80" />
          {localErrors.bio && <p className={`text-xs mt-1 sm:mt-1.5 ${theme === 'dark' ? 'text-destructive' : 'text-red-500'}`}>{localErrors.bio}</p>}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className={`text-center py-6 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading...</div>;
  }

  return (
    <div className={`min-h-screen flex justify-center items-start ${theme === 'dark' ? 'bg-background' : 'bg-gray-50'}`}>
      <Card className={`w-full max-w-none mx-auto my-2 sm:my-4 md:my-6  px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 ${theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}`}>
        <CardHeader className="px-2 sm:px-3 md:px-4 lg:px-6 py-3 sm:py-4 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b">
          <div className="flex-1 min-w-0">
            <CardTitle className={`text-lg ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Profile Information</CardTitle>
            <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>View and update your personal information</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-auto">
            {editing && (
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); /* revert could be implemented if desired */ }}>
                Cancel
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => { if (editing) handleSaveProfile(); else setEditing(true); }}
              variant="outline"
              className="text-white bg-[#a259ff] border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white"
              disabled={loading}
            >
              {editing ? (loading ? 'Saving...' : 'Save') : 'Edit Profile'}
            </Button>

            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 h-9 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde]">Change Password</Button>
              </DialogTrigger>
              <DialogContent ref={passwordDialogContentRef} className="w-[calc(100vw-1.5rem)] sm:w-full max-w-[420px] rounded-xl sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, current: !prev.current }))}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPasswords.current ? 'Hide current password' : 'Show current password'}
                      >
                        {showPasswords.current ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPasswords.next ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, next: !prev.next }))}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPasswords.next ? 'Hide new password' : 'Show new password'}
                      >
                        {showPasswords.next ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                        aria-label={showPasswords.confirm ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showPasswords.confirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
                    <Button className="font-medium bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde]" onClick={handleChangePassword}>Change Password</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6 pt-2 space-y-8">
          {localError && <div className="text-red-500 text-center">{localError}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8 items-start">
            <div className="col-span-1 flex flex-col items-center">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#a259ff] text-white flex items-center justify-center text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 mt-4 flex-shrink-0`}>
                {(profile.first_name && profile.first_name[0]) || ''}{(profile.last_name && profile.last_name[0]) || ''}
              </div>

              <div className="text-base sm:text-lg font-semibold text-center mb-1">{profile.first_name} {profile.last_name}</div>
              <div className={`text-xs sm:text-sm mb-4 sm:mb-2 text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Administrator</div>

              <div className="w-full mt-4 sm:mt-6 flex flex-col">
                <h4 className={`text-xs sm:text-sm font-bold mb-2.5 sm:mb-4 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Quick Info</h4>
                <div className={`border rounded-lg p-2.5 sm:p-4 ${theme === 'dark' ? 'bg-card border-input' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5">
                    <div className="flex flex-col justify-start">
                      <span className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Email</span>
                      <span className={`text-xs sm:text-sm break-words px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl line-clamp-2 ${theme === 'dark' ? 'bg-accent text-foreground' : 'bg-purple-100 text-purple-700'}`}>{profile.email || '—'}</span>
                    </div>
                    <div className="flex flex-col justify-start">
                      <span className={`text-xs font-semibold mb-1 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Mobile</span>
                      <span className={`text-xs sm:text-sm break-words px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl line-clamp-2 ${theme === 'dark' ? 'bg-accent text-foreground' : 'bg-purple-100 text-purple-700'}`}>{profile.mobile_number || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-3 w-full flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3 sm:mb-4 md:mb-5 lg:mb-6 border-b pb-2 sm:pb-3">
                <button onClick={() => setActiveTab('details')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors font-medium ${activeTab === 'details' ? 'bg-[#a259ff] text-white' : theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-600 hover:text-gray-900'}`}>Details</button>
                <button onClick={() => setActiveTab('other')} className={`px-3 py-1.5 text-xs sm:text-sm rounded-md transition-colors font-medium ${activeTab === 'other' ? 'bg-[#a259ff] text-white' : theme === 'dark' ? 'text-muted-foreground hover:text-foreground' : 'text-gray-600 hover:text-gray-900'}`}>Other</button>
              </div>

              <div className={`p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg border flex-1 ${theme === 'dark' ? 'bg-card border-input' : 'bg-gray-50 border-gray-200'}`}>
                {renderTabContent()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
