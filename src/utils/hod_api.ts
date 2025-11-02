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
      batch: string;
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

interface GetAttendanceBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    profile: {
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile_number: string;
      address: string;
      bio: string;
      branch: string;
      branch_id: string;
    };
    branches: Branch[];
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string }>;
    attendance: {
      students: Array<{
        student_id: string;
        name: string;
        usn: string;
        attendance_percentage: number | string;
        total_sessions: number;
        present_sessions: number;
        semester: number | null;
        section: string | null;
        batch: string | null;
        subject: string;
      }>;
    };
    pagination: {
      page: number;
      page_size: number;
      total_students: number;
      total_pages: number;
    };
  };
}

interface Batch {
  id: string;
  name: string;
  start_year: number;
  end_year: number;
  student_count: number;
  created_at: string;
}

interface Course {
  id: string;
  name: string;
}

interface GetStudentOptionsResponse {
  success: boolean;
  message?: string;
  data?: {
    batches: Batch[];
    courses: Course[];
    semesters: Semester[];
    sections: Section[];
  };
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
  action: "create" | "update" | "delete" | "bulk_update" | "register_subjects";
  student_id?: string;
  usn?: string;
  name?: string;
  email?: string;
  semester_id?: string;
  section_id?: string;
  branch_id: string;
  batch_id?: string;
  course_id?: string;
  parent_name?: string;
  parent_contact?: string;
  emergency_contact?: string;
  blood_group?: string;
  date_of_admission?: string;
  subject_ids?: string[];
  bulk_data?: Array<{
    usn: string;
    name: string;
    email: string;
    batch_id?: string;
    course_id?: string;
    parent_name?: string;
    parent_contact?: string;
    emergency_contact?: string;
    blood_group?: string;
    date_of_admission?: string;
  }>;
}

interface ManageStudentsResponse {
  success: boolean;
  message?: string;
  data?: Array<{
    usn: string;
    name: string;
    semester: number;
    section: string | null;
    batch: string;
    subject?: string;
    proctor: string | null;
  }> | { student_id: string } | { created_count: number };
}

interface ManageBatchesRequest {
  start_year?: number;
  end_year?: number;
}

interface ManageBatchesResponse {
  success: boolean;
  message?: string;
  batches?: Batch[];
  batch?: Batch;
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
  action: "create" | "update" | "delete";
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

interface TestMark {
  test_number: number;
  mark: number;
  max_mark: number;
}

interface Mark {
  student_id: string;
  student: string;
  usn: string;
  subject: string;
  subject_id: string;
  average_mark: number;
  test_marks: TestMark[];
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
  action: "notify" | "notify_all" | "notify_low_attendance";
  title: string;
  student_id?: string;
  message: string;
  target?: "student" | "teacher" | "all";
  branch_id: string;
  semester_id?: string;
  section_id?: string;
  subject_id?: string;
  threshold?: number;
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

interface PromoteStudentsRequest {
  from_semester_id: string;
  to_semester_id: string;
  section_id?: string;
  branch_id: string;
  student_ids?: string[];
}

interface PromoteStudentsResponse {
  success: boolean;
  message?: string;
  data?: {
    promoted: Array<{
      usn: string;
      name: string;
      from_semester: number;
      to_semester: number;
      batch: string;
    }>;
  };
}

interface PromoteSelectedStudentsRequest {
  student_ids: string[];
  to_semester_id: string;
  branch_id: string;
}

interface PromoteSelectedStudentsResponse {
  success: boolean;
  message?: string;
  promoted?: Array<{
    usn: string;
    name: string;
    from_semester: number;
    to_semester: number;
    batch: string;
  }>;
}

interface DemoteStudentRequest {
  student_id: string;
  to_semester_id: string;
  branch_id: string;
  reason: string;
  remarks?: string;
  section_id?: string;
}

interface DemoteStudentResponse {
  success: boolean;
  message?: string;
  data?: {
    student_usn: string;
    student_name: string;
    from_semester: number;
    to_semester: number;
    reason: string;
    remarks: string;
  };
}

interface BulkDemoteStudentsRequest {
  student_ids: string[];
  to_semester_id: string;
  branch_id: string;
  reason: string;
  remarks?: string;
  section_id?: string;
}

interface BulkDemoteStudentsResponse {
  success: boolean;
  message?: string;
  data?: {
    demoted_students: Array<{
      usn: string;
      name: string;
      from_semester: number;
      to_semester: number;
    }>;
    failed_students: Array<{
      usn: string;
      name: string;
      reason: string;
    }>;
    demoted_count: number;
    failed_count: number;
    target_semester: number;
  };
}

interface PromotionEligibility {
  student_id: string;
  usn: string;
  name: string;
  is_eligible: boolean;
  failed_subjects: string[];
  attendance_percentage: number;
}

interface GetPromotionEligibilityParams {
  semester_id: string;
  section_id?: string;
  branch_id: string;
}

interface GetPromotionEligibilityResponse {
  success: boolean;
  message?: string;
  data?: { students: PromotionEligibility[] };
}

interface ExamFailure {
  id: string;
  student_id: string;
  usn: string;
  name: string;
  subject_id: string;
  subject_name: string;
  semester_id: string;
  semester_number: number;
  failure_date: string;
}

interface GetExamFailuresParams {
  semester_id?: string;
  section_id?: string;
  subject_id?: string;
  branch_id: string;
}

interface GetExamFailuresResponse {
  success: boolean;
  message?: string;
  data?: { failures: ExamFailure[] };
}

interface RecordExamFailureRequest {
  student_id: string;
  subject_id: string;
  semester_id: string;
  branch_id: string;
  failure_date: string;
}

interface RecordExamFailureResponse {
  success: boolean;
  message?: string;
  data?: { failure_id: string };
}

interface UploadStudyMaterialRequest {
  title: string;
  subject_name?: string;
  subject_code?: string;
  semester_id: string;
  branch_id: string;
  file: File;
}

interface StudyMaterial {
  id: string;
  title: string;
  subject_name: string;
  subject_code: string;
  semester_id: string;
  branch_id: string;
  uploaded_by: string;
  uploaded_at: string;
  file_url: string;
}

interface UploadStudyMaterialResponse {
  success: boolean;
  message?: string;
  data?: StudyMaterial;
}

interface GetStudyMaterialsResponse {
  success: boolean;
  message?: string;
  data?: StudyMaterial[];
}

interface StudentPerformance {
  student_id: string;
  usn: string;
  name: string;
  subject: string;
  attendance_percentage: number;
  average_mark: number;
  semester: number;
  batch: string;
  test_marks?: TestMark[];
}

// Utility function for error handling
const handleApiError = (error: unknown, response?: Response): { success: boolean; message: string } => {
  console.error("API Error:", error);
  if (response?.status === 404) {
    return { success: false, message: `Resource not found: Invalid ID or endpoint (Status: 404)` };
  } else if (response?.status === 403) {
    return { success: false, message: "Access denied: Invalid or missing authentication token (Status: 403)" };
  } else if (response?.status === 400) {
    return { success: false, message: (error as Error).message || "Invalid request data (Status: 400)" };
  } else if (response?.status === 500) {
    return { success: false, message: "Server error: Please try again later (Status: 500)" };
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

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

interface GetLeaveBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    profile: {
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile_number: string;
      address: string;
      bio: string;
      branch: string;
      branch_id: string;
    };
    leaves: Array<{
      id: number;
      faculty_name: string;
      department: string;
      start_date: string;
      end_date: string;
      reason: string;
      status: string;
    }>;
  };
}

export const getLeaveBootstrap = async (
  branch_id?: string
): Promise<GetLeaveBootstrapResponse> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/leave-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getFacultyLeavesBootstrap = async (
  branch_id?: string
): Promise<GetLeaveBootstrapResponse> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/faculty-leaves-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

interface GetProctorBootstrapResponse {
  success: boolean;
  message?: string;
  data?: {
    profile: {
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile_number: string;
      address: string;
      bio: string;
      branch: string;
      branch_id: string;
    };
    students: Array<{
      usn: string;
      name: string;
      semester: number | null;
      branch: string;
      section: string | null;
      proctor: string | null;
    }>;
    proctors: Array<{
      id: string;
      name: string;
      first_name: string;
      last_name: string;
    }>;
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string }>;
  };
}

export const getProctorBootstrap = async (
  branch_id?: string
): Promise<GetProctorBootstrapResponse> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctor-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getSemesterBootstrap = async (
  branch_id?: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: {
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile_number: string;
      address: string;
      bio: string;
      branch: string;
      branch_id: string;
    };
    branches: Branch[];
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string }>;
  };
}> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/semester-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getHODStats = async (branch_id: string): Promise<HODStatsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/dashboard-stats/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

// Combined HOD dashboard (stats + leaves in one call)
export const getHODDashboard = async (
  branch_id: string
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    overview?: {
      faculty_count: number;
      student_count: number;
      pending_leaves: number;
    };
    attendance_trend?: Array<{
      week: string;
      start_date: string;
      end_date: string;
      attendance_percentage: number;
    }>;
    leaves?: Array<any>;
  };
}> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/dashboard/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response) as any;
  }
};

export const getLowAttendanceBootstrap = async (
  branch_id?: string,
  filters: { semester_id?: string; section_id?: string; subject_id?: string; threshold?: number; page?: number; page_size?: number } = {}
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: {
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile_number: string;
      address: string;
      bio: string;
      branch: string;
      branch_id: string;
    };
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string }>;
    low_attendance: {
      students: Array<{
        student_id: string;
        usn: string;
        name: string;
        attendance_percentage: number;
        total_sessions: number;
        present_sessions: number;
        semester: number | null;
        section: string | null;
        batch: string | null;
        subject: string;
      }>;
    };
    pagination: {
      page: number;
      page_size: number;
      total_students: number;
      total_pages: number;
    };
  };
}> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    if (filters.semester_id) params.semester_id = filters.semester_id;
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.threshold) params.threshold = filters.threshold.toString();
    if (filters.page) params.page = filters.page.toString();
    if (filters.page_size) params.page_size = filters.page_size.toString();
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/low-attendance-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getAttendanceBootstrap = async (
  branch_id?: string,
  filters: { semester_id?: string; section_id?: string; subject_id?: string; page?: number; page_size?: number } = {}
): Promise<GetAttendanceBootstrapResponse> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    if (filters.semester_id) params.semester_id = filters.semester_id;
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.page) params.page = filters.page.toString();
    if (filters.page_size) params.page_size = filters.page_size.toString();
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/attendance-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getMarksBootstrap = async (
  branch_id?: string,
  filters: { semester_id?: string; section_id?: string; subject_id?: string; page?: number; page_size?: number } = {}
): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: {
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      mobile_number: string;
      address: string;
      bio: string;
      branch: string;
      branch_id: string;
    };
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string }>;
    performance: Array<{
      subject: string;
      marks: number;
      attendance: number;
      semester: string;
    }>;
    marks: Array<{
      student_id: string;
      student: string;
      usn: string;
      subject: string;
      subject_id: string;
      average_mark: number;
      test_marks: Array<{
        test_number: number;
        mark: number;
        max_mark: number;
      }>;
    }>;
    pagination: {
      page: number;
      page_size: number;
      total_students: number;
      total_pages: number;
    };
  };
}> => {
  try {
    const params: Record<string, string> = {};
    if (branch_id) params.branch_id = branch_id;
    if (filters.semester_id) params.semester_id = filters.semester_id;
    if (filters.section_id) params.section_id = filters.section_id;
    if (filters.subject_id) params.subject_id = filters.subject_id;
    if (filters.page) params.page = filters.page.toString();
    if (filters.page_size) params.page_size = filters.page_size.toString();
    const query = new URLSearchParams(params).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/marks-bootstrap/${query ? '?' + query : ''}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getStudentOptions = async (branch_id: string): Promise<GetStudentOptionsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/student-options/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getSemesters = async (branch_id: string): Promise<GetSemestersResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/semesters/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageSemesters = async (data: ManageSemestersRequest): Promise<ManageSemestersResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID is required");
    if (data.action === "create" && !data.number) throw new Error("Semester number is required for create action");
    if (data.action === "update" && (!data.semester_id || !data.number)) throw new Error("Semester ID and number are required for update action");
    if (data.action === "delete" && !data.semester_id) throw new Error("Semester ID is required for delete action");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/semesters/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

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
    if (!branch_id) throw new Error("Branch ID is required");
    let url = `${API_BASE_URL}/hod/sections/?branch_id=${branch_id}`;
    if (method === "GET" && (data as any).semester_id) {
      url += `&semester_id=${(data as any).semester_id}`;
    }
    if (method === "POST") {
      const req = data as ManageSectionsRequest;
      if (!req.action) throw new Error("Action is required for POST requests");
      if (req.action === "create" && (!req.name || !req.semester_id)) {
        throw new Error("Name and Semester ID are required for create action");
      }
      if (req.action === "update" && (!req.section_id || !req.name || !req.semester_id)) {
        throw new Error("Section ID, Name, and Semester ID are required for update action");
      }
      if (req.action === "delete" && !req.section_id) {
        throw new Error("Section ID is required for delete action");
      }
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

// Combined semester data: sections + subjects + faculty assignments
export const getHODTimetableSemesterData = async (semester_id: string): Promise<{
  success: boolean;
  message?: string;
  data?: {
    sections: Array<{ id: string; name: string; semester_id: string }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string }>;
    faculty_assignments: Array<{
      id: string;
      faculty: string;
      faculty_id: string;
      faculty_name: string;
      subject: string;
      subject_id: string;
      section: string;
      section_id: string;
      semester: number;
      semester_id: string;
    }>;
  };
}> => {
  try {
    if (!semester_id) throw new Error("Semester ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/timetable-semester-data/?semester_id=${semester_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response) as any;
  }
};

// Combined bootstrap: profile + semesters + sections
export const getHODBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: { first_name?: string; last_name?: string; email?: string; branch?: string; branch_id: string };
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string | null }>;
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response) as any;
  }
};

// Student management bootstrap (profile + semesters + sections + batches + students + performance)
export const getHODStudentBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: { branch_id: string };
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string | null }>;
    batches: Array<{ id: number; name: string; start_year: number; end_year: number }>;
    students: Array<{ usn: string; name: string; email: string; section: string; semester: string }>;
    performance: Array<{ subject: string; attendance: number; marks: number; semester: string }>;
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/student-bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response) as any;
  }
};
export const manageSubjects = async (
  data: ManageSubjectsRequest | { branch_id: string; semester_id?: string },
  method: "GET" | "POST" = "GET"
): Promise<GetSubjectsResponse> => {
  try {
    const branch_id = (data as { branch_id: string }).branch_id;
    if (!branch_id) throw new Error("Branch ID is required");
    let url = `${API_BASE_URL}/hod/subjects/?branch_id=${branch_id}`;
    if (method === "GET" && (data as any).semester_id) {
      url += `&semester_id=${(data as any).semester_id}`;
    }
    if (method === "POST") {
      const req = data as ManageSubjectsRequest;
      if (!req.action) throw new Error("Action is required for POST requests");
      if (req.action === "create" && (!req.name || !req.semester_id || !req.subject_code)) {
        throw new Error("Name, Semester ID, and Subject Code are required for create action");
      }
      if (req.action === "update" && (!req.subject_id || !req.name || !req.semester_id || !req.subject_code)) {
        throw new Error("Subject ID, Name, Semester ID, and Subject Code are required for update action");
      }
      if (req.action === "delete" && !req.subject_id) {
        throw new Error("Subject ID is required for delete action");
      }
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

// Subject management bootstrap (profile + semesters + subjects)
export const getHODSubjectBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: { branch_id: string };
    semesters: Array<{ id: string; number: number }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string | null }>;
    faculties: Array<{ id: string; username: string; first_name: string; last_name: string | null }>;
    assignments: Array<{ id: string; faculty: string; subject: string; section: string; semester: number; faculty_id: string; subject_id: string; section_id: string; semester_id: string }>;  
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/subject-bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response) as any;
  }
};
export const manageStudents = async (
  data: ManageStudentsRequest | { branch_id: string; semester_id?: string; section_id?: string },
  method: "GET" | "POST" = "GET"
): Promise<ManageStudentsResponse> => {
  try {
    const branch_id = (data as { branch_id: string }).branch_id;
    if (!branch_id) throw new Error("Branch ID is required");
    let url = `${API_BASE_URL}/hod/students/?branch_id=${branch_id}`;
    if (method === "GET") {
      const params = new URLSearchParams({ branch_id });
      if ((data as any).semester_id) params.append("semester_id", (data as any).semester_id);
      if ((data as any).section_id) params.append("section_id", (data as any).section_id);
      url = `${API_BASE_URL}/hod/students/?${params.toString()}`;
    }
    if (method === "POST") {
      const req = data as ManageStudentsRequest;
      if (!req.action) throw new Error("Action is required for POST requests");
      if (req.action === "create" && (!req.usn || !req.name || !req.email || !req.semester_id || !req.section_id || !req.batch_id)) {
        throw new Error("USN, Name, Email, Semester ID, Section ID, and Batch ID are required for create action");
      }
      if (req.action === "update" && (!req.student_id || !req.name || !req.email || !req.semester_id || !req.section_id)) {
        throw new Error("Student ID, Name, Email, Semester ID, and Section ID are required for update action");
      }
      if (req.action === "delete" && !req.student_id) {
        throw new Error("Student ID is required for delete action");
      }
      if (req.action === "bulk_update") {
        if (!req.semester_id || !req.section_id) {
          throw new Error("Semester ID and Section ID are required for bulk_update action");
        }
        if (!req.bulk_data || !Array.isArray(req.bulk_data) || req.bulk_data.length === 0) {
          throw new Error("Bulk data must be a non-empty array for bulk_update action");
        }
        for (const entry of req.bulk_data) {
          if (!entry.usn || !entry.name || !entry.email || !entry.batch_id) {
            throw new Error("Each bulk data entry must include USN, Name, Email, and Batch ID");
          }
        }
      }
      if (req.action === "register_subjects" && (!req.student_id || !req.subject_ids || !Array.isArray(req.subject_ids))) {
        throw new Error("Student ID and subject IDs array are required for register_subjects action");
      }
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

// Timetable bootstrap (profile + branches + semesters + sections + subjects + faculties)
export const getHODTimetableBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: { branch_id: string };
    branches: Array<{ id: string; name: string }>;
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string | null }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string | null }>;
    faculties: Array<{ id: string; username: string; first_name: string; last_name: string | null }>;
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/timetable-bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response) as any;
  }
};
export const manageBatches = async (
  data?: ManageBatchesRequest,
  batch_id?: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<ManageBatchesResponse> => {
  try {
    const url = batch_id
      ? `${API_BASE_URL}/hod/batches/${batch_id}/`
      : `${API_BASE_URL}/hod/batches/`;
    if (method === "POST" || method === "PUT") {
      if (!data?.start_year || !data?.end_year) {
        throw new Error("Start year and end year are required for POST/PUT requests");
      }
    }
    if (method === "DELETE" && !batch_id) {
      throw new Error("Batch ID is required for DELETE request");
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,

    });
    const result = await response.json();
    if (!response.ok) {
      console.error("Manage Batches Failed:", { status: response.status, result });
      return { success: false, message: result.message || `HTTP ${response.status}` };
    }
    return result;
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getStudentPerformance = async (
  data: { branch_id: string; semester_id?: string; section_id?: string }
): Promise<{ success: boolean; data?: StudentPerformance[]; message?: string }> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID is required");
    const params = new URLSearchParams({ branch_id: data.branch_id });
    if (data.semester_id) params.append("semester_id", data.semester_id);
    if (data.section_id) params.append("section_id", data.section_id);
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/performance/?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

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
    if (!data.branch_id) throw new Error("Branch ID is required");
    const url = `${API_BASE_URL}/hod/faculties/?branch_id=${data.branch_id}`;
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getProctors = async (branch_id: string): Promise<GetFacultiesResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctors/list/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

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
    if (!data.branch_id) throw new Error("Branch ID is required");
    if (method === "POST" && !data.action) {
      throw new Error("Action is required for POST requests");
    }
    if (data.action === "create" && (!data.faculty_id || !data.subject_id || !data.semester_id || !data.section_id)) {
      throw new Error("Faculty ID, Subject ID, Semester ID, and Section ID are required for create action");
    }
    if (data.action === "update" && (!data.assignment_id || !data.faculty_id || !data.subject_id || !data.semester_id || !data.section_id)) {
      throw new Error("Assignment ID, Faculty ID, Subject ID, Semester ID, and Section ID are required for update action");
    }
    if (data.action === "delete" && !data.assignment_id) {
      throw new Error("Assignment ID is required for delete action");
    }
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

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageTimetable = async (data: ManageTimetableRequest): Promise<ManageTimetableResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID is required");
    if (data.action === "GET") {
      const params = new URLSearchParams({ branch_id: data.branch_id });
      if (data.semester_id) params.append("semester_id", data.semester_id);
      if (data.section_id) params.append("section_id", data.section_id);
      const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/timetable/?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
  
      });
      return await response.json();
    }

    if ((data.action === "create" || data.action === "update") && (!data.semester_id || !data.section_id)) {
      throw new Error("Semester ID and Section ID are required for create/update action");
    }

    const headers: HeadersInit = {};
    let body: FormData | string;

    if (data.action === "bulk_create") {
      if (!data.semester_id || !data.section_id || !data.file) {
        throw new Error("Semester ID, Section ID, and File are required for bulk_create action");
      }
      const formData = new FormData();
      formData.append("action", data.action);
      formData.append("branch_id", data.branch_id);
      formData.append("semester_id", data.semester_id);
      formData.append("section_id", data.section_id);
      if (data.room) formData.append("room", data.room);
      formData.append("file", data.file);
      body = formData;
    } else {
      if (data.action === "create" || data.action === "update") {
        if (!data.assignment_id || !data.day || !data.start_time || !data.end_time) {
          throw new Error("Assignment ID, Day, Start Time, and End Time are required for create/update action");
        }
      }
      if (data.action === "delete" && !data.timetable_id) {
        throw new Error("Timetable ID is required for delete action");
      }
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }

    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/timetable/`, {
      method: "POST",
      headers,
      body,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageHODLeaves = async (
  data: ManageHODLeavesRequest,
  method: "GET" | "POST" = "GET"
): Promise<ManageHODLeavesResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID is required");
    const url = `${API_BASE_URL}/hod/leave-applications/?branch_id=${data.branch_id}`;
    if (method === "POST" && (!data.title || !data.start_date || !data.end_date || !data.reason)) {
      throw new Error("Title, Start Date, End Date, and Reason are required for POST request");
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const manageLeaves = async (
  data: ManageLeavesRequest,
  method: "GET" | "PATCH" = "GET"
): Promise<ManageLeavesResponse> => {
  try {
    if (!data.branch_id) throw new Error("Branch ID is required");
    const url = `${API_BASE_URL}/hod/leaves/?branch_id=${data.branch_id}`;
    if (method === "PATCH" && (!data.action || !data.leave_id || !data.status)) {
      throw new Error("Action, Leave ID, and Status are required for PATCH request");
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify(data) : undefined,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getAttendance = async (params: GetAttendanceParams): Promise<GetAttendanceResponse> => {
  try {
    if (!params.branch_id) throw new Error("Branch ID is required");
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/attendance/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getMarks = async (params: GetMarksParams): Promise<GetMarksResponse> => {
  try {
    if (!params.branch_id) throw new Error("Branch ID is required");
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/marks/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const createAnnouncement = async (data: CreateAnnouncementRequest): Promise<CreateAnnouncementResponse> => {
  try {
    if (!data.branch_id || !data.title || !data.content || !data.target) {
      throw new Error("Branch ID, Title, Content, and Target are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/announcements/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const sendNotification = async (data: SendNotificationRequest): Promise<SendNotificationResponse> => {
  try {
    if (!data.branch_id || !data.title || !data.message) throw new Error("Branch ID, Title, and Message are required");
    if (data.action === "notify" && !data.student_id) throw new Error("Student ID is required for notify action");
    if (data.action === "notify_all" && !data.target) throw new Error("Target is required for notify_all action");
    if (data.action === "notify_low_attendance" && (!data.semester_id || !data.section_id || !data.subject_id || !data.threshold)) {
      throw new Error("Semester ID, Section ID, Subject ID, and Threshold are required for notify_low_attendance action");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/notifications/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getNotifications = async (branch_id: string): Promise<GetNotificationsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/notifications/history/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getSentNotifications = async (branch_id: string): Promise<GetNotificationsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/notifications/sent/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const assignProctor = async (data: AssignProctorRequest): Promise<AssignProctorResponse> => {
  try {
    if (!data.branch_id || !data.student_id || !data.faculty_id) {
      throw new Error("Branch ID, Student ID, and Faculty ID are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctors/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const assignProctorsBulk = async (data: AssignProctorsBulkRequest): Promise<AssignProctorsBulkResponse> => {
  try {
    if (!data.branch_id || !data.usns.length || !data.faculty_id) {
      throw new Error("Branch ID, USNs, and Faculty ID are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/proctors/bulk/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

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
    if (!data.branch_id) throw new Error("Branch ID is required");
    const url = `${API_BASE_URL}/hod/chat/?branch_id=${data.branch_id}`;
    if (method === "POST") {
      if (!data.action) throw new Error("Action is required for POST requests");
      if (data.action === "create_channel" && (!data.name || !data.channel_type)) {
        throw new Error("Name and Channel Type are required for create_channel action");
      }
      if (data.action === "send_message" && (!data.channel_id || !data.content)) {
        throw new Error("Channel ID and Content are required for send_message action");
      }
    }
    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "POST" ? JSON.stringify(data) : undefined,

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

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const uploadStudyMaterial = async (data: UploadStudyMaterialRequest): Promise<UploadStudyMaterialResponse> => {
  try {
    if (!data.branch_id || !data.semester_id || !data.title || !data.file) {
      throw new Error("Branch ID, Semester ID, Title, and File are required");
    }
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("subject_name", data.subject_name || "");
    formData.append("subject_code", data.subject_code || "");
    formData.append("semester_id", data.semester_id);
    formData.append("branch_id", data.branch_id);
    formData.append("file", data.file);
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/study-materials/`, {
      method: "POST",
      body: formData,

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getStudyMaterials = async (branch_id: string): Promise<GetStudyMaterialsResponse> => {
  try {
    if (!branch_id) throw new Error("Branch ID is required");
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/study-materials/?branch_id=${branch_id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const promoteStudentsToNextSemester = async (data: PromoteStudentsRequest): Promise<PromoteStudentsResponse> => {
  try {
    if (!data.branch_id || !data.from_semester_id || !data.to_semester_id) {
      throw new Error("Branch ID, From Semester ID, and To Semester ID are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/promote-students/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const promoteSelectedStudents = async (data: PromoteSelectedStudentsRequest): Promise<PromoteSelectedStudentsResponse> => {
  try {
    if (!data.branch_id || !data.student_ids?.length || !data.to_semester_id) {
      throw new Error("Branch ID, non-empty Student IDs, and To Semester ID are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/promote-selected-students/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const demoteStudent = async (data: DemoteStudentRequest): Promise<DemoteStudentResponse> => {
  try {
    if (!data.branch_id || !data.student_id || !data.to_semester_id || !data.reason) {
      throw new Error("Branch ID, Student ID, To Semester ID, and Reason are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/demote-student/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const bulkDemoteStudents = async (data: BulkDemoteStudentsRequest): Promise<BulkDemoteStudentsResponse> => {
  try {
    if (!data.branch_id || !data.student_ids?.length || !data.to_semester_id || !data.reason) {
      throw new Error("Branch ID, non-empty Student IDs, To Semester ID, and Reason are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/demote-students/bulk/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getPromotionEligibility = async (params: GetPromotionEligibilityParams): Promise<GetPromotionEligibilityResponse> => {
  try {
    if (!params.branch_id || !params.semester_id) {
      throw new Error("Branch ID and Semester ID are required");
    }
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/promotion-eligibility/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getExamFailures = async (params: GetExamFailuresParams): Promise<GetExamFailuresResponse> => {
  try {
    if (!params.branch_id) throw new Error("Branch ID is required");
    const query = new URLSearchParams(params as any).toString();
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/exam-failures/?${query}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const recordExamFailure = async (data: RecordExamFailureRequest): Promise<RecordExamFailureResponse> => {
  try {
    if (!data.branch_id || !data.student_id || !data.subject_id || !data.semester_id || !data.failure_date) {
      throw new Error("Branch ID, Student ID, Subject ID, Semester ID, and Failure Date are required");
    }
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/record-exam-failure/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),

    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

// New combined bootstrap endpoints
export const getFacultyAssignmentsBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: {
      first_name: string;
      last_name: string;
      email: string;
      branch: string;
      branch_id: string;
    };
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string | null }>;
    subjects: Array<{ id: string; name: string; subject_code: string; semester_id: string | null }>;
    faculties: Array<{ id: string; username: string; first_name: string; last_name: string }>;
    assignments: Array<{
      id: string;
      faculty: string;
      subject: string;
      section: string;
      semester: number;
      faculty_id: string;
      subject_id: string;
      section_id: string;
      semester_id: string;
    }>;
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/faculty-assignments-bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getNotificationsBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: {
      first_name: string;
      last_name: string;
      email: string;
      branch: string;
      branch_id: string;
    };
    received_notifications: Array<{
      id: string;
      title: string;
      message: string;
      notification_type: string;
      priority: string;
      created_at: string;
      read: boolean;
    }>;
    sent_notifications: Array<{
      id: string;
      title: string;
      message: string;
      notification_type: string;
      priority: string;
      created_at: string;
      recipient_count: number;
    }>;
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/notifications-bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};

export const getPromotionBootstrap = async (): Promise<{
  success: boolean;
  message?: string;
  data?: {
    profile: {
      first_name: string;
      last_name: string;
      email: string;
      branch: string;
      branch_id: string;
    };
    semesters: Array<{ id: string; number: number }>;
    sections: Array<{ id: string; name: string; semester_id: string | null }>;
    students: Array<{
      usn: string;
      name: string;
      semester: string;
      section: string;
    }>;
    eligibility: Array<{
      semester_id: string;
      semester_number: number;
      eligible_count: number;
      students: Array<{
        student_id: string;
        usn: string;
        name: string;
        is_eligible: boolean;
        failed_subjects: string[];
        attendance_percentage: number;
      }>;
    }>;
  };
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/hod/promotion-bootstrap/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return await response.json();
  } catch (error: unknown) {
    return handleApiError(error, (error as any).response);
  }
};