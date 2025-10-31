import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { getFullStudentProfile } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";

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
    proctor: {
      id: "",
      username: "",
      first_name: "",
      last_name: "",
      email: ""
    }
  });
  
  const { theme } = useTheme();

  useEffect(() => {
    const fetchProfile = async () => {
      const data = await getFullStudentProfile();
      if (data.success && data.profile) {
        setForm((prev) => {
          const newForm = { ...prev };
          Object.keys(data.profile).forEach(key => {
            if (typeof data.profile[key] === 'string' || data.profile[key] === null) {
              newForm[key] = data.profile[key] || "";
            } else {
              newForm[key] = data.profile[key];
            }
          });
          return newForm;
        });
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  return (
    <div className={`p-6 space-y-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Profile</h2>

      <Tabs defaultValue="profile" className="space-y-6">
        {/* Personal Info Card */}
        <Card className={`${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
          <div className="p-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/4 flex flex-col items-center text-center">
              <img
                src={form.profile_picture || "/default-avatar.png"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
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
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Last Name</Label>
                  <Input
                    name="last_name"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.last_name || ''}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>USN</Label>
                  <Input
                    name="usn"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.usn}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Email</Label>
                  <Input
                    name="email"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Phone</Label>
                  <Input
                    name="phone"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Department/Branch</Label>
                  <Input
                    name="department"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.branch}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Year of Study</Label>
                  <Input
                    name="year_of_study"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.year_of_study}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Date of Birth</Label>
                  <Input
                    type="date"
                    name="date_of_birth"
                    className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                    value={form.date_of_birth}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Address</Label>
                <Input
                  name="address"
                  className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                  value={form.address}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>About</Label>
                <Textarea
                  name="about"
                  className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                  value={form.about}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Academic Info Card */}
        <Card className={`${theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Current Semester</Label>
              <Input
                value={form.current_semester}
                className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                onChange={handleChange}
                name="current_semester"
              />
            </div>
            <div>
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Section</Label>
              <Input
                value={form.section}
                className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                onChange={handleChange}
                name="section"
              />
            </div>
            <div>
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Enrollment Year</Label>
              <Input
                value={form.enrollment_year}
                className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                onChange={handleChange}
                name="enrollment_year"
              />
            </div>
            <div>
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Expected Graduation</Label>
              <Input
                value={form.expected_graduation}
                className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                onChange={handleChange}
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
                onChange={handleChange}
                name="student_status"
                className={theme === 'dark' ? 'bg-background text-green-600 font-semibold border-border' : 'bg-white text-green-600 font-semibold border-gray-300'}
              />
            </div>
            <div>
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-700'}>Mode of Admission</Label>
              <Input
                value={form.mode_of_admission}
                className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}
                onChange={handleChange}
                name="mode_of_admission"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button className={`mt-4 ${theme === 'dark' ? 'text-foreground bg-muted hover:bg-accent border-border' : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'}`}>
            Save Changes
          </Button>
        </div>
      </Tabs>
    </div>
  );
};

export default StudentProfile;