import { API_BASE_URL } from "./config";
import { fetchWithTokenRefresh } from "./authService";

// Type definitions for request and response data
interface HODStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    faculty_count: number;
    student_count: number;
    pending_leaves: number;
    average_attendance: number;
    attendance_trend: Array<{
      week: string;
      start_date: string;
      end_date: string;
      attendance_percentage: number;
    }>;
  };
}

interface LowAttendanceResponse {
  success: boolean;
  message?: string;
  data?: {
    students: Array<{
      student_id: string;
      name: string;
      usn: string;
      attendance_percentage: number;
      total_sessions: number;
      present_sessions: number;
      semester: number | null;
      section: string | null;
      subject: string;
    }>;
  };
}

interface Semester {
  id: string;
  number: number;
}

interface GetSemestersResponse {
  success: boolean;
  message?: string;
  data?: Semester[];
}

interface Section {
  id: string;
  name: string;
  semester_id: string;
}

interface GetSectionsResponse {
  success: boolean;
  message?: string;
  data?: Section[];
}

interface Branch {
  id: string;
  name: string;
}

interface GetBranchesResponse {
  success: boolean;
  message?: string;
  data?: Branch[];
}

interface Faculty {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface GetFacultiesResponse {
  success: boolean;
  message?: string;
  data?: Faculty[];
}

interface ManageSemestersRequest {
  action: "create" | "update" | "delete";
  semester_id?: string;
  number?: number;
  branch_id: string;
}

interface ManageSemestersResponse {
  success: boolean;
  message?: string;
}

interface ManageSectionsRequest {
  action: "create" | "update" | "delete";
  section_id?: string;
  name?: string;
  semester_id?: string;
  branch_id: string;
}

interface ManageSectionsResponse {
  success: boolean;
  message?: string;
  data?: { id: string; name: string; semester_id: string };
}

interface ManageStudentsRequest {
  action: "create" | "update" | "delete" | "bulk_update";
  student_id?: string;
  usn?: string;
  name?: string;
  email?: string;
  semester_id?: string;
  section_id?: string;
  branch_id: string;
  bulk_data?: Array<{ usn: string; name: string; email: string }>;
}

interface ManageStudentsResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    usn: string;
    name: string;
    semester: number;
    section: string;
    subject: string;
    proctor: string | null;
  }> | { student_id: string } | { created_count: number };
}

interface Subject {
  id: string;
  name: string;
  subject_code: string;
  semester_id: string;
}

interface GetSubjectsResponse {
  success: boolean;
  message?: string;
  data?: Subject[];
}

interface ManageSubjectsRequest {
  action: "create" | "update";
  subject_id?: string;
  name: string;
  subject_code?: string;
  semester_id: string;
  branch_id: string;
}

interface ManageSubjectsResponse {
  success: boolean;
  message?: string;
  data?: { subject_id: string; subject_code: string };
}

interface FacultyAssignment {
  id: string;
  faculty: string;
  subject: string;
  semester: number;
  section: string;
  faculty_id: string;
  subject_id: string;
  semester_id: string;
  section_id: string;
}

interface ManageFacultyAssignmentsRequest {
  action?: "create" | "update" | "delete";
  assignment_id?: string;
  faculty_id?: string;
  subject_id?: string;
  semester_id?: string;
  section_id?: string;
  branch_id: string;
}

interface ManageFacultyAssignmentsResponse {
  success: boolean;
  message?: string;
  data?: { assignments?: FacultyAssignment[]; assignment_id?: string };
}

interface TimetableEntry {
  id: string;
  faculty_assignment: {
    id: string;
    faculty: string;
    subject: string;
    semester: number;
    section: string;
  };
  day: string;
  start_time: string;
  end_time: string;
  room: string;
}

interface ManageTimetableRequest {
  action: "create" | "update" | "delete" | "bulk_create" | "GET";
  timetable_id?: string;
  assignment_id?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  semester_id: string;
  section_id: string;
  branch_id: string;
  file?: File;
}

interface ManageTimetableResponse {
  success: boolean;
  message?: string;
  data?: { timetable_id?: string; created_count?: number; errors?: string[] } | TimetableEntry[];
}

interface Leave {
  id: string;
  title: string;
  date: string;
  reason: string;
  status: string;
}

interface ManageHODLeavesRequest {
  branch_id: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

interface ManageHODLeavesResponse {
  success: boolean;
  message?: string;
  data?: Leave[] | Leave;
}

interface ManageLeavesRequest {
  branch_id: string;
  action?: "update";
  leave_id?: string;
  status?: "APPROVED" | "REJECTED";
}

interface ManageLeavesResponse {
  success: boolean;
  message?: string;
  data?: { leaves?: Leave[]; leave_id?: string; status?: string };
}

interface GetAttendanceParams {
  semester_id?: string;
  section_id?: string;
  subject_id?: string;
  branch_id: string;
}

interface AttendanceRecord {
  id: string;
  subject: string;
  semester: number;
  section: string;
  date: string;
}

interface GetAttendanceResponse {
  success: boolean;
  message?: string;
  data?: { records: AttendanceRecord[] };
}

interface GetMarksParams {
  semester_id?: string;
  section_id?: string;
  subject_id?: string;
  branch_id: string;
}

interface Mark {
  student_id: string;
  student: string;
  usn: string;
  subject: string;
  test_number: number;
  mark: number;
  max_mark: number;
}

interface GetMarksResponse {
  success: boolean;
  message?: string;
  data?: { marks: Mark[] };
}

interface CreateAnnouncementRequest {
  title: string;
  content: string;
  target: "faculty" | "students" | "both";
  branch_id: string;
}

interface CreateAnnouncementResponse {
  success: boolean;
  message?: string;
  data?: { announcement_id: string };
}

interface SendNotificationRequest {
  action: "notify" | "notify_all";
  title: string;
  student_id?: string;
  message: string;
  target?: "student" | "teacher" | "all";
  branch_id: string;
}

interface SendNotificationResponse {
  success: boolean;
  message?: string;
}

interface AssignProctorRequest {
  student_id: string;
  faculty_id: string;
  branch_id: string;
}

interface AssignProctorResponse {
  success: boolean;
  message?: string;
  data?: { student_id: string; faculty_id: string };
}

interface AssignProctorsBulkRequest {
  usns: string[];
  faculty_id: string;
  branch_id: string;
}

interface AssignProctorsBulkResponse {
  success: boolean;
  message?: string;
}

interface ChatChannel {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  section: string | null;
  last_message: string | null;
}

interface ManageChatRequest {
  action: "create_channel" | "send_message";
  channel_id?: string;
  name?: string;
  channel_type?: "subject" | "section" | "private" | "faculty";
  subject_id?: string;
  section_id?: string;
  participant_ids?: string[];
  content?: string;
  branch_id: string;
}

interface ManageChatResponse {
  success: boolean;
  message?: string;
  data?: { channels?: ChatChannel[]; channel_id?: string; message_id?: string };
}

interface ManageProfileRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  address?: string;
  bio?: string;
}

interface ManageProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    address: string;
    bio: string;
    branch: string;
    branch_id: string;
  };
}

interface Notification {
  id: string;
  title: string;
  message: string;
  role: string;
  created_at: string;
  created_by?: string;
}

interface GetNotificationsResponse {
  success: boolean;
  message?: string;
  data?: Notification[];
}

// Utility function for error handling
const handleApiError = (error: unknown, response?: Response): { success: boolean; message: string } => {
  console.error("API Error:", error);
  if (response?.status === 404) {
    return { success: false, message: `Resource not found: Invalid branch ID or endpoint (Status: 404)` };
  } else if (response?.status === 403) {
    return { success: false, message: "Access denied: Invalid or missing authentication token" };
  } else if (response?.status === 400) {
    return { success: false, message: (error as Error).message || "Invalid request data" };
  } else if ((error as Error).message?.includes("Unexpected token")) {
    return { success: false, message: "Server returned invalid response (possibly HTML instead of JSON)" };
  }
  return { success: false, message: (error as Error).message || "Network error or server issue" };
};

// API functions
export const getBranches = async (): Promise<GetBranchesResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/branches/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getHODStats = async (branch_id: string): Promise<HODStatsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/dashboard-stats/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getLowAttendance = async (
  branch_id: string,
  threshold: number = 75,
  filters: { semester_id?: string; section_id?: string; subject_id?: string } = {}
): Promise<LowAttendanceResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID required");
    const params: Record<string, string> = { threshold: threshold.toString(), branch_id };
    if (filters.semester_id) params.semester_id = filters.semester_id;
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/low-attendance/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getSemesters = async (branch_id: string): Promise<GetSemestersResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/semesters/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageSemesters = async (data: ManageSemestersRequest): Promise<ManageSemestersResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/semesters/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageSections = async (
  data: ManageSectionsRequest | { branch_id: string; semester_id?: string },
  method: "GET" | "POST" = "GET"
): Promise<GetSectionsResponse> => {
  try {
    const branch_id = (data as { branch_id: string }).branch_id;
    if (!branch_id) throw new Error("Branch ID required");
    let url = `${API_BASE_URL}/hod/sections/?branch_id=${branch_id}`;
    if (method === "GET" && (data as any).semester_id) {
      url += `&semester_id=${(data as any).semester_id}`;
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageSubjects = async (
  data: ManageSubjectsRequest | { branch_id: string; semester_id?: string },
  method: "GET" | "POST" = "GET"
): Promise<GetSubjectsResponse> => {
  try {
    const branch_id = (data as { branch_id: string }).branch_id;
    if (!branch_id) throw new Error("Branch ID required");
    let url = `${API_BASE_URL}/hod/subjects/?branch_id=${branch_id}`;
    if (method === "GET" && (data as any).semester_id) {
      url += `&semester_id=${(data as any).semester_id}`;
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageFaculties = async (
  data: { branch_id: string },
  method: "GET" = "GET"
): Promise<GetFacultiesResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    console.log(`Fetching faculties with branch_id: ${data.branch_id}`);
    const url = `${API_BASE_URL}/hod/faculties/?branch_id=${data.branch_id}`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getProctors = async (branch_id: string): Promise<GetFacultiesResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctors/list/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageFacultyAssignments = async (
  data: ManageFacultyAssignmentsRequest,
  method: "GET" | "POST" = "GET"
): Promise<ManageFacultyAssignmentsResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    if (method === "POST" && !data.action) {
      throw new Error("Action is required for POST requests");
    }
    if (data.action === "create" && (!data.faculty_id || !data.subject_id || !data.semester_id || !data.section_id)) {
      throw new Error("Faculty ID, Subject ID, Semester ID, and Section ID required for create action");
    }
    if (data.action === "update" && (!data.assignment_id || !data.faculty_id || !data.subject_id || !data.semester_id || !data.section_id)) {
      throw new Error("Assignment ID, Faculty ID, Subject ID, Semester ID, and Section ID required for update action");
    }
    if (data.action === "delete" && !data.assignment_id) {
      throw new Error("Assignment ID required for delete action");
    }
    console.log("manageFacultyAssignments request data:", data);
    let url = `${API_BASE_URL}/hod/faculty-assignments/?branch_id=${data.branch_id}`;
    if (method === "GET") {
      const params = new URLSearchParams({ branch_id: data.branch_id });
      if (data.semester_id) params.append("semester_id", data.semester_id);
      if (data.section_id) params.append("section_id", data.section_id);
      url = `${API_BASE_URL}/hod/faculty-assignments/?${params.toString()}`;
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    const result = await response.json();
    console.log("manageFacultyAssignments response:", result);
    return result;
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageTimetable = async (data: ManageTimetableRequest): Promise<ManageTimetableResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    console.log("manageTimetable request data:", data);
    if (data.action === "GET") {
      const params = new URLSearchParams({ branch_id: data.branch_id });
      if (data.semester_id) params.append("semester_id", data.semester_id);
      if (data.section_id) params.append("section_id", data.section_id);
      const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/timetable/?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });
      const result = await response.json();
      console.log("manageTimetable GET response:", result);
      return result;
    }

    if ((data.action === "create" || data.action === "update") && (!data.semester_id || !data.section_id)) {
      throw new Error("Semester ID and Section ID required for create/update action");
    }

    const headers: HeadersInit = {};
    let body: FormData | string;

    if (data.action === "bulk_create") {
      if (!data.semester_id || !data.section_id || !data.room || !data.file) {
        throw new Error("Semester ID, Section ID, Room, and File required for bulk_create action");
      }
      const formData = new FormData();
      formData.append("action", data.action);
      formData.append("branch_id", data.branch_id);
      formData.append("semester_id", data.semester_id);
      formData.append("section_id", data.section_id);
      formData.append("room", data.room);
      formData.append("file", data.file);
      body = formData;
    } else {
      if (data.action === "create" || data.action === "update") {
        if (!data.assignment_id || !data.day || !data.start_time || !data.end_time) {
          throw new Error("Assignment ID, Day, Start Time, and End Time required for create/update action");
        }
      }
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }

    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/timetable/`, {
      method: "POST",
      headers,
      body,
      timeout: 10000,
    });
    const result = await response.json();
    console.log("manageTimetable POST response:", result);
    return result;
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageHODLeaves = async (
  data: ManageHODLeavesRequest,
  method: "GET" | "POST" = "GET"
): Promise<ManageHODLeavesResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    console.log("manageHODLeaves request:", { method, data });
    const url = `${API_BASE_URL}/hod/leave-applications/?branch_id=${data.branch_id}`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    const result = await response.json();
    console.log("manageHODLeaves response:", result);
    return result;
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageLeaves = async (
  data: ManageLeavesRequest,
  method: "GET" | "PATCH" = "GET"
): Promise<ManageLeavesResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    console.log("manageLeaves request:", { method, data });
    const url = `${API_BASE_URL}/hod/leaves/`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify(data) : undefined,
      params: method === "GET" ? { branch_id: data.branch_id } : undefined,
      timeout: 10000,
    });
    const result = await response.json();
    console.log("manageLeaves response:", result);
    return result;
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getAttendance = async (params: GetAttendanceParams): Promise<GetAttendanceResponse> => {
  try {
    if (!params.branch_id) throw new Error("Branch ID required");
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/attendance/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getMarks = async (params: GetMarksParams): Promise<GetMarksResponse> => {
  try {
    if (!params.branch_id) throw new Error("Branch ID required");
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/marks/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const createAnnouncement = async (data: CreateAnnouncementRequest): Promise<CreateAnnouncementResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/announcements/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageNotifications = async (
  data: SendNotificationRequest,
  method: "GET" | "POST" = "POST",
  type: "received" | "sent" = "received"
): Promise<GetNotificationsResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    const url = method === "GET" 
      ? `${API_BASE_URL}/hod/notifications/${type === "received" ? "history" : "sent"}/?branch_id=${data.branch_id}` 
      : `${API_BASE_URL}/hod/notifications/`;
    
    if (method === "POST") {
      if (!data.message || !data.title) throw new Error("Title and message are required");
      if (data.action === "notify" && !data.student_id) throw new Error("Student ID required for notify action");
      if (data.action === "notify_all" && !data.target) throw new Error("Target required for notify_all action");
      console.log("Sending notification request:", data);
    }

    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    const result = await response.json();
    console.log("Notification response:", result);
    return {
      success: result.success,
      message: result.message || (result.success ? "Notification sent successfully" : "No message provided"),
      data: result.data,
    };
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getSentNotifications = async (branch_id: string): Promise<GetNotificationsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/notifications/sent/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const assignProctor = async (data: AssignProctorRequest): Promise<AssignProctorResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctors/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const assignProctorsBulk = async (data: AssignProctorsBulkRequest): Promise<AssignProctorsBulkResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    if (!data.usns.length || !data.faculty_id) throw new Error("USNs and faculty ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctors/bulk/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageChat = async (
  data: ManageChatRequest,
  method: "GET" | "POST" = "GET"
): Promise<ManageChatResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    const url = method === "GET" ? `${API_BASE_URL}/hod/chat/?branch_id=${data.branch_id}` : `${API_BASE_URL}/hod/chat/`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageProfile = async (
  data: ManageProfileRequest,
  method: "GET" | "PATCH" = "GET"
): Promise<ManageProfileResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/profile/`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageStudents = async (
  data: ManageStudentsRequest | { branch_id: string },
  method: "GET" | "POST" = "POST"
): Promise<ManageStudentsResponse> => {
  try {
    const branch_id = (data as { branch_id: string }).branch_id;
    if (!branch_id) throw new Error("Branch ID required");
    const url = method === "GET" ? `${API_BASE_URL}/hod/students/?branch_id=${branch_id}` : `${API_BASE_URL}/hod/students/`;
    if (method === "POST") {
      if (!data.action) throw new Error("Action is required for POST requests");
      if (data.action === "create" && (!data.usn || !data.name || !data.email || !data.semester_id || !data.section_id)) {
        throw new Error("USN, Name, Email, Semester ID, and Section ID required for create action");
      }
      if (data.action === "update" && (!data.student_id || !data.name || !data.email || !data.semester_id || !data.section_id)) {
        throw new Error("Student ID, Name, Email, Semester ID, and Section ID required for update action");
      }
      if (data.action === "delete" && !data.student_id) {
        throw new Error("Student ID required for delete action");
      }
      if (data.action === "bulk_update") {
        if (!data.semester_id || !data.section_id) {
          throw new Error("Semester ID and Section ID required for bulk_update action");
        }
        if (!data.bulk_data || !Array.isArray(data.bulk_data) || data.bulk_data.length === 0) {
          throw new Error("Bulk data must be a non-empty array for bulk_update action");
        }
        for (const entry of data.bulk_data) {
          if (!entry.usn || !entry.name || !entry.email) {
            throw new Error("Each bulk data entry must include usn, name, and email");
          }
        }
      }
      console.log("manageStudents request data:", data);
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,
      timeout: 10000,
    });
    const result = await response.json();
    console.log("manageStudents response:", result);
    return result;
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getStudentPerformance = async (
  data: { branch_id: string }
): Promise<{ success: boolean; data?: { subject: string; attendance: number; marks: number; semester: string }[]; message?: string }> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/performance/?branch_id=${data.branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getAllAttendance = async (
  branch_id: string,
  filters: { semester_id?: string; section_id?: string; subject_id?: string } = {}
): Promise<LowAttendanceResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID required");
    const params: Record<string, string> = { branch_id };
    if (filters.semester_id) params.semester_id = filters.semester_id;
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/all-attendance/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

interface UploadStudyMaterialRequest {
  title: string;
  subject_name: string;
  subject_code: string;
  semester_id: string;
  file: File;
  branch_id: string;
}

interface UploadStudyMaterialResponse {
  success: boolean;
  message?: string;
  data?: { material_id: string; title: string };
}

interface StudyMaterial {
  id: string;
  title: string;
  subject_name: string;
  subject_code: string;
  semester: number | null;
  branch: string | null;
  uploaded_by: string;
  uploaded_at: string;
  file_url: string;
}

interface GetStudyMaterialsResponse {
  success: boolean;
  message?: string;
  data?: StudyMaterial[];
}

export const uploadStudyMaterial = async (data: UploadStudyMaterialRequest): Promise<UploadStudyMaterialResponse> => {
  try {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("subject_name", data.subject_name || "");
    formData.append("subject_code", data.subject_code || "");
    formData.append("semester_id", data.semester_id || "");
    formData.append("file", data.file);
    formData.append("branch_id", data.branch_id || "");

    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/study-materials/`, {
      method: "POST",
      body: formData,
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getStudyMaterials = async (): Promise<GetStudyMaterialsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/study-materials/`, {
      method: "GET",
      timeout: 10000,
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};