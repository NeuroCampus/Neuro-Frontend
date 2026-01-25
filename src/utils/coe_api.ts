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
    pagination?: {
      count: number;
      next: string | null;
      previous: string | null;
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
  page?: string | number;
  page_size?: string | number;
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

    const result = await response.json();

    // Normalize paginated responses from backend paginator
    if ((result as any).results) {
      const pag = (result as any);
      const payload = pag.results as any;
      return {
        success: payload.success,
        data: {
          students: payload.students,
          summary: payload.summary,
          filters: payload.filters,
          pagination: { count: pag.count, next: pag.next, previous: pag.previous }
        }
      };
    }

    return result;
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
  page?: string | number;
  page_size?: string | number;
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

    const result = await response.json();
    if ((result as any).results) {
      const pag = (result as any);
      const payload = pag.results as any;
      return {
        success: payload.success,
        data: {
          courses: payload.courses,
          summary: payload.summary,
          filters: payload.filters,
          pagination: { count: pag.count, next: pag.next, previous: pag.previous }
        }
      };
    }

    return result;
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

/**
 * Fetch paginated exam applications (COE)
 */
export const getExamApplications = async (paramsObj: {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{ success: boolean; message?: string; data?: { applications: any[]; pagination?: any } }> => {
  try {
    const params = new URLSearchParams();
    Object.entries(paramsObj).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v));
    });

    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/exam-applications/?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();

    // Backend uses paginator: {count,next,previous,results: {success, applications...}}
    if ((result as any).results) {
      const pag = result as any;
      const payload = pag.results as any;
      return {
        success: payload.success,
        data: {
          applications: payload.applications,
          pagination: { count: pag.count, next: pag.next, previous: pag.previous }
        }
      };
    }

    // Fallback
    return result;
  } catch (error) {
    console.error('Error fetching exam applications:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Create result upload batch
export const createResultUploadBatch = async (payload: { batch: string; branch: string; semester: string; exam_period: string }) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/result-upload/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating result upload batch:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getStudentsForUpload = async (uploadId: number, page?: number, page_size?: number) => {
  try {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', String(page));
    if (page_size !== undefined) params.append('page_size', String(page_size));

    const url = `${API_ENDPOINT}/coe/result-upload/${uploadId}/students/` + (params.toString() ? `?${params}` : '');
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if ((result as any).results) {
      const pag = result as any;
      const payload = pag.results as any;
      return {
        success: payload.success,
        data: {
          students: payload.students,
          pagination: { count: pag.count, next: pag.next, previous: pag.previous }
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching students for upload:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const saveMarksForUpload = async (uploadId: number, marks: any[]) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/result-upload/${uploadId}/marks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marks })
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving marks for upload:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const publishUploadBatch = async (uploadId: number) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/result-upload/${uploadId}/publish/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  } catch (error) {
    console.error('Error publishing upload batch:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const unpublishUploadBatch = async (uploadId: number) => {
  try {
    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/result-upload/${uploadId}/unpublish/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  } catch (error) {
    console.error('Error unpublishing upload batch:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Fetch paginated published results with optional filters
 */
export const getPublishedResults = async (filters: {
  upload_id?: string | number;
  batch_id?: string | number;
  branch_id?: string | number;
  semester_id?: string | number;
  student_usn?: string;
  page?: number;
  page_size?: number;
}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null) params.append(k, String(v));
    });

    const response = await fetchWithTokenRefresh(`${API_ENDPOINT}/coe/published-results/?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if ((result as any).results) {
      const pag = result as any;
      const payload = pag.results as any;
      return {
        success: payload.success,
        data: {
          published_results: payload.published_results,
          pagination: { count: pag.count, next: pag.next, previous: pag.previous }
        }
      };
    }

    return result;
  } catch (error) {
    console.error('Error fetching published results:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Public view by token
export const publicViewResultByToken = async (token: string, usn: string) => {
  try {
    const response = await fetch(`${API_ENDPOINT}/results/view/${token}/?usn=${encodeURIComponent(usn)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching public result by token:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
};