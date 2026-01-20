import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { CalendarDays, FileDown } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { getTimetable, type TimetableEntry } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const StudentTimetable = () => {
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const { theme } = useTheme();
  const tableRef = useRef<HTMLTableElement>(null);

  // Predefined time slots for the grid (9:00 AM to 5:00 PM)
  const timeSlots = [
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
  ];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

  useEffect(() => {
    const fetchTimetable = async () => {
      const data = await getTimetable();
      if (data.success && Array.isArray(data.data)) {
        setTimetableData(data.data);
      }
    };
    fetchTimetable();
  }, []);

  // Generate table data for the grid
  const getTableData = () => {
    const timetable = Array.isArray(timetableData) ? timetableData : [];
    const tableData = timeSlots.map(({ start, end }) => {
      const row: Record<string, string> = { time: `${start}-${end}` };
      days.forEach((day) => {
        const entry = timetable.find(
          (e) => e.start_time === start && e.end_time === end && e.day === day
        );
        row[day.toLowerCase()] = entry
          ? `${entry.subject?.name || entry.subject}\n${entry.room}`
          : "";
      });
      return row;
    });
    return tableData;
  };

  const exportToPDF = async () => {
    if (!tableRef.current) return;

    try {
      const canvas = await html2canvas(tableRef.current, {
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        scale: 2,
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save('timetable.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Card className={theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>Timetable</CardTitle>
        <div className="flex gap-2 ">
          <Button 
            variant="outline" 
            size="sm" 
            className={theme === 'dark' ? 'text-card-foreground bg-muted hover:bg-accent border-border' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'}
            onClick={exportToPDF}
          >
            <FileDown className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
              <CalendarDays className="w-5 h-5" /> Timetable
            </h2>
          </div>

          <ScrollArea className="w-full overflow-auto">
            <table ref={tableRef} className="min-w-full text-sm text-left">
              <thead className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>
                <tr>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Time/Day</th>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Monday</th>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Tuesday</th>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Wednesday</th>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Thursday</th>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Friday</th>
                  <th className={`py-2 px-4 font-semibold ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Saturday</th>
                </tr>
              </thead>
              <tbody>
                {getTableData().map((row, idx) => (
                  <tr key={idx} className={theme === 'dark' ? 'border-t border-border hover:bg-accent' : 'border-t border-gray-200 hover:bg-gray-50'}>
                    <td className={`py-3 px-4 font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>{row.time}</td>
                    {["mon", "tue", "wed", "thu", "fri", "sat"].map((day, i) => (
                      <td
                        key={i}
                        className={`py-3 px-4 whitespace-pre-line ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}
                      >
                        {row[day] ? (
                          <>
                            <span className="font-semibold">{row[day].split("\n")[0]}</span>
                            <br />
                            {row[day].split("\n")[1]}
                          </>
                        ) : (
                          ""
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentTimetable;