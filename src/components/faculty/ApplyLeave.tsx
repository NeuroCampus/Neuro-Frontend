import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import { PopoverTrigger, Popover, PopoverContent } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { applyLeave, getApplyLeaveBootstrap } from '../../utils/faculty_api';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { Circle, CalendarCheck2, CalendarX2, Filter } from 'lucide-react';

const MySwal = withReactContent(Swal);

const statusStyles = {
  Pending: 'text-yellow-700 bg-yellow-100',
  Approved: 'text-green-700 bg-green-100',
  Rejected: 'text-red-700 bg-red-100',
};

// Interface to match the original mock data structure
interface LeaveRequestDisplay {
  id: string;
  title: string;
  from?: string;
  to?: string;
  date?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
}

const LeaveRequests = () => {
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState('');
  const [leaveList, setLeaveList] = useState<LeaveRequestDisplay[]>([]);
  const [filteredLeaveList, setFilteredLeaveList] = useState<LeaveRequestDisplay[]>([]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const today = new Date();

  // Fetch branches and leave history on mount
  useEffect(() => {
    setLoading(true);
    getApplyLeaveBootstrap()
      .then((res) => {
        if (res.success && res.data) {
          const { assignments, leave_requests, branches } = res.data;

          // Set branches from the combined response
          setBranches(branches);
          if (branches.length > 0) setSelectedBranch(branches[0].id.toString());

          // Transform backend data to match original mock structure
          const transformedLeaves: LeaveRequestDisplay[] = leave_requests.map((leave, index) => {
            console.log('Original status from backend:', leave.status);
            const mappedStatus = (leave.status === 'PENDING' ? 'Pending' :
                                leave.status === 'APPROVED' ? 'Approved' :
                                leave.status === 'REJECTED' ? 'Rejected' : 'Pending') as 'Pending' | 'Approved' | 'Rejected';
            console.log('Mapped status:', mappedStatus);

            return {
              id: leave.id,
              title: `Leave Request ${index + 1}`,
              from: leave.start_date,
              to: leave.end_date,
              reason: leave.reason,
              status: mappedStatus,
              appliedOn: leave.applied_on,
            };
          });
          setLeaveList(transformedLeaves);
        } else {
          setError(res.message || 'Failed to load data');
        }
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  // Update filtered leave list when leave list or filter changes
  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredLeaveList(leaveList);
    } else {
      setFilteredLeaveList(leaveList.filter(leave => leave.status === filterStatus));
    }
  }, [leaveList, filterStatus]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBranch || !dateRange?.from || !dateRange?.to || !reason.trim()) {
      setError("Please provide a valid branch, date range and reason.");
      return;
    }

    setError(null);

    const requestData = {
      branch_ids: [parseInt(selectedBranch)],
      start_date: format(dateRange.from, "yyyy-MM-dd"),
      end_date: format(dateRange.to, "yyyy-MM-dd"),
      reason: reason.trim(),
    };

    console.log("Submitting leave request with data:", requestData); // Debug log

    try {
      setSubmitting(true);
      const res = await applyLeave(requestData);
      
      if (res.success) {
        // Show success alert with theme-aware styling
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        
        await MySwal.fire({
          title: 'Leave Request Submitted!',
          text: 'Your leave request has been successfully submitted.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: currentTheme === 'dark' ? '#a259ff' : '#3b82f6',
          background: currentTheme === 'dark' ? '#1c1c1e' : '#ffffff',
          color: currentTheme === 'dark' ? '#ffffff' : '#000000',
        });
        
        // Reset form
        setDateRange(undefined);
        setReason("");

        // Optimistically update the leave list instead of making another API call
        const selectedBranchName = branches.find(b => b.id.toString() === selectedBranch)?.name || 'Unknown Branch';
        const newLeave: LeaveRequestDisplay = {
          id: `temp-${Date.now()}`, // Temporary ID
          title: `Leave Request ${leaveList.length + 1}`,
          from: format(dateRange.from, "yyyy-MM-dd"),
          to: format(dateRange.to, "yyyy-MM-dd"),
          reason: reason.trim(),
          status: 'Pending',
          appliedOn: new Date().toLocaleString(),
        };
        setLeaveList(prev => [newLeave, ...prev]);
      } else {
        throw new Error(res.message || 'Failed to apply for leave');
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      setError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      
      // Show error alert with theme-aware styling
      const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      
      await MySwal.fire({
        title: 'Error!',
        text: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: currentTheme === 'dark' ? '#a259ff' : '#3b82f6',
        background: currentTheme === 'dark' ? '#1c1c1e' : '#ffffff',
        color: currentTheme === 'dark' ? '#ffffff' : '#000000',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = (status: 'Pending' | 'Approved' | 'Rejected') => {
    console.log('Rendering status:', status);
    const baseClass = 'flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium';
    switch (status) {
      case 'Pending':
        return (
          <div className={`${baseClass} ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-500' : 'bg-yellow-100 text-yellow-800'}`}>
            <Circle className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-500'}`} fill="currentColor" />
            Pending
          </div>
        );
      case 'Approved':
        return (
          <div className={`${baseClass} ${theme === 'dark' ? 'bg-green-900/30 text-green-500' : 'bg-green-100 text-green-700'}`}>
            <CalendarCheck2 className={`w-4 h-4 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`} />
            Approved
          </div>
        );
      case 'Rejected':
        return (
          <div className={`${baseClass} ${theme === 'dark' ? 'bg-red-900/30 text-red-500' : 'bg-red-100 text-red-700'}`}>
            <CalendarX2 className={`w-4 h-4 ${theme === 'dark' ? 'text-red-500' : 'text-red-600'}`} />
            Rejected
          </div>
        );
      default:
        console.log('Unknown status:', status);
        return (
          <div className={`${baseClass} ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
            <Circle className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`} fill="currentColor" />
            {status || 'Unknown'}
          </div>
        );
    }
  };

  return (
    <div className={`p-6 h-full ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      {/* Apply Leave Form */}
      <Card className={theme === 'dark' ? 'max-w-2xl justify-self-center w-full bg-card text-card-foreground mb-6' : 'max-w-2xl justify-self-center w-full bg-white text-gray-900 mb-6'}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>Apply for Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                {error}
              </div>
            )}
            
            {/* Branch Selection */}
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger 
                  className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                >
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}>
                  {branches.map((b) => (
                    <SelectItem 
                      key={b.id} 
                      value={b.id.toString()} 
                      className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}
                    >
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={theme === 'dark' ? 'w-full justify-start text-left font-normal bg-background text-foreground border-border hover:bg-accent hover:text-foreground' : 'w-full justify-start text-left font-normal bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900'}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                        </>
                      ) : (
                        format(dateRange.from, "PPP")
                      )
                    ) : (
                      <span className={theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>

                {/* Calendar with theme support */}
                <PopoverContent className={theme === 'dark' ? 'w-auto p-0 bg-background text-foreground border-border shadow-lg' : 'w-auto p-0 bg-white text-gray-900 border-gray-200 shadow-lg'}>
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    disabled={(date) => date < today} // Disable dates before today
                    initialFocus
                    className={theme === 'dark' ? 'rounded-md bg-background text-foreground [&_.rdp-day:hover]:bg-accent [&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground [&_.rdp-day_disabled]:opacity-50 [&_.rdp-day_disabled]:cursor-not-allowed' : 'rounded-md bg-white text-gray-900 [&_.rdp-day:hover]:bg-gray-100 [&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_disabled]:opacity-50 [&_.rdp-day_disabled]:cursor-not-allowed'}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason" className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for your leave request"
                className={theme === 'dark' ? 'min-h-[100px] bg-background text-foreground border-border' : 'min-h-[100px] bg-white text-gray-900 border-gray-300'}
                required
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className={theme === 'dark' ? 'w-full text-foreground bg-muted hover:bg-accent border-border' : 'w-full text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'} 
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Leave Requests List */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Leave Requests</h2>
        <div className="flex gap-2">
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md text-sm font-medium"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-48 p-4 ${theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}`}>
              <div className="flex flex-col gap-2">
                <h4 className={`text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Filter by Status</h4>
                <Button
                  variant={filterStatus === "All" ? "default" : "outline"}
                  size="sm"
                  className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => {
                    setFilterStatus("All");
                    setFilterOpen(false);
                  }}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "Pending" ? "default" : "outline"}
                  size="sm"
                  className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => {
                    setFilterStatus("Pending");
                    setFilterOpen(false);
                  }}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "Approved" ? "default" : "outline"}
                  size="sm"
                  className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => {
                    setFilterStatus("Approved");
                    setFilterOpen(false);
                  }}
                >
                  Approved
                </Button>
                <Button
                  variant={filterStatus === "Rejected" ? "default" : "outline"}
                  size="sm"
                  className={`${theme === 'dark' ? 'text-foreground bg-card border-border hover:bg-accent' : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-100'}`}
                  onClick={() => {
                    setFilterStatus("Rejected");
                    setFilterOpen(false);
                  }}
                >
                  Rejected
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {loading ? (
        <div className={`text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Loading...</div>
      ) : filteredLeaveList.length === 0 ? (
        <div className={`text-center ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
          {filterStatus === 'All' ? 'No leave requests found.' : `No ${filterStatus.toLowerCase()} leave requests found.`}
        </div>
      ) : (
        <div className="max-h-[520px] overflow-y-auto custom-scrollbar">
          {filteredLeaveList.map((leave) => {
            console.log('Rendering leave card with status:', leave.status);
            return (
              <Card key={leave.id} className={`mb-4 ${theme === 'dark' ? 'bg-card text-foreground' : 'bg-white text-gray-900'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-lg font-semibold mb-2">{leave.title}</div>
                      <div className={`text-sm mb-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                        {leave.from && leave.to ? (
                          <>
                            From: {leave.from} To: {leave.to}
                          </>
                        ) : (
                          <>Date: {leave.date}</>
                        )}
                      </div>
                      <div className={`text-sm mb-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>{leave.reason}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>Applied on: {leave.appliedOn}</div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {renderStatus(leave.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;