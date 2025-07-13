import { useCallback } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { FaDownload } from 'react-icons/fa';

interface TimetableProps {
  role: string; // e.g., "Dr. Alan"
}

const timetableData = [
  {
    day: "Monday",
    slots: [
      { time: "9:00-10:00", subject: "Math", faculty: "Dr. Alan", room: "101" },
      { time: "10:00-11:00", subject: "History", faculty: "Prof. Grace", room: "106" },
      { time: "11:15-12:15", subject: "Computer Science", faculty: "Dr. Frank", room: "107" },
      { time: "12:15-1:15", subject: "Art", faculty: "Prof. Helen", room: "108" },
      { time: "2:00-3:00", subject: "Biology", faculty: "Dr. Eva", room: "105" },
      { time: "3:00-4:00", subject: "Music", faculty: "Prof. Ivan", room: "109" },
    ],
  },
  {
    day: "Tuesday",
    slots: [
      { time: "9:00-10:00", subject: "Physics", faculty: "Dr. Brian", room: "102" },
      { time: "10:00-11:00", subject: "Geography", faculty: "Prof. Jane", room: "110" },
      { time: "11:15-12:15", subject: "Math", faculty: "Dr. Alan", room: "101" },
      { time: "12:15-1:15", subject: "English", faculty: "Prof. Diana", room: "104" },
      { time: "2:00-3:00", subject: "Chemistry", faculty: "Dr. Claire", room: "103" },
      { time: "3:00-4:00", subject: "Physics", faculty: "Dr. Brian", room: "102" },
    ],
  },
  {
    day: "Wednesday",
    slots: [
      { time: "9:00-10:00", subject: "Chemistry", faculty: "Dr. Claire", room: "103" },
      { time: "10:00-11:00", subject: "Math", faculty: "Dr. Alan", room: "101" },
      { time: "11:15-12:15", subject: "English", faculty: "Prof. Diana", room: "104" },
      { time: "12:15-1:15", subject: "Biology", faculty: "Dr. Eva", room: "105" },
      { time: "2:00-3:00", subject: "Physics", faculty: "Dr. Brian", room: "102" },
      { time: "3:00-4:00", subject: "Chemistry", faculty: "Dr. Claire", room: "103" },
    ],
  },
  {
    day: "Thursday",
    slots: [
      { time: "9:00-10:00", subject: "English", faculty: "Prof. Diana", room: "104" },
      { time: "10:00-11:00", subject: "Economics", faculty: "Prof. Kevin", room: "111" },
      { time: "11:15-12:15", subject: "Philosophy", faculty: "Dr. Laura", room: "112" },
      { time: "12:15-1:15", subject: "Psychology", faculty: "Prof. Mike", room: "113" },
      { time: "2:00-3:00", subject: "Chemistry", faculty: "Dr. Claire", room: "103" },
      { time: "3:00-4:00", subject: "Sociology", faculty: "Prof. Nancy", room: "114" },
    ],
  },
  {
    day: "Friday",
    slots: [
      { time: "9:00-10:00", subject: "Biology", faculty: "Dr. Eva", room: "105" },
      { time: "10:00-11:00", subject: "Physics", faculty: "Dr. Brian", room: "102" },
      { time: "11:15-12:15", subject: "Chemistry", faculty: "Dr. Claire", room: "103" },
      { time: "12:15-1:15", subject: "Literature", faculty: "Prof. Olivia", room: "115" },
      { time: "2:00-3:00", subject: "Math", faculty: "Dr. Alan", room: "101" },
      { time: "3:00-4:00", subject: "Biology", faculty: "Dr. Eva", room: "105" },
    ],
  },
];

const timeSlots = ["9:00-10:00", "10:00-11:00", "11:15-12:15", "12:15-1:15", "2:00-3:00", "3:00-4:00"];

const Timetable = ({ role }: TimetableProps) => {
  // Filter out only the slots for the given faculty
  const filteredData = timetableData.map((day) => ({
    day: day.day,
    slots: day.slots.filter((slot) => slot.faculty === role),
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
    <Card>
      <CardHeader>
        <CardTitle>Timetable - {role}</CardTitle>
      </CardHeader>

      <div className="flex justify-between items-center p-4">
        <h2 className="text-lg font-semibold ml-3">Timetable</h2>
        <Button onClick={exportPDF} className="hidden md:flex items-center mr-3">
          <FaDownload  />
          Export PDF
        </Button>
      </div>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse text-sm border">
            <thead>
              <tr className="bg-gray-100">
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
      </CardContent>
    </Card>
  );
};

export default Timetable;
