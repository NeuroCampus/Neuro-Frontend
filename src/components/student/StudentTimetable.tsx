import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { CalendarDays, Download, Filter } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { getTimetable } from "@/utils/student_api";
import { useTheme } from "@/context/ThemeContext";

// Dummy data for one semester
const dummyTimetableData = [
  ["9:00-10:00", "Math", "Physics", "Chemistry", "English", "Biology"],
  ["10:00-11:00", "Break", "Break", "Math", "Break", "Physics"],
  ["11:15-12:15", "Break", "Math", "English", "Break", "Chemistry"],
  ["12:15-1:15", "Break", "English", "Biology", "Break", "Break"],
  ["2:00-3:00", "Biology", "Break", "Physics", "Chemistry", "Math"],
  ["3:00-4:00", "Break", "Physics", "Chemistry", "Break", "Biology"],
];

const facultyRoomMap: Record<string, { faculty: string; room: string }> = {
  Math: { faculty: "Dr. Alan", room: "101" },
  Physics: { faculty: "Dr. Brian", room: "102" },
  Chemistry: { faculty: "Dr. Claire", room: "103" },
  English: { faculty: "Prof. Diana", room: "104" },
  Biology: { faculty: "Dr. Eva", room: "105" },
};

const getUniqueSubjects = () => {
  const flat = dummyTimetableData.flat().filter((v) => v !== "Break" && !v.includes(":"));
  return [...new Set(flat)];
};

const StudentTimetable = () => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [timetableData, setTimetableData] = useState<any[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchTimetable = async () => {
      const data = await getTimetable();
      if (data.success && Array.isArray(data.timetable)) {
        setTimetableData(data.timetable);
      }
    };
    fetchTimetable();
  }, []);

  const filterCell = (subject: string): boolean => {
    if (subject === "Break") return true;
    const faculty = facultyRoomMap[subject]?.faculty || "";
    const room = facultyRoomMap[subject]?.room || "";

    return (
      (subjectFilter === "all" || subject === subjectFilter) &&
      (facultyFilter === "all" || faculty === facultyFilter) &&
      (roomFilter === "all" || room === roomFilter)
    );
  };

  const renderCell = (subject: string, index: number) => {
    if (!filterCell(subject)) return null;

    if (subject === "Break") {
      return <i className={`text-muted-foreground ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Break</i>;
    }

    const faculty = facultyRoomMap[subject]?.faculty || "Prof. Smith";
    const room = facultyRoomMap[subject]?.room || `Room ${100 + index}`;

    return (
      <div>
        <strong className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}>{subject}</strong>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{faculty}</div>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{room}</div>
      </div>
    );
  };

  const exportToCSV = () => {
    const csvRows = [
      ["Time/Day", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      ...dummyTimetableData.map((row) => row.join(",")),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSubjectFilter("all");
    setFacultyFilter("all");
    setRoomFilter("all");
  };

  const uniqueSubjects = getUniqueSubjects();
  const uniqueFaculty = [...new Set(Object.values(facultyRoomMap).map((f) => f.faculty))];
  const uniqueRooms = [...new Set(Object.values(facultyRoomMap).map((f) => f.room))];

  return (
    <Card className={theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className={theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}>Timetable</CardTitle>
        <div className="flex gap-2 ">
          <Button 
            variant="outline" 
            size="sm" 
            className={theme === 'dark' ? 'text-card-foreground bg-muted hover:bg-accent border-border' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'}
            onClick={() => setShowFilterModal(true)}
          >
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={theme === 'dark' ? 'text-card-foreground bg-muted hover:bg-accent border-border' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'}
            onClick={exportToCSV}
          >
            <Download className="w-4 h-4 mr-2" /> Export
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
            <table className={`w-full text-sm ${theme === 'dark' ? 'border-border' : 'border-gray-200'}`}>
              <thead>
                <tr className={theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}>
                  <th className={`text-left p-2 ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Day</th>
                  <th className={`text-left p-2 ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Start Time</th>
                  <th className={`text-left p-2 ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>End Time</th>
                  <th className={`text-left p-2 ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Subject</th>
                  <th className={`text-left p-2 ${theme === 'dark' ? 'border-b border-border' : 'border-b border-gray-200'}`}>Room</th>
                </tr>
              </thead>
              <tbody>
                {timetableData.map((entry, idx) => (
                  <tr key={idx} className={theme === 'dark' ? 'border-t border-border' : 'border-t border-gray-200'}>
                    <td className={`p-2 font-medium ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>{entry.day}</td>
                    <td className={`p-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>{entry.start_time}</td>
                    <td className={`p-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>{entry.end_time}</td>
                    <td className={`p-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>{entry.subject?.name || entry.subject}</td>
                    <td className={`p-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-700'}`}>{entry.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Filter Modal */}
      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={theme === 'dark' ? 'text-foreground' : 'text-gray-900'}>Filter Timetable</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div >
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Subject</label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className={theme === 'dark' ? 'mt-1 bg-background text-foreground border-border' : 'mt-1 bg-white text-gray-900 border-gray-300'}>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  <SelectItem value="all" className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}>All</SelectItem>
                  {uniqueSubjects.map((subj) => (
                    <SelectItem key={subj} value={subj} className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Faculty</label>
              <Select value={facultyFilter} onValueChange={setFacultyFilter}>
                <SelectTrigger className={theme === 'dark' ? 'mt-1 bg-background text-foreground border-border' : 'mt-1 bg-white text-gray-900 border-gray-300'}>
                  <SelectValue placeholder="Select faculty" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  <SelectItem value="all" className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}>All</SelectItem>
                  {uniqueFaculty.map((faculty) => (
                    <SelectItem key={faculty} value={faculty} className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}>
                      {faculty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Room</label>
              <Select value={roomFilter} onValueChange={setRoomFilter}>
                <SelectTrigger className={theme === 'dark' ? 'mt-1 bg-background text-foreground border-border' : 'mt-1 bg-white text-gray-900 border-gray-300'}>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent className={theme === 'dark' ? 'bg-background text-foreground border-border' : 'bg-white text-gray-900 border-gray-300'}>
                  <SelectItem value="all" className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}>All</SelectItem>
                  {uniqueRooms.map((room) => (
                    <SelectItem key={room} value={room} className={theme === 'dark' ? 'hover:bg-accent' : 'hover:bg-gray-100'}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={clearFilters}
              className={theme === 'dark' ? 'text-foreground bg-muted hover:bg-accent border-border' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'}
            >
              Clear Filters
            </Button>
            <Button
              onClick={() => setShowFilterModal(false)}
              className={theme === 'dark' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-blue-600 text-white hover:bg-blue-700'}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default StudentTimetable;