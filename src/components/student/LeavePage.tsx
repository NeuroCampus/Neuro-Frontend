import React, { Suspense } from "react";
import SubmitLeaveRequest from "./SubmitLeaveRequest";
import LeaveStatus from "./LeaveStatus";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface LeavePageProps {
  setPage?: (page: string) => void;
}

const LeavePage: React.FC<LeavePageProps> = ({ setPage }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${theme === 'dark' ? 'bg-card' : 'bg-white'} shadow-sm`}> 
            <FileText className={`h-6 w-6 ${theme === 'dark' ? 'text-card-foreground' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Leaves</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Submit requests and track status in one place</p>
          </div>
        </div>
        <Badge className="hidden md:inline-flex">Manage</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <Card className={`${theme === 'dark' ? 'bg-card' : 'bg-white'} shadow`}> 
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>Apply for Leave</CardTitle>
            </CardHeader>
            <CardContent>
              <SubmitLeaveRequest />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card className={`${theme === 'dark' ? 'bg-card' : 'bg-white'} shadow`}> 
            <CardHeader>
              <CardTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>Your Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveStatus setPage={(p: string) => setPage && setPage(p)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LeavePage;
