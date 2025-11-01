import React, { useMemo, useState, memo, useRef } from "react";
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
import { Filter } from "lucide-react";
import { useStudentInternalMarksQuery } from "@/hooks/useApiQueries";
import { useMemoizedCalculation } from "@/hooks/useOptimizations";
import { useTheme } from "@/context/ThemeContext";
import { useVirtualizer } from '@tanstack/react-virtual';
import { SkeletonChart, SkeletonTable, Skeleton } from "../ui/skeleton";
import { useDebouncedSearch } from "@/hooks/useOptimizations";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Memoized Table Row Component
const MemoizedTableRow = React.memo(({ 
  subject, 
  tests, 
  theme,
  index 
}: { 
  subject: string, 
  tests: SubjectMarks[], 
  theme: string,
  index: number 
}) => {
  const t1 = tests.find((t) => t.test_number === 1)?.mark ?? null;
  const t2 = tests.find((t) => t.test_number === 2)?.mark ?? null;
  
  // Calculate average using memoized calculation
  const avg = useMemoizedCalculation(() => {
    const availableMarks = [t1, t2].filter(mark => mark !== null && mark !== undefined);
    return availableMarks.length > 0 
      ? availableMarks.reduce((sum, mark) => sum + mark, 0) / availableMarks.length 
      : 0;
  }, [t1, t2]);

  return (
    <div
      className={`grid grid-cols-4 p-3 text-sm ${theme === 'dark' ? 'text-card-foreground hover:bg-accent' : 'text-gray-900 hover:bg-gray-100'}`}
    >
      <div>{subject}</div>
      <div className="text-center">{t1 !== null ? t1 : "-"}</div>
      <div className="text-center">{t2 !== null ? t2 : "-"}</div>
      <div className="text-center font-semibold">
        {avg > 0 ? avg.toFixed(1) : "-"}
      </div>
    </div>
  );
});

interface SubjectMarks {
  test_number: number;
  mark: number;
  max_mark: number;
}

// Memoized Bar Chart Component
const MemoizedBarChart = React.memo(({ data, options }: { data: any; options: any }) => {
  return <Bar data={data} options={options} />;
});

// Virtualized Table Component
const VirtualizedMarksTable = memo(({ filteredSubjects, marksData, theme }: {
  filteredSubjects: string[];
  marksData: { [subject: string]: SubjectMarks[] };
  theme: string;
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Pre-calculate all averages to avoid hooks in map
  const subjectAverages = useMemo(() => {
    const averages: { [subject: string]: number } = {};
    
    filteredSubjects.forEach(subject => {
      const tests = marksData[subject] || [];
      const t1 = tests.find((t) => t.test_number === 1)?.mark ?? null;
      const t2 = tests.find((t) => t.test_number === 2)?.mark ?? null;
      
      const availableMarks = [t1, t2].filter(mark => mark !== null && mark !== undefined);
      averages[subject] = availableMarks.length > 0 
        ? availableMarks.reduce((sum, mark) => sum + mark, 0) / availableMarks.length 
        : 0;
    });
    
    return averages;
  }, [filteredSubjects, marksData]);

  const virtualizer = useVirtualizer({
    count: filteredSubjects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className={`h-96 overflow-auto ${theme === 'dark' ? 'bg-card' : 'bg-white'}`}
      style={{ contain: 'strict' }}
    >
      {/* Fixed Header */}
      <div className={`sticky top-0 z-10 border-b ${theme === 'dark' ? 'border-gray-300 bg-card' : 'border-gray-200 bg-white'}`}>
        <div className={`grid grid-cols-4 p-3 font-medium text-sm ${theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}`}>
          <div>Subject</div>
          <div className="text-center">Test 1</div>
          <div className="text-center">Test 2</div>
          <div className="text-center">Average</div>
        </div>
      </div>

      {/* Virtualized Rows */}
      <div 
        style={{ 
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const subject = filteredSubjects[virtualItem.index];
          const tests = marksData[subject] || [];
          
          const t1 = tests.find((t) => t.test_number === 1)?.mark ?? null;
          const t2 = tests.find((t) => t.test_number === 2)?.mark ?? null;
          
          // Use pre-calculated average
          const avg = subjectAverages[subject] || 0;

          return (
            <div
              key={virtualItem.key}
              className={`grid grid-cols-4 p-3 text-sm border-b ${theme === 'dark' ? 'border-gray-300 text-card-foreground hover:bg-accent' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="truncate">{subject}</div>
              <div className="text-center">{t1 !== null ? t1 : "-"}</div>
              <div className="text-center">{t2 !== null ? t2 : "-"}</div>
              <div className="text-center font-semibold">
                {avg > 0 ? avg.toFixed(1) : "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});const InternalMarks = () => {
  const { theme } = useTheme();
  const { data: marksResponse, isLoading, error, pagination } = useStudentInternalMarksQuery();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showFilter, setShowFilter] = useState(false);
  
  // Use debounced search
  const { value: searchQuery, debouncedValue: debouncedSearchQuery, setValue: setSearchQuery, isDebouncing } = useDebouncedSearch('', 500);

  // Transform marks data from response
  const marksData = useMemo(() => {
    if (!marksResponse?.data) return {};

    const groupedData: { [subject: string]: SubjectMarks[] } = {};

    marksResponse.data.forEach(mark => {
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

    return groupedData;
  }, [marksResponse?.data]);

  const allSubjects = Object.keys(marksData);
  const filteredSubjects = allSubjects.filter(
    (subject) =>
      (selectedSubjects.length === 0 || selectedSubjects.includes(subject)) &&
      subject.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
  );

  const chartData = useMemo(() => ({
    labels: filteredSubjects,
    datasets: [1, 2].map((testNum) => ({
      label: `Test ${testNum}`,
      data: filteredSubjects.map(
        (subj) =>
          marksData[subj].find((t) => t.test_number === testNum)?.mark ?? 0
      ),
      backgroundColor: testNum === 1 ? "#3b82f6" : "#06b6d4",
    })),
  }), [filteredSubjects, marksData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: theme === 'dark' ? "#9ca3af" : "#6b7280",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: theme === 'dark' ? "#9ca3af" : "#6b7280"
        },
        grid: {
          color: theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)",
        },
      },
      x: {
        ticks: {
          color: theme === 'dark' ? "#9ca3af" : "#6b7280"
        },
        grid: {
          color: theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.1)",
        },
      },
    },
  }), [theme]);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
        <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Internal Marks</h2>

        {/* Chart Section */}
        <Card className={theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
          <CardHeader className={theme === 'dark' ? 'bg-card text-card-foreground border-b border-border' : 'bg-white text-gray-900 border-b border-gray-200'}>
            <CardTitle className={theme === 'dark' ? 'text-base text-card-foreground' : 'text-base text-gray-900'}>📊 Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className={theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}>
            <div className="flex items-center justify-center h-[300px]">
              <div className="w-full max-w-[600px] h-[250px]">
                <SkeletonChart />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-10 w-20" />
        </div>

        {/* Table */}
        <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'border-border bg-card text-card-foreground' : 'border-gray-200 bg-white text-gray-900'}`}>
          <SkeletonTable rows={8} cols={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="text-red-500">Error loading internal marks data</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Internal Marks</h2>

      {/* Chart Section */}
     <Card className={theme === 'dark' ? 'bg-card text-card-foreground border-border' : 'bg-white text-gray-900 border-gray-200'}>
        <CardHeader className={theme === 'dark' ? 'bg-card text-card-foreground border-b border-border' : 'bg-white text-gray-900 border-b border-gray-200'}>
          <CardTitle className={theme === 'dark' ? 'text-base text-card-foreground' : 'text-base text-gray-900'}>📊 Performance Overview</CardTitle>
        </CardHeader>
        <CardContent className={theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}>
          <div className="flex items-center justify-center h-[300px]">
            <div className="w-full max-w-[600px] h-[250px]">
              <MemoizedBarChart data={chartData} options={chartOptions} />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Filter Row */}
      <div className="flex items-center justify-between">
        {/* Search Input */}
        <div className="relative">
          <Input
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={theme === 'dark' ? 'w-72 bg-background text-foreground border-border focus:border-foreground focus:ring-0 rounded-md placeholder:text-muted-foreground' : 'w-72 bg-white text-gray-900 border-gray-300 focus:border-gray-500 focus:ring-0 rounded-md placeholder:text-gray-500'}
          />
          {isDebouncing && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Filter Button */}
        <Button
          variant="outline"
          className={theme === 'dark' ? 'text-foreground bg-muted hover:bg-accent border-border' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className={`rounded-md overflow-hidden ${theme === 'dark' ? 'border-border bg-card text-card-foreground' : 'border-gray-200 bg-white text-gray-900'}`}>
        <VirtualizedMarksTable filteredSubjects={filteredSubjects} marksData={marksData} theme={theme} />
      </div>

      {/* Filter Dialog */}
      <Dialog open={showFilter} onOpenChange={setShowFilter}>
        <DialogContent className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
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
            <SelectTrigger className={theme === 'dark' ? 'w-full bg-[#232326] text-gray-200 border-gray-600' : 'w-full bg-white text-gray-900 border-gray-300'}>
              <SelectValue placeholder="Choose a Subject" />
            </SelectTrigger>
            <SelectContent className={theme === 'dark' ? 'bg-[#1c1c1e] text-gray-200 border-gray-700' : 'bg-white text-gray-900 border-gray-200'}>
              {/* "All" Option */}
              <SelectItem
                value="All"
                className={theme === 'dark' ? 'hover:bg-[#2c2c2e] cursor-pointer font-semibold' : 'hover:bg-gray-100 cursor-pointer font-semibold'}
              >
                All Subjects
              </SelectItem>

              {/* Subject List */}
              {allSubjects.map((subject) => (
                <SelectItem
                  key={subject}
                  value={subject}
                  className={theme === 'dark' ? 'hover:bg-[#2c2c2e] cursor-pointer' : 'hover:bg-gray-100 cursor-pointer'}
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
              className={theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 border-gray-300 text-gray-700'}
              onClick={() => {
                setSelectedSubjects([]);
                setSearchQuery("");
                setShowFilter(false);
              }}
            >
              Clear
            </Button>
            <Button 
              className={theme === 'dark' ? 'text-gray-200 bg-gray-800 hover:bg-gray-700 border-gray-600' : 'text-gray-900 bg-gray-200 hover:bg-gray-300 border-gray-300'} 
              onClick={() => setShowFilter(false)}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternalMarks;