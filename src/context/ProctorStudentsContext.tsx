import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProctorStudents, ProctorStudent } from '../utils/faculty_api';

interface ProctorStudentsContextType {
  proctorStudents: ProctorStudent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isLoaded: boolean;
}

const ProctorStudentsContext = createContext<ProctorStudentsContextType | undefined>(undefined);

interface ProctorStudentsProviderProps {
  children: ReactNode;
}

export const ProctorStudentsProvider: React.FC<ProctorStudentsProviderProps> = ({ children }) => {
  const [proctorStudents, setProctorStudents] = useState<ProctorStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchProctorStudents = async () => {
    if (isLoaded) return; // Don't fetch if already loaded

    setLoading(true);
    setError(null);

    try {
      const response = await getProctorStudents();
      if (response.success && response.data) {
        setProctorStudents(response.data);
        setIsLoaded(true);
      } else {
        setError(response.message || 'Failed to fetch proctor students');
      }
    } catch (err) {
      setError('Network error while fetching proctor students');
      console.error('Proctor students fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setIsLoaded(false); // Reset loaded state to force refetch
    await fetchProctorStudents();
  };

  useEffect(() => {
    fetchProctorStudents();
  }, []);

  const value: ProctorStudentsContextType = {
    proctorStudents,
    loading,
    error,
    refetch,
    isLoaded,
  };

  return (
    <ProctorStudentsContext.Provider value={value}>
      {children}
    </ProctorStudentsContext.Provider>
  );
};

export const useProctorStudents = (): ProctorStudentsContextType => {
  const context = useContext(ProctorStudentsContext);
  if (context === undefined) {
    throw new Error('useProctorStudents must be used within a ProctorStudentsProvider');
  }
  return context;
};