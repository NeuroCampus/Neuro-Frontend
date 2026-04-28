import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Building2, Users, Grid3X3, Shield, AlertCircle } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { getDashboardStats, getRoomsByHostelId, getFloorsByHostel } from "../../utils/hms_api";
import { useTheme } from "../../context/ThemeContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import DashboardCard from "../common/DashboardCard";
import { 
  SkeletonPageHeader, 
  SkeletonStatsGrid, 
  SkeletonCard 
} from "../ui/skeleton";

interface Hostel {
  id: number;
  name: string;
  capacity: number;
  warden?: number;
  caretaker?: number;
}

interface Room {
  id: number;
  hostel: number;
  hostel_name?: string;
  room_number: string;
  room_type: 'S' | 'D' | 'P' | 'B';
  capacity: number;
  student_count: number;
  floor?: number;
}

interface Stats {
  totalHostels: number;
  totalRooms: number;
  totalStudents: number;
  totalWardens: number;
  totalCaretakers: number;
  occupancyRate: number;
}

const HMSOverview = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalHostels: 0,
    totalRooms: 0,
    totalStudents: 0,
    totalWardens: 0,
    totalCaretakers: 0,
    occupancyRate: 0,
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [availableFloors, setAvailableFloors] = useState<number[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Fetch floors when hostel is selected
  useEffect(() => {
    if (selectedHostel) {
      fetchHostelFloors(selectedHostel);
      setRooms([]); // Clear rooms when hostel changes
    } else {
      setAvailableFloors([]);
      setRooms([]);
    }
  }, [selectedHostel]);

  // Fetch rooms when both hostel and floor are selected
  useEffect(() => {
    if (selectedHostel && selectedFloor) {
      fetchHostelRooms(selectedHostel, selectedFloor);
    } else {
      setRooms([]);
    }
  }, [selectedHostel, selectedFloor]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await getDashboardStats();

      if (response.success && response.data) {
        const { statistics, data } = response.data;

        setHostels(data.hostels);

        setStats({
          totalHostels: statistics.total_hostels,
          totalRooms: statistics.total_rooms,
          totalStudents: statistics.total_students,
          totalWardens: statistics.total_wardens,
          totalCaretakers: statistics.total_caretakers,
          occupancyRate: statistics.occupancy_rate,
        });

        // Do not auto-select first hostel to allow "Choose Hostel" placeholder
        /*
        if (data.hostels && data.hostels.length > 0) {
          setSelectedHostel(data.hostels[0].id);
        }
        */
      } else {
        throw new Error(response.message || "Failed to fetch dashboard stats");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHostelFloors = async (hostelId: number) => {
    try {
      const response = await getFloorsByHostel(hostelId);
      if (response.success && response.results) {
        setAvailableFloors(response.results);
      }
    } catch (error) {
      console.error("Failed to fetch floors", error);
    }
  };

  const fetchHostelRooms = async (hostelId: number, floor?: string) => {
    setLoadingRooms(true);
    try {
      const response = await getRoomsByHostelId(hostelId, floor);

      if (response.success && response.data?.rooms) {
        setRooms(response.data.rooms);
      } else if (response.success && response.results) {
        // Handle alternative response format if applicable
        setRooms(response.results);
      } else {
        setRooms([]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load hostel rooms",
        variant: "destructive",
      });
    } finally {
      setLoadingRooms(false);
    }
  };

  const getRoomColor = (occupied: number, capacity: number) => {
    const occupancyPercent = (occupied / capacity) * 100;
    if (occupancyPercent === 100) return "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400"; // Full
    if (occupancyPercent >= 50) return "bg-yellow-500/10 border-yellow-500/50 text-yellow-600 dark:text-yellow-400"; // Half full
    return "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400"; // Available
  };

  const getRoomStatusLabel = (occupied: number, capacity: number) => {
    const occupancyPercent = (occupied / capacity) * 100;
    if (occupancyPercent === 100) return "FULL";
    if (occupancyPercent >= 50) return "HALF";
    return "AVAIL";
  };

  // Helper: derive floor number from room_number like H1-101 -> 1, H1-001 -> 0
  const getFloorFromRoomNumber = (roomNumber: string) => {
    if (!roomNumber) return 0;
    const m = roomNumber.match(/(\d+)$/);
    if (!m) return 0;
    const num = parseInt(m[1], 10);
    if (isNaN(num)) return 0;
    return Math.floor(num / 100);
  };

  // Group rooms by floor for display and sort within floors
  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = room.floor !== undefined ? room.floor : getFloorFromRoomNumber(room.room_number || '');
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<number, Room[]>);

  // Ensure rooms in each floor are sorted by room_number
  Object.keys(roomsByFloor).forEach((f) => {
    roomsByFloor[Number(f)].sort((a, b) => (a.room_number).localeCompare(b.room_number, undefined, {numeric: true}));
  });

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

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <SkeletonPageHeader />
        <SkeletonStatsGrid items={5} />
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard
          title="Total Hostels"
          value={stats.totalHostels}
          description="Managed properties"
          icon={<Building2 size={20} />}
        />
        <DashboardCard
          title="Total Rooms"
          value={stats.totalRooms}
          description="Total capacity"
          icon={<Grid3X3 size={20} />}
        />
        <DashboardCard
          title="Total Students"
          value={stats.totalStudents}
          description="Active residents"
          icon={<Users size={20} />}
        />
        <DashboardCard
          title="Wardens"
          value={stats.totalWardens}
          description="Hostel supervisors"
          icon={<Shield size={20} />}
        />
        <DashboardCard
          title="Occupancy"
          value={`${stats.occupancyRate}%`}
          description="Current utilization"
          icon={<AlertCircle size={20} />}
        />
      </div>

      {/* Room Matrix Visualization */}
      <div
        className={`rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden`}
      >
        <div className="p-6 border-b bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Room Occupancy Matrix</h2>
              <p className="text-sm text-muted-foreground">Visual breakdown of room availability by floor.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Hostel Filter */}
              <div className="w-full sm:w-48 md:w-64">
                <Select
                  value={selectedHostel?.toString() || ''}
                  onValueChange={(v) => {
                    setSelectedHostel(Number(v));
                    setSelectedFloor("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Hostel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hostels.map((hostel) => (
                      <SelectItem key={hostel.id} value={hostel.id.toString()}>
                        {hostel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    {availableFloors
                      .sort((a, b) => a - b)
                      .map((floor) => (
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
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="h-20 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          ) : selectedHostel ? (
            !selectedFloor ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a floor to view room occupancy.
              </div>
            ) : Object.keys(roomsByFloor).length > 0 ? (
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
                            variants={itemVariants}
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
              Select a hostel to view room occupancy.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HMSOverview;
