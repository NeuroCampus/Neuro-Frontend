import React, { useEffect, useState } from 'react';
import { getStudentHostelDetails, getTodayMenuSummary } from '../../utils/hms_api';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/use-toast';
import RaiseIssueModal from '../hms/RaiseIssueModal';
import {
  FaBuilding,
  FaBed,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaUsers,
  FaExclamationCircle,
  FaSyncAlt,
  FaIdBadge,
  FaHotel,
  FaLeaf,
  FaDrumstickBite,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

type Warden = {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  designation?: string;
  experience?: number;
};

type Caretaker = {
  id?: number;
  name?: string;
  phone?: string;
  email?: string;
  experience?: number;
};

type HostelInfo = {
  id?: number;
  name?: string;
  address?: string;
  contact?: string;
  gender?: string;
};

type RoomInfo = {
  id?: number;
  room_number?: string;
  floor?: string | number;
  room_type?: string;
  room_type_display?: string;
  capacity?: number;
  current_occupancy?: number;
  is_vacant?: boolean;
};

const ROOM_TYPE_COLORS: Record<string, string> = {
  S: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  D: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  P: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  B: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

// ── Meal Type Display Mapping ────────────────────────────────────────────────
const MEAL_TYPE_DISPLAY = {
  'BR': { label: 'Breakfast', time_from: '07:30', time_to: '09:00' },
  'LN': { label: 'Lunch', time_from: '12:00', time_to: '14:00' },
  'SN': { label: 'Snacks', time_from: '16:00', time_to: '17:30' },
  'DN': { label: 'Dinner', time_from: '19:00', time_to: '21:00' },
};

const getMealTypeLabel = (code: string) => {
  return MEAL_TYPE_DISPLAY[code as keyof typeof MEAL_TYPE_DISPLAY]?.label || code;
};

// ── Small reusable info row ──────────────────────────────────────────────────
const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
  theme: string;
}> = ({ icon, label, value, theme }) => (
  <div className="flex items-start gap-3">
    <span className={`mt-0.5 flex-shrink-0 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
      {icon}
    </span>
    <div className="min-w-0">
      <p className={`text-[10px] uppercase tracking-wide font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
        {label}
      </p>
      <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-800'}`}>
        {value ?? '—'}
      </p>
    </div>
  </div>
);

// ── Occupancy bar ────────────────────────────────────────────────────────────
const OccupancyBar: React.FC<{ current: number; capacity: number; theme: string }> = ({
  current,
  capacity,
  theme,
}) => {
  const pct = capacity > 0 ? Math.min(Math.round((current / capacity) * 100), 100) : 0;
  const full = current >= capacity;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-[10px] uppercase tracking-wide font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
          Occupancy
        </span>
        <span className={`text-xs font-bold ${full ? 'text-red-500' : (theme === 'dark' ? 'text-green-400' : 'text-green-600')}`}>
          {current}/{capacity}
        </span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${full ? 'bg-red-500' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
        {pct}% occupied
      </p>
    </div>
  );
};

// ── Staff card (warden / caretaker) ─────────────────────────────────────────
const StaffCard: React.FC<{
  role: string;
  person: Warden | Caretaker | null;
  color: string;
  theme: string;
}> = ({ role, person, color, theme }) => (
  <div
    className={`rounded-xl border p-4 flex flex-col gap-3 shadow-sm transition-shadow hover:shadow-md ${
      theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
    }`}
  >
    {/* header */}
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
        <FaUserTie className="w-4 h-4" />
      </div>
      <div>
        <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
          {role}
        </p>
        <p className={`text-sm font-semibold leading-tight ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-800'}`}>
          {person?.name ?? 'Not assigned'}
        </p>
      </div>
    </div>

    {person ? (
      <div className="space-y-2 pt-1">
        {person.email && (
          <InfoRow icon={<FaEnvelope size={12} />} label="Email" value={person.email} theme={theme} />
        )}
        {person.phone && (
          <InfoRow icon={<FaPhone size={12} />} label="Phone" value={person.phone} theme={theme} />
        )}
        {(person as Warden).designation && (
          <InfoRow icon={<FaIdBadge size={12} />} label="Designation" value={(person as Warden).designation} theme={theme} />
        )}
        {(person.experience ?? 0) > 0 && (
          <InfoRow icon={<FaCheckCircle size={12} />} label="Experience" value={`${person.experience} year${person.experience !== 1 ? 's' : ''}`} theme={theme} />
        )}
      </div>
    ) : (
      <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
        No staff assigned to this hostel.
      </p>
    )}
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
const StudentHostelDetails: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hostel, setHostel] = useState<HostelInfo | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [warden, setWarden] = useState<Warden | null>(null);
  const [caretaker, setCaretaker] = useState<Caretaker | null>(null);
  const [todayMenus, setTodayMenus] = useState<any[]>([]);
  const [isRaiseIssueModalOpen, setIsRaiseIssueModalOpen] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getStudentHostelDetails();
      if (!r.success) throw new Error(r.message || 'Failed to fetch');

      // Handle possible double-wrap from HMS API utility
      const data = r.data?.data ?? r.data ?? {};

      setRoom(data.room ?? null);
      setHostel(data.hostel ?? null);
      setWarden(data.warden ?? null);
      setCaretaker(data.caretaker ?? null);
    } catch (err: any) {
      console.error('Failed to load hostel details', err);
      setError(err.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    // Load compact today's menu for student dashboard
    const loadToday = async () => {
      try {
        const res = await getTodayMenuSummary();
        if (res.success && res.results) {
          setTodayMenus(res.results);
        } else if (res.success && res.data) {
          // some endpoints return single object
          setTodayMenus(Array.isArray(res.data) ? res.data : [res.data]);
        } else {
          setTodayMenus([]);
        }
      } catch (e) {
        console.error('Failed to load today menu summary', e);
        setTodayMenus([]);
      }
    };
    loadToday();
  }, []);



  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`space-y-4 p-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`h-28 rounded-xl animate-pulse ${theme === 'dark' ? 'bg-card' : 'bg-gray-100'}`}
          />
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className={`rounded-xl border p-6 flex flex-col items-center gap-3 ${
          theme === 'dark' ? 'bg-destructive/10 border-destructive text-destructive-foreground' : 'bg-red-50 border-red-200 text-red-700'
        }`}
      >
        <FaExclamationCircle className="w-10 h-10 opacity-80" />
        <p className="font-semibold text-center">{error}</p>
        <button
          onClick={load}
          className={`mt-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-destructive/20 hover:bg-destructive/40 text-destructive-foreground'
              : 'bg-red-100 hover:bg-red-200 text-red-700'
          }`}
        >
          <FaSyncAlt className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!hostel && !room) {
    return (
      <div
        className={`rounded-xl border p-10 flex flex-col items-center gap-3 text-center ${
          theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
        }`}
      >
        <FaHotel className={`w-12 h-12 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-300'}`} />
        <p className={`text-base font-semibold ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-700'}`}>
          No Hostel Assigned
        </p>
        <p className={`text-xs max-w-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
          You haven't been assigned a hostel room yet. Contact the hostel administration for assistance.
        </p>
      </div>
    );
  }

  const roomTypeBadge = ROOM_TYPE_COLORS[room?.room_type ?? ''] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className={`w-full space-y-4 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>

      {/* ── Page title ──────────────────────────────────────────────────── */}
      <div className={`border rounded-xl p-4 shadow-sm ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <FaHotel className="w-4 h-4" />
          </div>
          <div>
            <h1 className={`text-base font-bold leading-tight ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
              My Hostel Details
            </h1>
            <p className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
              Your hostel accommodation information
            </p>
          </div>
        </div>
      </div>

      {/* ── Hostel + Room row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Hostel card */}
        {hostel && (
          <div
            className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
              theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
            }`}
          >
            {/* accent stripe */}
            <div className="absolute top-0 left-0 h-full w-1 rounded-l-xl bg-blue-500" />
            <div className="pl-3">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  <FaBuilding className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
                    Hostel
                  </p>
                  <p className={`text-base font-bold leading-tight ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                    {hostel.name}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {hostel.gender && (
                  <InfoRow
                    icon={<FaUsers size={12} />}
                    label="Gender"
                    value={hostel.gender === 'M' ? 'Male Hostel' : 'Female Hostel'}
                    theme={theme}
                  />
                )}
                {hostel.address && (
                  <InfoRow icon={<FaMapMarkerAlt size={12} />} label="Address" value={hostel.address} theme={theme} />
                )}
                {hostel.contact && (
                  <InfoRow icon={<FaPhone size={12} />} label="Contact" value={hostel.contact} theme={theme} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Room card */}
        {room && (
          <div
            className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
              theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
            }`}
          >
            {/* accent stripe */}
            <div className="absolute top-0 left-0 h-full w-1 rounded-l-xl bg-indigo-500" />
            <div className="pl-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-indigo-900/40 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    <FaBed className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>
                      Room
                    </p>
                    <p className={`text-base font-bold leading-tight ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>
                      {room.room_number ?? '—'}
                    </p>
                  </div>
                </div>
                {room.room_type && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${roomTypeBadge}`}>
                    {room.room_type_display ?? room.room_type}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <InfoRow
                  icon={<FaLayerGroup size={12} />}
                  label="Floor"
                  value={room.floor !== 'N/A' ? room.floor : 'Ground Floor'}
                  theme={theme}
                />
                {(room.capacity != null && room.current_occupancy != null) && (
                  <OccupancyBar
                    current={room.current_occupancy!}
                    capacity={room.capacity!}
                    theme={theme}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Staff cards row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StaffCard
          role="Hostel Warden"
          person={warden}
          color={theme === 'dark' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}
          theme={theme}
        />
        <StaffCard
          role="Caretaker"
          person={caretaker}
          color={theme === 'dark' ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-50 text-orange-600'}
          theme={theme}
        />
      </div>

      {/* ── Raise Issue Button ───────────────────────────────────────────── */}
      {room && (
        <div className="mt-4">
          <button
            onClick={() => setIsRaiseIssueModalOpen(true)}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            <FaExclamationTriangle className="w-4 h-4" />
            Raise an Issue
          </button>
        </div>
      )}

      {/* ── Meal Management Section ──────────────────────────────────────── */}
      <div className="mt-6">
        <div className={`rounded-xl border p-4 shadow-sm ${theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-400'}`}>Today's Menu</p>
              <p className={`text-base font-bold ${theme === 'dark' ? 'text-card-foreground' : 'text-gray-900'}`}>Meals for today</p>
            </div>
          </div>

          {todayMenus.length === 0 ? (
            <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>No menus available for today.</p>
          ) : (
            <div className="space-y-4">
              {todayMenus.map((m) => {

                return (
                  <div key={m.id}>
                    <div
                      className={`rounded-lg border p-4 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {getMealTypeLabel(m.meal_type_code || m.meal_label || '')}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <span className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>🕐</span>
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                {m.time_from && m.time_to ? `${m.time_from.substring(0, 5)} - ${m.time_to.substring(0, 5)}` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2" />
                      </div>

                      {/* Menu Items */}
                      {m.items && m.items.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {m.items.map((item: any, idx: number) => {
                            const isVeg = typeof item === 'object' ? item.vegetarian : true;
                            const name = typeof item === 'object' ? item.name : item;
                            return (
                              <div
                                key={idx}
                                className={`rounded-full px-3 py-1 text-xs font-medium flex items-center gap-1 ${
                                  isVeg
                                    ? theme === 'dark'
                                      ? 'bg-green-900/30 text-green-300'
                                      : 'bg-green-100 text-green-700'
                                    : theme === 'dark'
                                    ? 'bg-red-900/30 text-red-300'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isVeg ? (
                                  <FaLeaf className="h-3 w-3" />
                                ) : (
                                  <FaDrumstickBite className="h-3 w-3" />
                                )}
                                {name}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Raise Issue Modal ────────────────────────────────────────────── */}
      <RaiseIssueModal
        isOpen={isRaiseIssueModalOpen}
        onClose={() => setIsRaiseIssueModalOpen(false)}
        roomId={room?.id || 0}
        roomName={room?.room_number}
        onSuccess={() => {
          // Optionally refresh data or show success message
          toast({
            title: 'Issue Raised',
            description: 'Your issue has been successfully reported to the hostel management.',
            variant: 'default'
          });
        }}
      />
    </div>
  );
};

export default StudentHostelDetails;
