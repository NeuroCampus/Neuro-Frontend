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
import { submitLeaveRequest } from "../../utils/student_api";
import { useTheme } from "@/context/ThemeContext";

const SubmitLeaveRequest = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dateRange?.from || !dateRange?.to || !reason.trim()) {
      alert("Please provide a valid date range and reason.");
      return;
    }

    setLoading(true);

    const requestData = {
      start_date: format(dateRange.from, "yyyy-MM-dd"),
      end_date: format(dateRange.to, "yyyy-MM-dd"),
      reason: reason.trim(),
    };

    try {
      const response = await submitLeaveRequest(requestData);
      
      if (response.success) {
        setSuccess(true);
        setDateRange(undefined);
        setReason("");
        alert("Leave request submitted successfully!");
      } else {
        throw new Error(response.message || "Failed to submit leave request.");
      }
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      alert(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={theme === 'dark' ? 'max-w-2xl justify-self-center w-full bg-[#1c1c1e] text-gray-200' : 'max-w-2xl justify-self-center w-full bg-white text-gray-900'}>
      <CardHeader>
        <CardTitle className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Submit Leave Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
          <Label className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={theme === 'dark' ? 'w-full justify-start text-left font-normal bg-[#232326] text-gray-200 border-gray-700 hover:bg-[#2c2c2f] hover:text-gray-200' : 'w-full justify-start text-left font-normal bg-white text-gray-900 border-gray-300 hover:bg-gray-100 hover:text-gray-900'}
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
                  <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>

            {/* Calendar with theme support */}
            <PopoverContent className={theme === 'dark' ? 'w-auto p-0 bg-[#1c1c1e] text-gray-200 border-gray-700 shadow-lg' : 'w-auto p-0 bg-white text-gray-900 border-gray-200 shadow-lg'}>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
                className={theme === 'dark' ? 'rounded-md bg-[#1c1c1e] text-gray-200 [&_.rdp-day:hover]:bg-[#2c2c2f] [&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white' : 'rounded-md bg-white text-gray-900 [&_.rdp-day:hover]:bg-gray-100 [&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white'}
              />
            </PopoverContent>
          </Popover>
        </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide a detailed reason for your leave request"
              className={theme === 'dark' ? 'min-h-[100px] bg-[#232326] text-gray-200 border-gray-700' : 'min-h-[100px] bg-white text-gray-900 border-gray-300'}
              required
            />
          </div>

          <Button 
            type="submit" 
            className={theme === 'dark' ? 'w-full text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'w-full text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'} 
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>

          {success && (
            <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              Leave request submitted successfully!
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default SubmitLeaveRequest;