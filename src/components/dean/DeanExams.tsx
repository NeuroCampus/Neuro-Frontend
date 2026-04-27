import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_ENDPOINT } from "@/utils/config";
import { fetchWithTokenRefresh } from "@/utils/authService";
import { useTheme } from "../../context/ThemeContext";
import { SkeletonStatsGrid, SkeletonTable, SkeletonPageHeader, SkeletonCard } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { RefreshCcw, BookOpen, Clock, Calendar, CheckCircle2, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

type ExamEntry = {
  id: string | number;
  title?: string;
  subject?: string;
  faculty_assignment?: {
    faculty?: string;
    subject?: string;
    semester?: number;
    section?: string;
  };
  date: string; // ISO or YYYY-MM-DD
  start_time?: string; // HH:MM
  end_time?: string; // HH:MM
  room?: string;
  is_published?: boolean;
};

const now = () => new Date();

const parseDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return null;
  const t = timeStr || '00:00';
  // assume dateStr is YYYY-MM-DD or ISO
  const iso = `${dateStr}T${t}:00`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
};

const computeStatus = (e: ExamEntry) => {
  const start = parseDateTime(e.date, e.start_time);
  const end = parseDateTime(e.date, e.end_time) || (start ? new Date(start.getTime() + 1000 * 60 * 60) : null);
  const cur = now();
  if (start && end) {
    if (cur >= start && cur <= end) return 'ongoing';
    if (cur < start) return 'upcoming';
    return 'past';
  }
  return 'scheduled';
};

const formatDate = (dstr?: string) => {
  if (!dstr) return '-';
  try {
    const d = new Date(dstr);
    return d.toLocaleDateString();
  } catch {
    return dstr;
  }
};

const DeanExams: React.FC = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<ExamEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>('all');
  const [upcomingOnly, setUpcomingOnly] = useState<boolean>(false);
  const [firstLoad, setFirstLoad] = useState(true);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      // build query params
      const qs: string[] = [];
      if (branchId && branchId !== 'all') qs.push(`branch_id=${encodeURIComponent(branchId)}`);
      if (upcomingOnly) qs.push(`upcoming=1`);
      const url = `${API_ENDPOINT}/dean/reports/exams/${qs.length ? `?${qs.join('&')}` : ''}`;
      console.debug('Loading exams from', url);
      const res = await fetchWithTokenRefresh(url);
      const json = await res.json();
      console.debug('Exams response', json);
      if (json.success) {
        const list: ExamEntry[] = Array.isArray(json.data) ? json.data : (json.data || []);
        setExams(list.map((x) => ({ ...x, id: x.id })));
      } else {
        setExams([]);
        setError(json.message || 'Failed to load exams');
      }
    } catch (e: any) {
      setExams([]);
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
      setFirstLoad(false);
    }
  };

  useEffect(() => { load(); }, [branchId, upcomingOnly]);

  // load branches for filter
  useEffect(() => {
    const boot = async () => {
      try {
        const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/branches/`);
        const json = await res.json();
        if (json.success) {
          const normalized = (json.data || []).map((b: any) => ({ id: (b.id || b.branch_id).toString(), name: b.name || b.branch }));
          setBranches(normalized);
        }
      } catch (e) {
        console.error('Failed to load branches', e);
      }
    };
    boot();
  }, []);

  const publishExam = async (id: string | number) => {
    if (!confirm('Publish exam results?')) return;
    try {
      const res = await fetchWithTokenRefresh(`${API_ENDPOINT}/dean/reports/exams/${id}/publish/`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('Published');
        load();
      } else {
        alert(json.message || 'Failed');
      }
    } catch (e: any) {
      alert(e?.message || 'Network error');
    }
  };

  const grouped = {
    ongoing: [] as ExamEntry[],
    upcoming: [] as ExamEntry[],
    past: [] as ExamEntry[],
    other: [] as ExamEntry[],
  };
  exams.forEach((ex) => {
    const s = computeStatus(ex);
    if (s === 'ongoing') grouped.ongoing.push(ex);
    else if (s === 'upcoming') grouped.upcoming.push(ex);
    else if (s === 'past') grouped.past.push(ex);
    else grouped.other.push(ex);
  });

  const countCards = [
    { key: 'ongoing', title: 'Ongoing', count: grouped.ongoing.length, color: 'green' },
    { key: 'upcoming', title: 'Upcoming', count: grouped.upcoming.length, color: 'blue' },
    { key: 'past', title: 'Past', count: grouped.past.length, color: 'gray' },
  ];

  return (
    <div className={`${theme === 'dark' ? 'bg-background text-foreground' : 'bg-gray-50 text-gray-900'}`}>
      <Card className={theme === 'dark' ? 'bg-card border border-border shadow-md' : 'bg-white border border-gray-200 shadow-md'}>
        <CardContent className="px-6 pb-6 pt-2 space-y-8">
          {firstLoad ? (
            <div className="space-y-6">
              <SkeletonStatsGrid items={4} />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SkeletonCard className="h-24" />
                <SkeletonCard className="h-24" />
                <SkeletonCard className="h-24" />
                <SkeletonCard className="h-24" />
              </div>
              <SkeletonTable rows={10} cols={8} />
            </div>
          ) : (
            <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
              

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {countCards.map(c => (
                  <div key={c.key} className={`p-6 rounded-xl border shadow-sm transition-all hover:shadow-md flex items-center gap-6 ${
                    theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-300'
                  }`}>
                    <div className={`p-3 rounded-xl ${
                      c.color === 'green' ? (theme === 'dark' ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600') :
                      c.color === 'blue' ? (theme === 'dark' ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600') :
                      (theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600')
                    }`}>
                      {c.key === 'ongoing' ? <Clock className="w-6 h-6" /> : 
                       c.key === 'upcoming' ? <Calendar className="w-6 h-6" /> : 
                       <History className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        {c.title}
                      </div>
                      <div className={`text-3xl font-bold mt-1 ${
                        c.color === 'green' ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') :
                        c.color === 'blue' ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') :
                        (theme === 'dark' ? 'text-foreground' : 'text-gray-900')
                      }`}>
                        {c.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters Row */}
              <div className="flex flex-col md:flex-row items-end gap-6 mt-4 mb-4">
                <div className="w-full md:w-72">
                  <label className={`text-sm font-medium block  ${theme === 'dark' ? 'text-foreground' : 'text-gray-700'}`}>
                    Branch
                  </label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'}`}>
                      <SelectValue placeholder="All branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All branches</SelectItem>
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className={`p-3 px-4 rounded-xl border h-[42px] flex items-center ${theme === 'dark' ? 'bg-muted/30 border-border' : 'bg-gray-50 border-gray-200'}`}>
                  <label className="flex items-center gap-3 text-sm font-medium cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" 
                      checked={upcomingOnly} 
                      onChange={e => setUpcomingOnly(e.target.checked)} 
                    /> 
                    <span>Show upcoming only</span>
                  </label>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-10">
                {['ongoing','upcoming','past','other'].map((sectionKey) => {
                  const list = (grouped as any)[sectionKey];
                  if (list.length === 0 && sectionKey !== 'upcoming' && sectionKey !== 'ongoing') return null;
                  
                  return (
                    <div key={sectionKey} className="space-y-4">
                      <div className="flex items-center gap-2 px-1">
                        <div className={`w-2 h-2 rounded-full ${
                          sectionKey === 'ongoing' ? 'bg-green-500' :
                          sectionKey === 'upcoming' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`} />
                        <h3 className="font-semibold text-lg capitalize tracking-tight">
                          {sectionKey === 'other' ? 'Scheduled' : sectionKey} Exams
                        </h3>
                        <Badge variant="outline" className="ml-2 font-normal">
                          {list.length} {list.length === 1 ? 'Exam' : 'Exams'}
                        </Badge>
                      </div>

                      <div className={`rounded-xl border shadow-sm overflow-hidden ${
                        theme === 'dark' ? 'bg-card border-border' : 'bg-white border-gray-200'
                      }`}>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-border">
                            <thead className={theme === 'dark' ? 'bg-muted/50' : 'bg-gray-50'}>
                              <tr className={`text-left text-xs font-semibold uppercase tracking-wider ${
                                theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'
                              }`}>
                                <th className="px-6 py-4">Exam Details</th>
                                <th className="px-6 py-4 text-center">Date & Time</th>
                                <th className="px-6 py-4">Venue</th>
                                <th className="px-6 py-4">Assignment</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Published</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-border' : 'divide-gray-200'}`}>
                              {list.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                                    <div className="flex flex-col items-center gap-2">
                                      <BookOpen className="w-8 h-8 opacity-20" />
                                      <p>No {sectionKey} exams found</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : list.map((ex: ExamEntry) => (
                                <tr key={ex.id} className={`text-sm hover:${theme === 'dark' ? 'bg-muted/30' : 'bg-gray-50'} transition-colors`}>
                                  <td className="px-6 py-4">
                                    <div className="font-semibold text-foreground">
                                      {ex.title || ex.faculty_assignment?.subject || ex.subject || 'Exam'}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      ID: #{ex.id}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center whitespace-nowrap">
                                    <div className="font-medium">{formatDate(ex.date)}</div>
                                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                                      <Clock className="w-3 h-3" />
                                      {ex.start_time || '-'} - {ex.end_time || '-'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Badge variant="secondary" className="font-medium">
                                      {ex.room || 'TBD'}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4">
                                    {ex.faculty_assignment ? (
                                      <div className="flex flex-col gap-1">
                                        <div className="text-xs font-medium">Sem {ex.faculty_assignment.semester} • {ex.faculty_assignment.section}</div>
                                        <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                          {ex.faculty_assignment.faculty}
                                        </div>
                                      </div>
                                    ) : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <Badge className={`capitalize ${
                                      computeStatus(ex) === 'ongoing' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                      computeStatus(ex) === 'upcoming' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                      'bg-gray-500/10 text-gray-600 border-gray-500/20'
                                    }`} variant="outline">
                                      {computeStatus(ex)}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    {ex.is_published ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                                    ) : (
                                      <span className="text-xs text-muted-foreground italic">Draft</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {!ex.is_published && (
                                      <Button 
                                        variant="default"
                                        size="sm"
                                        onClick={() => publishExam(ex.id)}
                                        className="h-8 text-xs font-semibold"
                                      >
                                        Publish
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeanExams;

