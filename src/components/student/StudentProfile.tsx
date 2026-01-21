import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getFullStudentProfile } from "@/utils/student_api";
import { useStudentProfileUpdateMutation } from "@/hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";
import { useFileUpload, useFormValidation } from "../../hooks/useOptimizations";
import { Progress } from "../ui/progress";
import { Upload, Camera, CheckCircle, AlertCircle } from "lucide-react";
import { showSuccessAlert, showErrorAlert } from "../../utils/sweetalert";
import { API_ENDPOINT } from "../../utils/config";

const StudentProfile = () => {
  const [form, setForm] = useState({
    user_id: "",
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    about: "",
    profile_picture: "",
    branch: "",
    department: "",
    semester: "",
    current_semester: "",
    year_of_study: "",
    section: "",
    usn: "",
    enrollment_year: "",
    expected_graduation: "",
    student_status: "",
    mode_of_admission: "",
    name: "",
    batch: "",
    course: "",
    date_of_admission: "",
    parent_name: "",
    parent_contact: "",
    emergency_contact: "",
    blood_group: "",
    proctor: {
      id: "",
      username: "",
      first_name: "",
      last_name: "",
      email: ""
    }
  });

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const { theme } = useTheme();
  const updateProfileMutation = useStudentProfileUpdateMutation();

  // Face recognition state
  const [faceImages, setFaceImages] = useState<File[]>([]);
  const [faceTrainingStatus, setFaceTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [faceTrainingProgress, setFaceTrainingProgress] = useState(0);
  const [faceTrainingMessage, setFaceTrainingMessage] = useState('');
  const [hasFaceTrained, setHasFaceTrained] = useState(false);

  // Profile picture upload hook
  const {
    uploadFile: uploadProfilePicture,
    uploadProgress,
    isUploading: isUploadingPicture,
    error: uploadError,
    reset: resetUpload
  } = useFileUpload({
    maxSizeMB: 0.5, // Compress profile pictures to 500KB max
    maxWidthOrHeight: 400,
    compressImages: true,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 2 * 1024 * 1024, // 2MB max
  });

  useEffect(() => {
    // This effect intentionally left empty: profile is fetched in the
    // consolidated effect further down (which also checks face status).
  }, []);

  const handleProfilePictureUpload = async () => {
    if (!profilePictureFile) return;

    try {
      const result = await uploadProfilePicture(
        profilePictureFile,
        `${API_ENDPOINT}/profile/upload-picture`,
        {}
      );

      // Update the profile picture URL in the form
      if (result.success && result.profile_picture_url) {
        // Construct full URL if it's a relative path
        const fullUrl = result.profile_picture_url.startsWith('http') 
          ? result.profile_picture_url 
          : `${API_ENDPOINT.replace('/api', '')}${result.profile_picture_url}`;
        
        setForm(prev => ({ ...prev, profile_picture: fullUrl }));
        
        // Update localStorage user data to reflect the new profile picture
        const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
        currentUserData.profile_picture = fullUrl;
        localStorage.setItem('user', JSON.stringify(currentUserData));
        
        showSuccessAlert("Success", "Profile picture uploaded successfully!");
      } else if (result.success && result.url) {
        // Fallback for different response format
        const fullUrl = result.url.startsWith('http') 
          ? result.url 
          : `${API_ENDPOINT.replace('/api', '')}${result.url}`;
        
        setForm(prev => ({ ...prev, profile_picture: fullUrl }));
        
        // Update localStorage user data to reflect the new profile picture
        const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
        currentUserData.profile_picture = fullUrl;
        localStorage.setItem('user', JSON.stringify(currentUserData));
        
        showSuccessAlert("Success", "Profile picture uploaded successfully!");
      }

      setProfilePictureFile(null);
      resetUpload();
    } catch (error) {
      console.error('Profile picture upload failed:', error);
      showErrorAlert("Error", "Failed to upload profile picture");
    }
  };

  const handleProfilePictureSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        mobile_number: form.phone,
        address: form.address,
        bio: form.about,
      });
      // Show success SweetAlert notification
      showSuccessAlert("Profile Updated", "Your profile has been successfully updated.");
      // The optimistic update will handle the UI updates
    } catch (error) {
      console.error('Failed to update profile:', error);
      showErrorAlert("Error", "Failed to update profile");
    }
  };

  // Check face training status
  const checkFaceStatus = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student/check-face-status/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setHasFaceTrained(data.has_face);
      }
    } catch (error) {
      console.error('Failed to check face status:', error);
    }
  };

  // Handle face image selection
  const handleFaceImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      if (faceImages.length + fileArray.length > 5) {
        showErrorAlert("Error", "Maximum 5 images allowed");
        return;
      }
      setFaceImages(prev => [...prev, ...fileArray]);
    }
  };

  // Remove face image
  const removeFaceImage = (index: number) => {
    setFaceImages(prev => prev.filter((_, i) => i !== index));
  };

  // Train face
  const trainFace = async () => {
    if (faceImages.length < 3) {
      showErrorAlert("Error", "Please upload at least 3 face images");
      return;
    }

    setFaceTrainingStatus('training');
    setFaceTrainingProgress(0);
    setFaceTrainingMessage('Preparing images...');

    try {
      const formData = new FormData();
      faceImages.forEach((image, index) => {
        formData.append('images', image);
      });

      setFaceTrainingProgress(25);
      setFaceTrainingMessage('Uploading images...');

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/student/train-face/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      const data = await response.json();

      setFaceTrainingProgress(75);
      setFaceTrainingMessage('Training face recognition...');

      if (data.success) {
        setFaceTrainingProgress(100);
        setFaceTrainingStatus('success');
        setFaceTrainingMessage('Face training completed successfully!');
        setHasFaceTrained(true);
        setFaceImages([]);
        showSuccessAlert("Success", "Face updated successfully! You can now be recognized for attendance.");
      } else {
        setFaceTrainingStatus('error');
        setFaceTrainingMessage(data.message || 'Face training failed');
        showErrorAlert("Error", data.message || 'Face training failed');
      }
    } catch (error) {
      setFaceTrainingStatus('error');
      setFaceTrainingMessage('Network error occurred');
      showErrorAlert("Error", "Network error occurred");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getFullStudentProfile();
      if (data.success && data.profile) {
        const profileData = data.profile;
        setForm((prev) => {
          const newForm = { ...prev };
          Object.keys(profileData).forEach(key => {
            if (key === 'profile_picture' && profileData[key]) {
              // Convert relative URL to absolute URL
              newForm[key] = profileData[key].startsWith('http') 
                ? profileData[key] 
                : `${API_ENDPOINT.replace('/api', '')}${profileData[key]}`;
            } else if (typeof profileData[key] === 'string' || profileData[key] === null) {
              newForm[key] = profileData[key] || "";
            } else {
              newForm[key] = profileData[key];
            }
          });
          return newForm;
        });
      }
    };
    fetchProfile();
    checkFaceStatus();
  }, []);

  return (
    <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Profile</h2>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="face">Face Recognition</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* Personal Info Card */}
          <Card className={`${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
            <div className="p-6 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/4 flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <img
                    src={form.profile_picture || "/placeholder.svg"}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                  />
                  <label htmlFor="profile-picture-upload" className="absolute bottom-0 right-0 bg-[#a259ff] hover:bg-[#a259ff]/90 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg">
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureSelect}
                    className="hidden"
                  />
                </div>

                {profilePictureFile && (
                  <div className="mb-2 text-center">
                    <p className="text-sm text-gray-600 mb-2">Selected: {profilePictureFile.name}</p>
                    {isUploadingPicture && (
                      <div className="space-y-1">
                        <Progress value={uploadProgress} className="w-full h-2" />
                        <p className="text-xs text-gray-500">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                    {uploadError && (
                      <p className="text-xs text-red-500">{uploadError}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={handleProfilePictureUpload}
                        disabled={isUploadingPicture}
                        className="text-xs"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setProfilePictureFile(null);
                          resetUpload();
                        }}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <p className={`font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                  {form.first_name} {form.last_name ? form.last_name : ''}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>{form.username}</p>
              </div>
              <div className="w-full md:w-3/4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>First Name</Label>
                    <Input
                      name="first_name"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.first_name}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Last Name</Label>
                    <Input
                      name="last_name"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.last_name || ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>USN</Label>
                    <Input
                      name="usn"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.usn}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Email</Label>
                    <Input
                      name="email"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.email}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Phone</Label>
                    <Input
                      name="phone"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.phone}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Department/Branch</Label>
                    <Input
                      name="department"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.branch}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Year of Study</Label>
                    <Input
                      name="year_of_study"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.year_of_study}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Date of Birth</Label>
                    <Input
                      type="date"
                      name="date_of_birth"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.date_of_birth}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Blood Group</Label>
                    <Input
                      name="blood_group"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.blood_group}
                      readOnly
                    />
                  </div>
                </div>

                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Address</Label>
                  <Input
                    name="address"
                    className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                    value={form.address}
                    readOnly
                  />
                </div>

                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>About</Label>
                  <Textarea
                    name="about"
                    className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                    value={form.about}
                    readOnly
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Parent Name</Label>
                    <Input
                      name="parent_name"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.parent_name}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Parent Contact</Label>
                    <Input
                      name="parent_contact"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.parent_contact}
                      readOnly
                    />
                  </div>
                  <div>
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Emergency Contact</Label>
                    <Input
                      name="emergency_contact"
                      className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                      value={form.emergency_contact}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          {/* Academic Info Card */}
          <Card className={`${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Current Semester</Label>
                <Input
                  value={form.current_semester}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="current_semester"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Section</Label>
                <Input
                  value={form.section}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="section"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Enrollment Year</Label>
                <Input
                  value={form.enrollment_year}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="enrollment_year"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Expected Graduation</Label>
                <Input
                  value={form.expected_graduation}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="expected_graduation"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Proctor</Label>
                <Input
                  value={form.proctor?.first_name && form.proctor?.last_name ? 
                        `${form.proctor.first_name} ${form.proctor.last_name}` : 
                        form.proctor?.username || ''}
                  className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                  readOnly
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Student Status</Label>
                <Input
                  value={form.student_status}
                  readOnly
                  name="student_status"
                  className={`${theme === 'dark' ? 'bg-muted text-green-600 font-semibold border-border' : 'bg-gray-100 text-green-600 font-semibold border-gray-300'} cursor-not-allowed`}
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Mode of Admission</Label>
                <Input
                  value={form.mode_of_admission}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="mode_of_admission"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Batch</Label>
                <Input
                  value={form.batch}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="batch"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Course</Label>
                <Input
                  value={form.course}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="course"
                />
              </div>
              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Date of Admission</Label>
                <Input
                  type="date"
                  value={form.date_of_admission}
                  className={`${theme === 'dark' ? 'bg-muted text-muted-foreground border-border' : 'bg-gray-100 text-gray-500 border-gray-300'} cursor-not-allowed`}
                  readOnly
                  name="date_of_admission"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="face">
          {/* Face Recognition Card */}
          <Card className={`${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
            <div className="p-6 space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Face Recognition Training</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload 3-5 clear face photos to train the AI recognition system
                </p>
              </div>

              {hasFaceTrained && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-700 dark:text-green-300">Face recognition is active for your account</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Upload Face Images</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFaceImageSelect}
                      className="hidden"
                      id="face-images"
                    />
                    <label
                      htmlFor="face-images"
                      className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Click to upload face images
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG up to 5MB each
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {faceImages.length > 0 && (
                  <div className="space-y-2">
                    <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Selected Images ({faceImages.length}/5)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {faceImages.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Face ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeFaceImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {faceTrainingStatus !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {faceTrainingStatus === 'training' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>}
                      {faceTrainingStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {faceTrainingStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      <span className="text-sm">{faceTrainingMessage}</span>
                    </div>
                    {faceTrainingStatus === 'training' && (
                      <Progress value={faceTrainingProgress} className="w-full h-2" />
                    )}
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    onClick={trainFace}
                    disabled={faceImages.length < 3 || faceTrainingStatus === 'training'}
                    className="bg-[#a259ff] hover:bg-[#a259ff]/90 text-white"
                  >
                    {faceTrainingStatus === 'training' ? 'Training...' : 'Train Face AI'}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• Upload clear, well-lit photos of your face</p>
                <p>• Ensure your face is fully visible and centered</p>
                <p>• Remove glasses or accessories that might obstruct recognition</p>
                <p>• Face training is optional but enables faster attendance marking</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <div className="flex justify-end">
          <Button 
            className={`mt-4 ${theme === 'dark' ? 'text-foreground bg-muted hover:bg-accent border-border' : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'}`}
            onClick={handleSave}
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

export default StudentProfile;