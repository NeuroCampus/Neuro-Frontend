import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import { PopoverTrigger, Popover, PopoverContent } from "../ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useStudentLeaveRequestMutation } from "@/hooks/useApiQueries";
import { useTheme } from "@/context/ThemeContext";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const SubmitLeaveRequest = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const leaveRequestMutation = useStudentLeaveRequestMutation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dateRange?.from || !dateRange?.to || !reason.trim()) {
      setError("Please provide a valid date range and reason.");
      return;
    }

    setError(null);

    const requestData = {
      start_date: format(dateRange.from, "yyyy-MM-dd"),
      end_date: format(dateRange.to, "yyyy-MM-dd"),
      reason: reason.trim(),
    };

    console.log("Submitting leave request with data:", requestData); // Debug log

    try {
      await leaveRequestMutation.mutateAsync(requestData);
      
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
    }
  };

  return (
    <Card className={theme === 'dark' ? 'max-w-2xl justify-self-center w-full bg-card text-card-foreground' : 'max-w-2xl justify-self-center w-full bg-white text-gray-900'}>
      <CardHeader>
        <CardTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>Submit Leave Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-destructive/20 text-destructive-foreground border border-destructive' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              {error}
            </div>
          )}
          
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
                initialFocus
                className={theme === 'dark' ? 'rounded-md bg-background text-foreground [&_.rdp-day:hover]:bg-accent [&_.rdp-day_selected]:bg-primary [&_.rdp-day_selected]:text-primary-foreground' : 'rounded-md bg-white text-gray-900 [&_.rdp-day:hover]:bg-gray-100 [&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white'}
              />
            </PopoverContent>
          </Popover>
        </div>
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

          <Button 
            type="submit" 
            className={theme === 'dark' ? 'w-full text-foreground bg-muted hover:bg-accent border-border' : 'w-full text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'} 
            disabled={leaveRequestMutation.isPending}
          >
            {leaveRequestMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SubmitLeaveRequest;