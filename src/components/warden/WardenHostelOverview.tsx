import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Grid3X3, Search } from "lucide-react";
import { getWardenStudents } from "../../utils/warden_api";
import { useToast } from "../../hooks/use-toast";
import { Input } from "@/components/ui/input";
import { SkeletonCard } from "../ui/skeleton";

const WardenHostelOverview = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const result = await getWardenStudents();
      if (result.success) {
        setStudents(result.students);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch student list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.enrollment_no || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.room_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-8"><SkeletonCard className="h-[500px]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hostel Residents</h1>
        <p className="text-muted-foreground mt-1">Manage and oversee students in your assigned hostel.</p>
      </div>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, USN, or room..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStudents.map((student) => (
          <motion.div
            key={student.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="group p-5 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all border-border/40"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{student.name}</h3>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{student.enrollment_no}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Room</span>
                <span className="font-bold text-primary">{student.room_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-medium">{student.branch_name}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-20 opacity-40">
          <Users className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg font-medium">No students found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default WardenHostelOverview;
