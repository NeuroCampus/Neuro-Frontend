import { API_BASE_URL } from "./config";
import { fetchWithTokenRefresh } from "./authService";

// Type definitions for request and response data
interface DashboardOverviewResponse {
  success: boolean;
  message?: string;
  data?: {
    today_classes: Array<{
      subject: string;
      section: string;
      start_time: string;
      end_time: string;
      room: string;
    }>;
    attendance_snapshot: number;
    quick_actions: string[];
  };
}

export interface TakeAttendanceRequest {
  branch_id: string;
  subject_id: string;
  section_id: string;
  semester_id: string;
  method: "manual" | "ai";
  class_images?: File[];
  attendance?: Array<{ student_id: string; status: boolean }>;
}

interface TakeAttendanceResponse {
  success: boolean;
  message?: string;
}

export interface UploadMarksRequest {
  branch_id: string;
  semester_id: string;
  section_id: string;
  subject_id: string;
  test_number: number;
  marks?: Array<{ student_id: string; mark: number }>;
  file?: File;
}

interface UploadMarksResponse {
  success: boolean;
  message?: string;
}

export interface ApplyLeaveRequest {
  branch_ids: number[];
  start_date: string;
  end_date: string;
  reason: string;
}

interface ApplyLeaveResponse {
  success: boolean;
  message?: string;
  data?: Array<{ id: string; branch: string }>;
}

interface ViewAttendanceRecordsResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    student: string;
    usn: string;
    total_sessions: number;
    present: number;
    percentage: number;
  }>;
}

export interface CreateAnnouncementRequest {
  branch_id: string;
  semester_id: string;
  section_id: string;
  title: string;
  content: string;
  target?: "student" | "faculty" | "both";
  student_usns?: string[];
}

interface CreateAnnouncementResponse {
  success: boolean;
  message?: string;
}

// Update the ProctorStudent interface to match the new backend response
export interface ProctorStudent {
  name: string;
  usn: string;
  branch: string | null;
  branch_id: number | null;
  semester: number | null;
  semester_id: number | null;
  section: string | null;
  section_id: number | null;
  attendance: number | string;
  marks: Array<{
    subject: string;
    subject_code: string | null;
    test_number: number;
    mark: number;
    max_mark: number;
  }>;
  certificates: Array<{
    title: string;
    file: string | null;
    uploaded_at: string;
  }>;
  latest_leave_request: {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
    status: string;
  } | null;
  user_info: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    mobile_number: string | null;
    address: string | null;
    bio: string | null;
  } | null;
  face_encodings: unknown;
  proctor: {
    id: number | null;
    name: string | null;
    email: string | null;
  } | null;
  leave_requests?: LeaveRow[];
}

export interface GetProctorStudentsResponse {
  success: boolean;
  message?: string;
  data?: ProctorStudent[];
  pagination?: {
    page: number;
    page_size: number;
    total_students: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface TimetableEntry {
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  section: string;
  semester: number;
  branch: string;
  faculty_name: string;
  room: string;
}

export interface FacultyAssignment {
  subject_name: string;
  subject_code: string;
  subject_id: number;
  section: string;
  section_id: number;
  semester: number;
  semester_id: number;
  branch: string;
  branch_id: number;
  has_timetable: boolean;
}

interface GetFacultyAssignmentsResponse {
  success: boolean;
  message?: string;
  data?: FacultyAssignment[];
}

interface GetFacultyDashboardBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    assignments: FacultyAssignment[];
    proctor_students: ProctorStudent[];
  };
}

interface AttendanceRecordSummary {
  id: number;
  date: string;
  subject: string | null;
  section: string | null;
  semester: number | null;
  branch: string | null;
  file_path: string | null;
  status: string;
  branch_id: number | null;
  section_id: number | null;
  subject_id: number | null;
  semester_id: number | null;
  summary: {
    present_count: number;
    absent_count: number;
    total_count: number;
    present_percentage: number;
  };
}

interface GetAttendanceRecordsWithSummaryResponse {
  success: boolean;
  message?: string;
  data?: AttendanceRecordSummary[];
  pagination?: {
    page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

interface GetApplyLeaveBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    assignments: FacultyAssignment[];
    leave_requests: FacultyLeaveRequest[];
    branches: { id: number; name: string }[];
  };
}

interface GetTimetableResponse {
  success: boolean;
  message?: string;
  data?: TimetableEntry[];
}

interface ChatChannel {
  id: string;
  type: string;
  subject: string | null;
  section: string | null;
  participants: string[];
}

interface ManageChatResponse {
  success: boolean;
  message?: string;
  data?: ChatChannel[];
}

interface SendChatMessageRequest {
  channel_id?: string;
  message: string;
  type?: "subject" | "proctor" | "faculty";
  branch_id?: string;
  semester_id?: string;
  subject_id?: string;
  section_id?: string;
}

export interface ManageProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  bio?: string;
  profile_picture?: File;
}

interface ManageProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    mobile: string;
    address: string;
    bio: string;
    profile_picture: string | null;
  };
}

export interface ScheduleMentoringRequest {
  student_id: string;
  date: string;
  purpose: string;
}

interface ScheduleMentoringResponse {
  success: boolean;
  message?: string;
}

interface GenerateStatisticsResponse {
  success: boolean;
  message?: string;
  data?: {
    pdf_url: string;
    stats: Array<{ student__name: string; percentage: number }>;
  };
}

interface DownloadPDFResponse {
  success: boolean;
  message?: string;
  file_url?: string;
}

export interface ClassStudent {
  id: number;
  name: string;
  usn: string;
}

export interface InternalMarkStudent {
  id: number;
  name: string;
  usn: string;
  mark: number | '';
  max_mark: number;
}

export interface FacultyLeaveRequest {
  id: string;
  branch: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  applied_on: string;
  reviewed_by?: string | null;
}



// Faculty-specific API functions
export const getDashboardOverview = async (): Promise<DashboardOverviewResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/dashboard/`, {
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

export const takeAttendance = async (
  data: TakeAttendanceRequest
): Promise<TakeAttendanceResponse> => {
  try {
    const formData = new FormData();
    formData.append("branch_id", data.branch_id);
    formData.append("subject_id", data.subject_id);
    formData.append("section_id", data.section_id);
    formData.append("semester_id", data.semester_id);
    formData.append("method", data.method);
    if (data.method === "ai" && data.class_images) {
      data.class_images.forEach((file, index) => {
        formData.append(`class_images[${index}]`, file);
      });
    }
    if (data.method === "manual" && data.attendance) {
      formData.append("attendance", JSON.stringify(data.attendance));
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/take-attendance/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Take Attendance Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const uploadInternalMarks = async (
  data: UploadMarksRequest
): Promise<UploadMarksResponse> => {
  try {
    const formData = new FormData();
    formData.append("branch_id", data.branch_id);
    formData.append("semester_id", data.semester_id);
    formData.append("section_id", data.section_id);
    formData.append("subject_id", data.subject_id);
    formData.append("test_number", data.test_number.toString());
    if (data.marks) {
      formData.append("marks", JSON.stringify(data.marks));
    }
    if (data.file) {
      formData.append("file", data.file);
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/upload-marks/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Upload Internal Marks Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const applyLeave = async (
  data: ApplyLeaveRequest
): Promise<ApplyLeaveResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/apply-leave/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Apply Leave Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const viewAttendanceRecords = async (
  params: { branch_id: string; semester_id: string; section_id: string; subject_id: string }
): Promise<ViewAttendanceRecordsResponse> => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/attendance-records/?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("View Attendance Records Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const createAnnouncement = async (
  data: CreateAnnouncementRequest
): Promise<CreateAnnouncementResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/announcements/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Create Announcement Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getProctorStudents = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<GetProctorStudentsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const url = queryParams.toString() 
      ? `${API_BASE_URL}/faculty/proctor-students/?${queryParams.toString()}`
      : `${API_BASE_URL}/faculty/proctor-students/`;
      
    const response = await fetchWithTokenRefresh(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Proctor Students Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFacultyAssignments = async (): Promise<GetFacultyAssignmentsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/assignments/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Faculty Assignments Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFacultyDashboardBootstrap = async (): Promise<GetFacultyDashboardBootstrapResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/dashboard/bootstrap/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Faculty Dashboard Bootstrap Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getAttendanceRecordsWithSummary = async (params?: {
  page?: number;
  page_size?: number;
}): Promise<GetAttendanceRecordsWithSummaryResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    
    const url = queryParams.toString() 
      ? `${API_BASE_URL}/faculty/attendance-records/summary/?${queryParams.toString()}`
      : `${API_BASE_URL}/faculty/attendance-records/summary/`;
      
    const response = await fetchWithTokenRefresh(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Attendance Records With Summary Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getApplyLeaveBootstrap = async (): Promise<GetApplyLeaveBootstrapResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/apply-leave/bootstrap/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Apply Leave Bootstrap Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getTimetable = async (): Promise<GetTimetableResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/timetable/`, {
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

export const manageChat = async (
  data: SendChatMessageRequest,
  method: "GET" | "POST" = "GET"
): Promise<ManageChatResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/chat/`, {
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

export const manageProfile = async (
  data: ManageProfileRequest
): Promise<ManageProfileResponse> => {
  try {
    const formData = new FormData();
    if (data.first_name) formData.append("first_name", data.first_name);
    if (data.last_name) formData.append("last_name", data.last_name);
    if (data.email) formData.append("email", data.email);
    if (data.mobile) formData.append("mobile", data.mobile);
    if (data.address) formData.append("address", data.address);
    if (data.bio) formData.append("bio", data.bio);
    if (data.profile_picture) formData.append("profile_picture", data.profile_picture);
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/profile/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Manage Profile Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const scheduleMentoring = async (
  data: ScheduleMentoringRequest
): Promise<ScheduleMentoringResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/schedule-mentoring/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Schedule Mentoring Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const generateStatistics = async (
  params: { file_id: string }
): Promise<GenerateStatisticsResponse> => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/generate-statistics/?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Generate Statistics Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const downloadPDF = async (
  filename: string
): Promise<DownloadPDFResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/download-pdf/${filename}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      return { success: true, file_url: url };
    }
    return await response.json();
  } catch (error) {
    console.error("Download PDF Error:", error);
    return { success: false, message: "Network error" };
  }
};

export async function getStudentsForClass(
  branch_id: number,
  semester_id: number,
  section_id: number,
  subject_id: number
): Promise<ClassStudent[]> {
  const params = new URLSearchParams({
    branch_id: branch_id.toString(),
    semester_id: semester_id.toString(),
    section_id: section_id.toString(),
    subject_id: subject_id.toString(),
  });
  const res = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/students/?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch students');
  return data.data;
}

export const getInternalMarksForClass = async (
  branch_id: number,
  semester_id: number,
  section_id: number,
  subject_id: number,
  test_number: number
): Promise<InternalMarkStudent[]> => {
  const params = new URLSearchParams({
    branch_id: branch_id.toString(),
    semester_id: semester_id.toString(),
    section_id: section_id.toString(),
    subject_id: subject_id.toString(),
    test_number: test_number.toString(),
  });
  const res = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/internal-marks/?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch internal marks');
  return data.data;
};

export const getFacultyLeaveRequests = async (): Promise<FacultyLeaveRequest[]> => {
  const res = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/leave-requests/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch leave requests');
  return data.data;
};

export const getFacultyProfile = async () => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/profile/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Faculty Profile Error:", error);
    return { success: false, message: "Network error" };
  }
};

export async function getFacultyNotifications() {
  const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/notifications/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export async function getFacultySentNotifications() {
  const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/notifications/sent/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}



export async function getAttendanceRecordsList() {
  const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/attendance-records/list/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export async function getAttendanceRecordDetails(recordId: number) {
  const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/attendance-records/${recordId}/details/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export interface LeaveRow {
  id: string;
  student_name: string;
  usn: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

// Bootstrap endpoints for optimized data fetching
export interface GetTakeAttendanceBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    students: Array<{
      id: number;
      name: string;
      usn: string;
      user_id: number | null;
    }>;
    recent_records: Array<{
      id: number;
      date: string;
      present_count: number;
      total_count: number;
      percentage: number;
    }>;
  };
}

export interface GetUploadMarksBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    students: Array<{
      id: number;
      name: string;
      usn: string;
      user_id: number | null;
      existing_mark: {
        id: number;
        mark: number;
        max_mark: number;
        uploaded_at: string;
      } | null;
    }>;
    subject_info: {
      name: string;
      code: string;
      test_number: number;
    };
  };
}

export const getTakeAttendanceBootstrap = async (params: {
  branch_id: string;
  semester_id: string;
  section_id: string;
  subject_id: string;
}): Promise<GetTakeAttendanceBootstrapResponse> => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/take-attendance/bootstrap/?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Take Attendance Bootstrap Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getUploadMarksBootstrap = async (params: {
  branch_id: string;
  semester_id: string;
  section_id: string;
  subject_id: string;
  test_number: number;
}): Promise<GetUploadMarksBootstrapResponse> => {
  try {
    const query = new URLSearchParams({
      ...params,
      test_number: params.test_number.toString(),
    }).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/upload-marks/bootstrap/?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Upload Marks Bootstrap Error:", error);
    return { success: false, message: "Network error" };
  }
};

interface ManageStudentLeaveRequest {
  leave_id: string;
  action: "APPROVE" | "REJECT";
}

interface ManageStudentLeaveResponse {
  success: boolean;
  message?: string;
}

export const manageStudentLeave = async (
  data: ManageStudentLeaveRequest
): Promise<ManageStudentLeaveResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/manage-student-leave/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Manage Student Leave Error:", error);
    return { success: false, message: "Network error" };
  }
};

// Faculty Attendance API functions
export interface MarkFacultyAttendanceRequest {
  status: "present" | "absent";
  notes?: string;
}

export interface MarkFacultyAttendanceResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    date: string;
    status: string;
    marked_at: string;
    updated?: boolean;
  };
}

export interface FacultyAttendanceRecord {
  id: string;
  date: string;
  status: string;
  marked_at: string;
  notes: string;
}

export interface GetFacultyAttendanceRecordsResponse {
  success: boolean;
  message?: string;
  data?: FacultyAttendanceRecord[];
  summary?: {
    total_days: number;
    present_days: number;
    absent_days: number;
    attendance_percentage: number;
  };
}

export const markFacultyAttendance = async (
  data: MarkFacultyAttendanceRequest
): Promise<MarkFacultyAttendanceResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/mark-attendance/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Mark Faculty Attendance Error:", error);
    return { success: false, message: "Network error" };
  }
};

export const getFacultyAttendanceRecords = async (params?: {
  start_date?: string;
  end_date?: string;
}): Promise<GetFacultyAttendanceRecordsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const url = `/api/faculty/my-attendance-records/${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    
    const response = await fetchWithTokenRefresh(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Faculty Attendance Records Error:", error);
    return { success: false, message: "Network error" };
  }
};

// IA Marks APIs
export interface CreateQPRequest {
  branch: number;
  semester: number;
  section: number;
  subject: number;
  test_type: string;
  questions_data: Array<{
    question_number: string;
    co: string;
    blooms_level: string;
    subparts_data: Array<{
      subpart_label: string;
      content: string;
      max_marks: number;
    }>;
  }>;
}

export interface QPResponse {
  success: boolean;
  data?: any;
  errors?: any;
}

export interface StudentsForMarksResponse {
  success: boolean;
  data?: Array<{
    id: number;
    name: string;
    usn: string;
    existing_mark?: {
      marks_detail: Record<string, number>;
      total_obtained: number;
    };
  }>;
  question_paper?: number;
}

export interface UploadIAMarksRequest {
  question_paper_id: number;
  marks_data: Array<{
    student_id: number;
    marks_detail: Record<string, number>;
  }>;
}

export const createQuestionPaper = async (data: CreateQPRequest): Promise<QPResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/qps/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Create QP Error:", error);
    return { success: false };
  }
};

export const getQuestionPapers = async (): Promise<any> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/qps/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get QPs Error:", error);
    return { success: false };
  }
};

export const getStudentsForMarks = async (params: {
  branch_id: string;
  semester_id: string;
  section_id: string;
  subject_id: string;
  test_type: string;
}): Promise<StudentsForMarksResponse> => {
  try {
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/students-for-marks/?${query}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error("Get Students for Marks Error:", error);
    return { success: false };
  }
};

export const uploadIAMarks = async (data: UploadIAMarksRequest): Promise<any> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/upload-ia-marks/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Upload IA Marks Error:", error);
    return { success: false };
  }
};

export const updateQuestionPaper = async (id: number, data: CreateQPRequest): Promise<QPResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/faculty/qps/${id}/`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    console.error("Update QP Error:", error);
    return { success: false };
  }
};