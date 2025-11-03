import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Card, CardContent } from '../ui/card';
import { Circle, CalendarCheck2, CalendarX2, Filter } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { applyLeave, getApplyLeaveBootstrap, FacultyLeaveRequest, FacultyAssignment } from '../../utils/faculty_api';
import { useTheme } from "@/context/ThemeContext";

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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveList, setLeaveList] = useState<LeaveRequestDisplay[]>([]);
  const [filteredLeaveList, setFilteredLeaveList] = useState<LeaveRequestDisplay[]>([]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { theme } = useTheme();

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

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (!selectedBranch || !startDate || !endDate || !reason) {
      setError('Please fill all fields.');
      setSubmitting(false);
      return;
    }
    try {
      const res = await applyLeave({
        branch_ids: [parseInt(selectedBranch)],
        start_date: startDate,
        end_date: endDate,
        reason,
      });
      if (res.success) {
        setSuccess('Leave application submitted!');
        setStartDate('');
        setEndDate('');
        setReason('');

        // Optimistically update the leave list instead of making another API call
        const selectedBranchName = branches.find(b => b.id.toString() === selectedBranch)?.name || 'Unknown Branch';
        const newLeave: LeaveRequestDisplay = {
          id: `temp-${Date.now()}`, // Temporary ID
          title: `Leave Request ${leaveList.length + 1}`,
          from: startDate,
          to: endDate,
          reason: reason,
          status: 'Pending',
          appliedOn: new Date().toLocaleString(),
        };
        setLeaveList(prev => [newLeave, ...prev]);
      } else {
        setError(res.message || 'Failed to apply for leave');
      }
    } catch (err) {
      setError('Network error');
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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#a259ff] text-white border-[#a259ff] hover:bg-[#8a4dde] hover:border-[#8a4dde] hover:text-white transition-all duration-200 ease-in-out shadow-md whitespace-nowrap">
                Apply for Leave
              </Button>
            </DialogTrigger>
            <DialogContent className={theme === 'dark' ? 'bg-card text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Leave Application Form</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 mt-4">
                
                {/* Branch */}
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
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

                {/* Start Date */}
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input 
                    type="date" 
                    id="start-date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                  />
                </div>

                {/* End Date */}
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input 
                    type="date" 
                    id="end-date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    className={theme === 'dark' ? 'bg-background border border-input text-foreground' : 'bg-white border border-gray-300 text-gray-900'}
                  />
                </div>

                {/* Reason */}
                <div className="grid gap-2">
                  <Label htmlFor="reason">Reason for Leave</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a detailed reason for your leave request"
                    className={theme === 'dark' ? 'bg-background border border-input text-foreground placeholder:text-muted-foreground' : 'bg-white border border-gray-300 text-gray-900 placeholder:text-gray-500'}
                  />
                </div>

                {/* Messages */}
                {error && <div className={`text-sm ${theme === 'dark' ? 'text-destructive' : 'text-red-600'}`}>{error}</div>}
                {success && <div className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>{success}</div>}

                {/* Submit Button */}
                <Button 
                  onClick={handleSubmit} 
                  className={theme === 'dark' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-blue-600 text-white hover:bg-blue-700'} 
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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