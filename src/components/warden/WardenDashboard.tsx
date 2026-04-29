import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Grid3X3, AlertCircle, ClipboardList } from "lucide-react";
import { getWardenDashboard, WardenStats } from "../../utils/warden_api";
import { useToast } from "../../hooks/use-toast";
import DashboardCard from "../common/DashboardCard";
import { 
  SkeletonPageHeader, 
  SkeletonStatsGrid, 
  SkeletonCard 
} from "../ui/skeleton";

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { getWardenRooms } from "../../utils/warden_api";

interface Hostel {
  id: number;
  name: string;
  gender: string;
  room_count: number;
  student_count: number;
}

interface Room {
  id: number;
  hostel: number;
  name: string;
  room_number: string;
  room_type: 'S' | 'D' | 'P' | 'B';
  capacity: number;
  student_count: number;
  floor: number;
}

const WardenDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WardenStats | null>(null);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [wardenName, setWardenName] = useState("");
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [availableFloors, setAvailableFloors] = useState<number[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const result = await getWardenDashboard();
      if (result.success) {
        setStats(result.statistics);
        setHostels(result.data.hostels);
        setWardenName(result.warden_name);
        
        // Auto-select first hostel if available
        if (result.data.hostels.length > 0) {
          setSelectedHostel(result.data.hostels[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching warden dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHostel) {
      fetchRooms();
    }
  }, [selectedHostel]);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const result = await getWardenRooms();
      if (result.success) {
        // Filter rooms by selected hostel
        const hostelRooms = result.rooms.filter((r: any) => r.hostel === selectedHostel);
        setRooms(hostelRooms);
        
        // Extract unique floors
        const floors = Array.from(new Set(hostelRooms.map((r: any) => r.floor))) as number[];
        setAvailableFloors(floors.sort((a, b) => a - b));
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const getRoomColor = (occupied: number, capacity: number) => {
    const occupancyPercent = (occupied / capacity) * 100;
    if (occupancyPercent === 100) return "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400";
    if (occupancyPercent >= 50) return "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400";
    return "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400";
  };

  const roomsByFloor = rooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonPageHeader />
        <SkeletonStatsGrid items={4} />
        <SkeletonCard className="h-[400px]" />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warden Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {wardenName}. Here is your hostel overview.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="Active Residents"
          value={stats?.total_students || 0}
          description="Across all rooms"
          icon={<Users size={20} className="text-blue-500" />}
        />
        <DashboardCard
          title="Pending Issues"
          value={stats?.pending_issues || 0}
          description="Awaiting resolution"
          icon={<AlertCircle size={20} className="text-amber-500" />}
          trend={{ value: stats?.total_issues || 0, label: "total", isPositive: false }}
        />
        <DashboardCard
          title="Occupancy Rate"
          value={`${stats?.occupancy_rate || 0}%`}
          description="Room utilization"
          icon={<ClipboardList size={20} className="text-green-500" />}
        />
      </div>

      {/* Hostels List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hostels.map((hostel) => (
          <motion.div
            key={hostel.id}
            whileHover={{ y: -5 }}
            onClick={() => setSelectedHostel(hostel.id)}
            className={`p-6 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-pointer ${
              selectedHostel === hostel.id ? "border-primary ring-1 ring-primary/20" : "border-border/40"
            }`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{hostel.name}</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {hostel.gender === 'M' ? 'Boys Hostel' : 'Girls Hostel'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{hostel.room_count}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Rooms</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-primary">{hostel.student_count}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-semibold">Students</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Room Matrix Visualization (Mirroring HMS Admin) */}
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Room Occupancy Matrix</h2>
              <p className="text-sm text-muted-foreground">Visual breakdown of room availability by floor.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Floor Filter */}
              <div className="w-full sm:w-40 md:w-48">
                <Select
                  value={selectedFloor}
                  onValueChange={setSelectedFloor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Floors</SelectItem>
                    {availableFloors.map((floor) => (
                      <SelectItem key={floor} value={floor.toString()}>
                        Floor {floor === 0 ? 'Ground' : floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Half Full</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Full</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loadingRooms ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          ) : selectedHostel ? (
            Object.keys(roomsByFloor).length > 0 ? (
              <div className="space-y-8">
                {Object.keys(roomsByFloor)
                  .map((k) => Number(k))
                  .sort((a, b) => a - b)
                  .filter((f) => selectedFloor === "all" || f.toString() === selectedFloor)
                  .map((floorNum) => (
                    <div key={floorNum}>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                        Floor {floorNum === 0 ? 'Ground' : floorNum}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {roomsByFloor[floorNum].map((room) => (
                          <motion.div
                            key={room.id}
                            whileHover={{ scale: 1.05 }}
                            className={`p-3 rounded-lg border text-center transition-all ${getRoomColor(
                              room.student_count,
                              room.capacity
                            )} font-medium shadow-sm`}
                            title={`${room.room_number}: ${room.student_count}/${room.capacity}`}
                          >
                            <div className="text-[10px] opacity-70 mb-1">ROOM</div>
                            <div className="text-sm font-bold">{room.room_number}</div>
                            <div className="text-[10px] mt-1 font-bold">
                              {room.student_count}/{room.capacity}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No rooms available for this hostel.
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select a hostel card above to view room occupancy.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WardenDashboard;
