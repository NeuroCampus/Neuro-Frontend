import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { CalendarDays, FileDown } from "lucide-react";
import { getTimetable, type TimetableEntry } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './StudentTimetable.module.css';

const StudentTimetable = () => {
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const { theme } = useTheme();
  const tableRef = useRef<HTMLDivElement>(null);

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
      const row: Record<string, any> = { time: `${start} - ${end}` };
      days.forEach((day) => {
        const entry = timetable.find(
          (e) => e.start_time === start && e.end_time === end && e.day === day
        );
        row[day.toLowerCase()] = entry
          ? {
              subject: entry.subject?.name || entry.subject,
              room: entry.room,
            }
          : null;
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
    <Card className={`mobile-card w-full max-w-full overflow-hidden ${theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}`}>
      <CardHeader className="flex flex-row items-center justify-between mobile-card-header px-2 sm:px-4">
        <CardTitle className={`mobile-card-title ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Timetable
          </div>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className={`mobile-touch-target ${theme === 'dark' ? 'text-card-foreground bg-muted hover:bg-accent border-border' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'}`}
          onClick={exportToPDF}
        >
          <FileDown className="w-4 h-4 mr-2" /> Export
        </Button>
      </CardHeader>

      <CardContent className="p-0 w-full max-w-full overflow-hidden">
        <div 
          ref={tableRef}
          className={`w-full max-w-full overflow-x-auto overflow-y-auto max-h-[70vh] sm:max-h-none sm:overflow-y-visible ${styles.timetableContainer} ${theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}`}
        >
          <table className={`min-w-[900px] sm:min-w-0 w-full text-sm text-left ${styles.timetableTable}`}>
            <thead className={`${theme === 'dark' ? 'bg-muted sticky top-0 z-10' : 'bg-gray-50 sticky top-0 z-10'}`}>
              <tr>
                <th className={`py-3 px-2 sm:px-4 font-semibold whitespace-nowrap ${styles.timeColumn} ${theme === 'dark' ? 'border-b border-border text-card-foreground' : 'border-b border-gray-200 text-gray-900'}`}>
                  Time
                </th>
                {days.map((day) => (
                  <th 
                    key={day}
                    className={`py-3 px-2 sm:px-4 font-semibold whitespace-nowrap ${styles.dayColumn} ${theme === 'dark' ? 'border-b border-border text-card-foreground' : 'border-b border-gray-200 text-gray-900'}`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getTableData().map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`${
                    idx % 2 === 0 
                      ? theme === 'dark' ? 'bg-card' : 'bg-white'
                      : theme === 'dark' ? 'bg-muted/40' : 'bg-gray-50'
                  } hover:${theme === 'dark' ? 'bg-accent/50' : 'bg-blue-50'}`}
                >
                  <td className={`py-3 px-2 sm:px-4 font-medium whitespace-nowrap ${styles.timeColumn} ${
                    theme === 'dark' 
                      ? 'text-card-foreground border-r border-border' 
                      : 'text-gray-900 border-r border-gray-200'
                  }`}>
                    {row.time}
                  </td>
                  {["mon", "tue", "wed", "thu", "fri", "sat"].map((day, i) => {
                    const entry = row[day];
                    return (
                      <td
                        key={i}
                        className={`py-3 px-2 sm:px-4 whitespace-nowrap ${styles.dayColumn} ${theme === 'dark' ? 'text-card-foreground border-b border-border/50' : 'text-gray-900 border-b border-gray-200'}`}
                      >
                        {entry ? (
                          <div className={`space-y-1 ${styles.cellContent}`}>
                            <div className={`font-semibold text-sm leading-tight ${styles.subject} ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                              {entry.subject}
                            </div>
                            <div className={`text-xs ${styles.room} ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                              {entry.room}
                            </div>
                          </div>
                        ) : (
                          <span className={`${styles.emptyCell} ${theme === 'dark' ? 'text-muted-foreground/50' : 'text-gray-300'}`}>—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentTimetable;