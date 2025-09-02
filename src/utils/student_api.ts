import { API_BASE_URL } from "./config";
import { fetchWithTokenRefresh } from "./authService";

// Type definitions for request and response data
interface DashboardOverviewResponse {
  success: boolean;
  message?: string;
  data?: {
    total_attendance: number;
    total_leaves: number;
    recent_announcements: Array<{ id: number; title: string; content: string }>;
  };
}

interface TimetableEntry {
  id: string;
  faculty: { id: string; first_name: string; last_name: string };
  subject: { id: string; name: string };
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}

interface GetTimetableResponse {
  success: boolean;
  message?: string;
  timetable?: TimetableEntry[];
}

interface AttendanceRecord {
  id: string;
  subject: { id: string; name: string };
  date: string;
  status: string;
}

interface SubjectAttendance {
  records: { date: string; status: "Present" | "Absent" }[];
  present: number;
  total: number;
  percentage: number;
}

interface AttendanceData {
  [subject: string]: SubjectAttendance;
}

interface GetStudentAttendanceResponse {
  success: boolean;
  message?: string;
  data?: AttendanceData;
}

interface Mark {
  id: string;
  subject: { id: string; name: string };
  test_number: number;
  mark: number;
  max_mark: number;
}

interface InternalMark {
  subject: string;
  subject_code: string;
  test_number: number;
  mark: number;
  max_mark: number;
  percentage: number;
  faculty: string;
  recorded_at: string;
}

interface GetInternalMarksResponse {
  success: boolean;
  message?: string;
  data?: InternalMark[];
}

interface SubmitLeaveRequestRequest {
  start_date: string;
  end_date: string;
  reason: string;
}

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface SubmitLeaveRequestResponse {
  success: boolean;
  message?: string;
  leave_request?: LeaveRequest;
}

interface GetLeaveRequestsResponse {
  success: boolean;
  message?: string;
  leave_requests?: LeaveRequest[];
}

interface UploadCertificateRequest {
  file: File;
  description: string;
}

interface Certificate {
  id: string;
  file_url: string;
  description: string;
  uploaded_at: string;
}

interface UploadCertificateResponse {
  success: boolean;
  message?: string;
  certificate?: Certificate;
}

interface GetCertificatesResponse {
  success: boolean;
  message?: string;
  certificates?: Certificate[];
}

interface DeleteCertificateRequest {
  certificate_id: string;
}

interface DeleteCertificateResponse {
  success: boolean;
  message?: string;
}

interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  address?: string;
  bio?: string;
}

interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    address: string;
    bio: string;
  };
}

interface Announcement {
  id?: number;
  title: string;
  content: string;
  created_at: string;
}

interface GetAnnouncementsResponse {
  success: boolean;
  message?: string;
  data?: Announcement[];
}

interface ChatMessage {
  id: string;
  channel: { id: string; name: string };
  sender: { id: string; first_name: string; last_name: string };
  content: string;
  sent_at: string;
}

interface ManageChatResponse {
  success: boolean;
  message?: string;
  messages?: ChatMessage[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
  created_at: string;
}

interface GetNotificationsResponse {
  success: boolean;
  message?: string;
  notifications?: Notification[];
}

interface UploadFaceEncodingsRequest {
  encodings: string;
}

interface UploadFaceEncodingsResponse {
  success: boolean;
  message?: string;
}

// Student-specific API functions
export const getDashboardOverview = async (): Promise<DashboardOverviewResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/dashboard/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Dashboard Overview Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getTimetable = async (): Promise<GetTimetableResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/timetable/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Timetable Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getStudentAttendance = async (): Promise<GetStudentAttendanceResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/attendance/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Get Student Attendance Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Network error";
    return { success: false, message: errorMessage };
  }
};

export const getInternalMarks = async (): Promise<GetInternalMarksResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/internal-marks/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Internal Marks Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const submitLeaveRequest = async (
  data: SubmitLeaveRequestRequest
): Promise<SubmitLeaveRequestResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/submit-leave-request/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Submit Leave Request Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getLeaveRequests = async (): Promise<GetLeaveRequestsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/leave-requests/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Leave Requests Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const uploadCertificate = async (
  data: UploadCertificateRequest
): Promise<UploadCertificateResponse> => {
  try {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("description", data.description);
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/upload-certificate/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Upload Certificate Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getCertificates = async (): Promise<GetCertificatesResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/certificates/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Certificates Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const deleteCertificate = async (
  data: DeleteCertificateRequest
): Promise<DeleteCertificateResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/delete-certificate/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Delete Certificate Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const updateProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/update-profile/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getAnnouncements = async (): Promise<GetAnnouncementsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/announcements/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Announcements Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const manageChat = async (
  data: any,
  method: "GET" | "POST" = "GET"
): Promise<ManageChatResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/chat/`, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(data) : undefined,
    });
    return await response.json();
  } catch (error) {
    console.error("Manage Chat Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getNotifications = async (): Promise<GetNotificationsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/notifications/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const uploadFaceEncodings = async (
  data: UploadFaceEncodingsRequest
): Promise<UploadFaceEncodingsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/upload-face-encodings/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Upload Face Encodings Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFullStudentProfile = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/full-profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Full Student Profile Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getStudentAssignments = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/assignments/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Student Assignments Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getStudentStudyMaterials = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/student/study-materials/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Student Study Materials Error:", error);
    return { success: false, message: "Network error" };
  }
};