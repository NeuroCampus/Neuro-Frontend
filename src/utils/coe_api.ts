import { API_ENDPOINT } from "./config";
import { fetchWithTokenRefresh } from "./authService";

// Type definitions for COE API responses

export interface DashboardStats {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
  total_students: number;
  upcoming_exams: number;
  recent_activity: Array<{
    description: string;
    timestamp: string;
    type: string;
    status: string;
  }>;
}

export interface DashboardStatsResponse {
  success: boolean;
  message?: string;
  data?: DashboardStats;
}

export interface StudentApplicationStatus {
  student_id: number;
  student_name: string;
  roll_number: string;
  status: 'applied' | 'not_applied';
  applied_subjects: string[];
  applied_count: number;
}

export interface StudentStatusSummary {
  total_students: number;
  applied_students: number;
  not_applied_students: number;
  application_rate: number;
}

export interface StudentApplicationStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    students: StudentApplicationStatus[];
    summary: StudentStatusSummary;
    filters: {
      batch: string;
      exam_period: string;
      branch: string;
      semester: string;
    };
  };
}

export interface CourseApplicationStats {
  subject_id: number;
  subject_name: string;
  subject_code: string;
  faculty_name: string;
  applied_students: number;
  total_students: number;
  application_rate: number;
}

export interface CourseStatsSummary {
  total_courses: number;
  total_applications: number;
  average_application_rate: number;
}

export interface CourseApplicationStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    courses: CourseApplicationStats[];
    summary: CourseStatsSummary;
    filters: {
      batch: string;
      branch: string;
      semester: string;
    };
  };
}

export interface Batch {
  id: number;
  name: string;
}

export interface Branch {
  id: number;
  name: string;
}

export interface Semester {
  id: number;
  number: number;
}

export interface FilterOptions {
  batches: Batch[];
  branches: Branch[];
  semesters: Semester[];
}

export interface FilterOptionsResponse {
  success: boolean;
  message?: string;
  data?: any[];
}

// API Functions

/**
 * Fetch COE dashboard statistics
 */
export const getCOEDashboardStats = async (): Promise<DashboardStatsResponse> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/dashboard-stats/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching COE dashboard stats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fetch student application status with filters
 */
export const getStudentApplicationStatus = async (filters: {
  batch: string;
  exam_period: string;
  branch: string;
  semester: string;
}): Promise<StudentApplicationStatusResponse> => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-applications/students/?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching student application status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fetch course application statistics with filters
 */
export const getCourseApplicationStats = async (filters: {
  batch: string;
  branch: string;
  semester: string;
}): Promise<CourseApplicationStatsResponse> => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-applications/courses/?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching course application stats:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Fetch filter options (batches, branches, semesters)
 */
export const getFilterOptions = async (): Promise<{
  batches: Batch[];
  branches: Branch[];
  semesters: Semester[];
}> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/filter-options/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch filter options');
    }
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      batches: [],
      branches: [],
      semesters: []
    };
  }
};