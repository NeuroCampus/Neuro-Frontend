import { useCallback, useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FaDownload } from 'react-icons/fa';
import { getTimetable, TimetableEntry } from '../../utils/faculty_api';

interface TimetableProps {
  role: string;
}

interface TimetableSlot {
  time: string;
  subject: string;
  faculty: string;
  room: string;
  section: string;
  semester: number;
  branch: string;
}

interface TimetableDay {
  day: string;
  slots: TimetableSlot[];
}

const timeSlots = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "11:15-12:15",
  "12:00-13:00",
  "12:15-13:15",
  "14:00-15:00",
  "15:00-16:00"
];

const Timetable = ({ role }: TimetableProps) => {
  const [timetableData, setTimetableData] = useState<TimetableDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTimetable()
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          console.log('Backend timetable data:', res.data); // Debug log
          
          const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayMapping = {
            'MON': 'Monday',
            'TUE': 'Tuesday', 
            'WED': 'Wednesday',
            'THU': 'Thursday',
            'FRI': 'Friday',
            'SAT': 'Saturday'
          };
          
          const backendData: TimetableDay[] = daysOfWeek.map((day) => ({
            day,
            slots: res.data
              .filter((entry: TimetableEntry) => {
                const mappedDay = dayMapping[entry.day] || entry.day;
                return mappedDay === day;
              })
              .map((entry: TimetableEntry) => {
                return {
                  time: `${entry.start_time}-${entry.end_time}`,
                  subject: entry.subject,
                  faculty: `${entry.faculty_name} - ${entry.subject} (${entry.branch}, Sem ${entry.semester}, Sec ${entry.section})`,
                  room: entry.room,
                  section: entry.section,
                  semester: entry.semester,
                  branch: entry.branch
                };
              }),
          }));
          
          console.log('Transformed timetable data:', backendData); // Debug log
          setTimetableData(backendData);
        } else {
          setTimetableData([]);
        }
      })
      .catch((error) => {
        console.error('Error loading timetable:', error); // Debug log
        setError("Failed to load timetable")
      })
      .finally(() => setLoading(false));
  }, [role]);

  const filteredData = timetableData.map((day) => ({
    day: day.day,
    slots: day.slots,
  }));

  const exportPDF = useCallback(() => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text(`1st Semester Timetable - ${role}`, 14, 15);

    const head = [["Time/Day", ...filteredData.map((d) => d.day)]];

    const body = timeSlots.map((time) => {
      const row = [time];
      for (const day of filteredData) {
        const slot = day.slots.find((s) => s.time === time);
        if (!slot) {
          row.push("Break");
        } else {
          row.push(`${slot.subject}\n${slot.faculty}\nRoom ${slot.room}`);
        }
      }
      return row;
    });

    autoTable(doc, {
      head,
      body,
      startY: 25,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: "center",
        valign: "middle",
      },
    });

    doc.save(`${role}_Timetable.pdf`);
  }, [filteredData, role]);

  return (
    <Card className="bg-[#1c1c1e] text-gray-200">
      <CardHeader>
        <CardTitle>Timetable - {role}</CardTitle>
      </CardHeader>

      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold ml-3">Timetable</h2>
        <Button onClick={exportPDF} className="hidden md:flex items-center mr-3 text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500">
          <FaDownload  />
          Export PDF
        </Button>
      </div>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-200">Loading timetable...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-sm border">
            <thead>
              <tr className="bg-[#232326] text-gray-200">
                <th className="border px-4 py-2 text-left">Time/Day</th>
                {filteredData.map((d) => (
                  <th key={d.day} className="border px-4 py-2">{d.day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td className="border px-4 py-2 font-semibold">{time}</td>
                  {filteredData.map((day) => {
                    const slot = day.slots.find((s) => s.time === time);
                    
                    return (
                      <td key={day.day + time} className="border px-4 py-2 text-center">
                        {slot ? (
                          <>
                            <strong>{slot.subject}</strong><br />
                            <span className="text-xs">{slot.faculty}</span><br />
                            <span className="text-xs">Room {slot.room}</span>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">Break</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Timetable;
