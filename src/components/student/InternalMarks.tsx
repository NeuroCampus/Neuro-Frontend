import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import { Bar } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect, useState } from "react";
import { Filter } from "lucide-react";
import { getInternalMarks } from "@/utils/student_api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SubjectMarks {
  test_number: number;
  mark: number;
  max_mark: number;
}

const InternalMarks = () => {
  const [marksData, setMarksData] = useState<{ [subject: string]: SubjectMarks[] }>({});
  const [loading, setLoading] = useState(true);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const response = await getInternalMarks();
      if (response.success && response.data) {
        // Transform flat marks array into grouped format
        const groupedData: { [subject: string]: SubjectMarks[] } = {};
        
        response.data.forEach(mark => {
          const subjectName = mark.subject; // subject is already a string
          if (!groupedData[subjectName]) {
            groupedData[subjectName] = [];
          }
          groupedData[subjectName].push({
            test_number: mark.test_number,
            mark: mark.mark,
            max_mark: mark.max_mark
          });
        });
        
        setMarksData(groupedData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const allSubjects = Object.keys(marksData);
  const filteredSubjects = allSubjects.filter(
    (subject) =>
      (selectedSubjects.length === 0 || selectedSubjects.includes(subject)) &&
      subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartData = {
    labels: filteredSubjects,
    datasets: [1, 2].map((testNum) => ({
      label: `Test ${testNum}`,
      data: filteredSubjects.map(
        (subj) =>
          marksData[subj].find((t) => t.test_number === testNum)?.mark ?? 0
      ),
      backgroundColor: testNum === 1 ? "#3b82f6" : "#06b6d4",
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" as const },
    },
    scales: {
      y: { beginAtZero: true, max: 100 },
    },
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-[#1c1c1e] text-gray-200">
      <h2 className="text-xl font-semibold">Internal Marks</h2>

      {/* Chart Section */}
     <Card className="bg-[#1c1c1e] text-gray-200 rounded-2xl border border-gray-200 shadow-lg">
        <CardHeader className="bg-[#1c1c1e] text-gray-200 rounded-t-2xl border-b border-gray-200">
          <CardTitle className="text-base">📊 Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className="bg-[#1c1c1e] text-gray-200 rounded-b-2xl p-4">
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-full max-w-[600px] h-[250px]">
              <Bar
                data={chartData}
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      labels: {
                        color: "#9ca3af", // text-gray-400
                      },
                    },
                    tooltip: {
                      backgroundColor: "#1f1f21", // dark tooltip
                      titleColor: "#e5e7eb",
                      bodyColor: "#d1d5db",
                      borderColor: "#27272a",
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: "#9ca3af" },
                      grid: {
                        color: "rgba(255, 255, 255, 0.05)",
                      },
                    },
                    y: {
                      ticks: { color: "#9ca3af" },
                      grid: {
                        color: "rgba(255, 255, 255, 0.05)",
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Filter Row */}
      <div className="flex items-center justify-between">
        {/* Search Input */}
        <Input
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-72 bg-[#232326] text-gray-200 border border-gray-600 focus:border-gray-400 focus:ring-0 rounded-md placeholder:text-gray-200"
        />

        {/* Filter Button */}
        <Button
          variant="outline"
          className="text-gray-200 bg-gray-800 hover:bg-gray-700 border border-gray-600"
          onClick={() => setShowFilter(true)}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-300 overflow-hidden bg-[#1c1c1e] text-gray-200">
        <div className="grid grid-cols-4 p-3 bg-[#1c1c1e] text-gray-200 font-medium text-sm">
          <div>Subject</div>
          <div className="text-center">Test 1</div>
          <div className="text-center">Test 2</div>
          <div className="text-center">Average</div>
        </div>
        {filteredSubjects.map((subject, index) => {
          const tests = marksData[subject];
          const t1 = tests.find((t) => t.test_number === 1)?.mark ?? null;
          const t2 = tests.find((t) => t.test_number === 2)?.mark ?? null;
          
          // Calculate average only from available test marks
          const availableMarks = [t1, t2].filter(mark => mark !== null && mark !== undefined);
          const avg = availableMarks.length > 0 
            ? availableMarks.reduce((sum, mark) => sum + mark, 0) / availableMarks.length 
            : 0;

          return (
            <div
              key={index}
              className="grid grid-cols-4 p-3 text-sm text-gray-200 hover:bg-gray-800"
            >
              <div>{subject}</div>
              <div className="text-center">{t1 !== null ? t1 : "-"}</div>
              <div className="text-center">{t2 !== null ? t2 : "-"}</div>
              <div className="text-center font-semibold">
                {availableMarks.length > 0 ? avg.toFixed(1) : "-"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent className="bg-[#1c1c1e] text-gray-200 rounded-xl w-80 border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Filter by Subject
            </DialogTitle>
          </DialogHeader>

          {/* Dropdown inside Dialog */}
          <Select
            value={selectedSubjects.length ? selectedSubjects[0] : "All"}
            onValueChange={(value) => {
              if (value === "All") {
                setSelectedSubjects([]); // Show all subjects
              } else {
                setSelectedSubjects([value]);
              }
            }}
          >
            <SelectTrigger className="w-full bg-[#232326] text-gray-200 rounded-md">
              <SelectValue placeholder="Choose a Subject" />
            </SelectTrigger>
            <SelectContent className="bg-[#1c1c1e] text-gray-200 border border-gray-700 rounded-md shadow-lg">
              {/* "All" Option */}
              <SelectItem
                value="All"
                className="hover:bg-[#2c2c2e] cursor-pointer font-semibold"
              >
                All Subjects
              </SelectItem>

              {/* Subject List */}
              {allSubjects.map((subject) => (
                <SelectItem
                  key={subject}
                  value={subject}
                  className="hover:bg-[#2c2c2e] cursor-pointer"
                >
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              className="bg-gray-200 hover:bg-gray-600 border border-gray-500 text-gray-800"
              onClick={() => {
                setSelectedSubjects([]);
                setSearchQuery("");
                setShowFilter(false);
              }}
            >
              Clear
            </Button>
            <Button className="text-gray-200 bg-gray-800 hover:bg-gray-500 border border-gray-500" onClick={() => setShowFilter(false)}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalMarks;
