import { API_ENDPOINT } from "./config";
import { fetchWithTokenRefresh } from "./authService";

interface Hostel {
  id: number;
  name: string;
  address: string;
  capacity: number;
  warden?: number;
}

interface HostelRoom {
  id: number;
  hostel: number;
  room_number: string;
  capacity: number;
  occupied: number;
  room_type: 'S' | 'D' | 'P' | 'B';
}

interface HostelStudent {
  id: number;
  user: number;
  name: string;
  usn: string;
  hostel: number;
  room: number;
  course: string;
  admission_date: string;
  room_number?: string;
  hostel_name?: string;
}

interface HostelWarden {
  id: number;
  user: number;
  name: string;
  hostel: number;
  hostel_name?: string;
}

interface HostelCourse {
  id: number;
  code: string;
  room_type: 'S' | 'D' | 'P' | 'B';
}

interface HMSResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  results?: T[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

// Generic HMS API function
const hmsApiCall = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any
): Promise<HMSResponse<T>> => {
  try {
    const url = `${API_ENDPOINT}/hms/${endpoint}`;

    const response = await fetchWithTokenRefresh(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();
    if (!response.ok) {
      console.error(`HMS API ${method} ${endpoint} Failed:`, { status: response.status, result });
      
      // Extract error message from different formats
      let errorMessage = `HTTP ${response.status}`;
      
      if (result.detail) {
        errorMessage = result.detail;
      } else if (result.message) {
        errorMessage = result.message;
      } else if (typeof result === 'object') {
        // Handle Django REST Framework validation errors
        // Format: { "field_name": ["error message"], "non_field_errors": ["error message"] }
        const errorEntries = Object.entries(result);
        if (errorEntries.length > 0) {
          const firstError = errorEntries[0];
          if (Array.isArray(firstError[1])) {
            errorMessage = (firstError[1] as string[])[0];
          } else if (typeof firstError[1] === 'string') {
            errorMessage = firstError[1];
          }
        }
      }
      
      return { success: false, message: errorMessage };
    }

    // Handle different response formats
    if (method === "DELETE") {
      return { success: true };
    } else if (method === "GET" && Array.isArray(result)) {
      // List response (array)
      return { success: true, results: result, count: result.length };
    } else if (method === "GET" && result.results !== undefined) {
      // Paginated response with results field
      return {
        success: true,
        results: result.results,
        count: result.count,
        next: result.next,
        previous: result.previous,
      };
    } else {
      // Single object response
      return { success: true, data: result };
    }
  } catch (error) {
    console.error(`HMS API ${method} ${endpoint} Error:`, error);
    return { success: false, message: "Network error" };
  }
};

// Hostel Management
export const manageHostels = async (
  data?: Partial<Hostel>,
  hostelId?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<HMSResponse<Hostel>> => {
  const endpoint = hostelId ? `hostels/${hostelId}/` : "hostels/";
  return hmsApiCall<Hostel>(endpoint, method, data);
};

// Room Management
export const manageRooms = async (
  data?: Partial<HostelRoom>,
  roomId?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  params?: Record<string, any>
): Promise<HMSResponse<HostelRoom>> => {
  let endpoint = roomId ? `rooms/${roomId}/` : "rooms/";

  // Add query parameters for GET requests
  if (method === "GET" && params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
  }

  return hmsApiCall<HostelRoom>(endpoint, method, data);
};

// Fetch rooms by hostel (new dedicated endpoint)
export const getRoomsByHostel = async (hostelId: number): Promise<HMSResponse<HostelRoom>> => {
  const endpoint = `rooms/by_hostel/?hostel_id=${hostelId}`;
  return hmsApiCall<HostelRoom>(endpoint, 'GET');
};

// Student Management
export const manageHostelStudents = async (
  data?: Partial<HostelStudent>,
  studentId?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  params?: Record<string, any>
): Promise<HMSResponse<HostelStudent>> => {
  let endpoint = studentId ? `students/${studentId}/` : "students/";

  // Add query parameters for GET requests
  if (method === "GET" && params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
  }

  return hmsApiCall<HostelStudent>(endpoint, method, data);
};

// Warden Management
export const manageWardens = async (
  data?: Partial<HostelWarden>,
  wardenId?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<HMSResponse<HostelWarden>> => {
  const endpoint = wardenId ? `wardens/${wardenId}/` : "wardens/";
  return hmsApiCall<HostelWarden>(endpoint, method, data);
};

// Caretaker Management
export const manageCaretakers = async (
  data?: any,
  caretakerId?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<HMSResponse<any>> => {
  const endpoint = caretakerId ? `caretakers/${caretakerId}/` : "caretakers/";
  return hmsApiCall<any>(endpoint, method, data);
};

// Dashboard Stats - Single endpoint for all dashboard data
export const getDashboardStats = async (): Promise<HMSResponse<any>> => {
  return hmsApiCall<any>("dashboard/stats/", "GET");
};

// Get rooms for a specific hostel
export const getRoomsByHostelId = async (hostelId: number): Promise<HMSResponse<any>> => {
  return hmsApiCall<any>(`hostels/${hostelId}/rooms/`, "GET");
};

// Get staff enrollment data (wardens and caretakers)
export const getStaffEnrollment = async (): Promise<HMSResponse<any>> => {
  return hmsApiCall<any>("staff/enrollment/", "GET");
};

// Course Management
export const manageCourses = async (
  data?: Partial<HostelCourse>,
  courseId?: number,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET"
): Promise<HMSResponse<HostelCourse>> => {
  const endpoint = courseId ? `courses/${courseId}/` : "courses/";
  return hmsApiCall<HostelCourse>(endpoint, method, data);
};