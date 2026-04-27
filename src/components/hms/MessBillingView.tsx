import React, { useState, useEffect } from 'react';
import {
  getMessBilling,
  getHostelMessStats,
  getHostels,
} from '../../utils/hms_api';
import { useToast } from '../../hooks/use-toast';
import {
  Receipt,
  TrendingUp,
  Users,
  Utensils,
  AlertCircle,
  Filter,
  DollarSign,
  Wallet,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  SkeletonPageHeader, 
  SkeletonStatsGrid, 
  SkeletonTable 
} from '../ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardCard from '../common/DashboardCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MessBilling {
  id: number;
  student_name: string;
  enrollment_no: string;
  hostel_name: string;
  month: string;
  month_display: string;
  total_meals: number;
  meals_consumed: number;
  meals_skipped: number;
  total_cost: number;
  discounted_cost: number;
  paid: boolean;
  paid_date?: string;
}

interface Hostel {
  id: number;
  name: string;
}

interface HostelStats {
  hostel: string;
  month: string;
  statistics: {
    total_students: number;
    total_meals_planned: number;
    total_meals_consumed: number;
    total_meals_skipped: number;
    total_revenue: number;
    paid_amount: number;
  };
}

const MessBillingView: React.FC = () => {
  const { toast } = useToast();

  const [billing, setBilling] = useState<MessBilling[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [stats, setStats] = useState<HostelStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedHostel, setSelectedHostel] = useState<string>('');
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'unpaid'>('all');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedHostel) {
      loadHostelStats(parseInt(selectedHostel));
    }
  }, [selectedHostel]);

  const loadInitialData = async () => {
    setInitialLoading(true);
    try {
      const [billingRes, hostelsRes] = await Promise.all([
        getMessBilling(),
        getHostels(),
      ]);

      if (billingRes.success && billingRes.results) setBilling(billingRes.results);
      if (hostelsRes.success && hostelsRes.results) {
        setHostels(hostelsRes.results);
        if (hostelsRes.results.length > 0) {
          setSelectedHostel(hostelsRes.results[0].id.toString());
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load billing data',
        variant: 'destructive',
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const loadHostelStats = async (hostelId: number) => {
    setLoading(true);
    try {
      const response = await getHostelMessStats(hostelId);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load hostel stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBilling = () => {
    let filtered = billing;

    if (selectedHostel) {
      filtered = filtered.filter((b) => b.hostel_name === hostels.find((h) => h.id === parseInt(selectedHostel))?.name);
    }

    if (filterPaid === 'paid') {
      filtered = filtered.filter((b) => b.paid);
    } else if (filterPaid === 'unpaid') {
      filtered = filtered.filter((b) => !b.paid);
    }

    return filtered;
  };

  const filteredBilling = getFilteredBilling();

  const totalRevenue = filteredBilling.reduce((sum, b) => sum + Number(b.discounted_cost || 0), 0);
  const paidAmount = filteredBilling.filter((b) => b.paid).reduce((sum, b) => sum + Number(b.discounted_cost || 0), 0);
  const unpaidAmount = filteredBilling.filter((b) => !b.paid).reduce((sum, b) => sum + Number(b.discounted_cost || 0), 0);

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <SkeletonPageHeader />
        <SkeletonStatsGrid />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Revenue"
          value={`₹${(stats?.statistics.total_revenue || 0).toLocaleString()}`}
          description="Estimated monthly billing"
          icon={<DollarSign className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <DashboardCard
          title="Total Collected"
          value={`₹${(stats?.statistics.paid_amount || 0).toLocaleString()}`}
          description="Payments processed"
          icon={<Wallet className="w-5 h-5" />}
          color="green"
        />
        <DashboardCard
          title="Collection Rate"
          value={`${stats?.statistics.total_revenue ? ((stats.statistics.paid_amount / stats.statistics.total_revenue) * 100).toFixed(1) : '0'}%`}
          description="Paid vs Total"
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <DashboardCard
          title="Total Students"
          value={stats?.statistics.total_students || 0}
          description="Active mess users"
          icon={<Users className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Filters & Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/10 shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle>Billing Records</CardTitle>
                  <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg w-fit">
                    <Button 
                      variant={filterPaid === 'all' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setFilterPaid('all')}
                      className="h-8 text-xs px-3"
                    >All</Button>
                    <Button 
                      variant={filterPaid === 'paid' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setFilterPaid('paid')}
                      className="h-8 text-xs px-3"
                    >Paid</Button>
                    <Button 
                      variant={filterPaid === 'unpaid' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      onClick={() => setFilterPaid('unpaid')}
                      className="h-8 text-xs px-3"
                    >Pending</Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-full max-w-[200px]">
                    <Select value={selectedHostel} onValueChange={setSelectedHostel}>
                      <SelectTrigger className="bg-background border-primary/10 h-10">
                        <div className="flex items-center gap-2">
                          <Filter className="w-3.5 h-3.5 text-primary/70" />
                          <SelectValue placeholder="Select Hostel" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {hostels.map((hostel) => (
                          <SelectItem key={hostel.id} value={hostel.id.toString()}>{hostel.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="">
              <ScrollArea className="h-[calc(100vh-26rem)] min-h-[43vh] custom-scrollbar">
                {loading ? (
                  <div className="space-y-4 p-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-16 w-full bg-muted/50 animate-pulse rounded-md" />
                    ))}
                  </div>
                ) : filteredBilling.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="bg-muted rounded-full p-4 mb-4">
                      <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <p className="font-semibold text-muted-foreground">No records found</p>
                    <p className="text-sm text-muted-foreground/70">Try adjusting your filters.</p>
                  </div>
                ) : (
                  <div className="relative overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left custom-scrollbar">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-4 font-semibold border-b">Student Info</th>
                          <th className="px-4 py-4 font-semibold border-b text-center">Usage</th>
                          <th className="px-4 py-4 font-semibold border-b text-right">Amount</th>
                          <th className="px-4 py-4 font-semibold border-b text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-t border-muted/10">
                      {filteredBilling.map((bill) => (
                        <tr key={bill.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                                {bill.student_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-semibold">{bill.student_name}</p>
                                <p className="text-[11px] text-muted-foreground">{bill.enrollment_no}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <p className="font-medium text-xs">{bill.meals_consumed}/{bill.total_meals}</p>
                              <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500" 
                                  style={{ width: `${(bill.meals_consumed / bill.total_meals) * 100}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-semibold">
                            ₹{bill.discounted_cost.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Badge variant={bill.paid ? "secondary" : "outline"} className={
                              bill.paid 
                                ? "bg-green-500/10 text-green-600 border-green-200/50" 
                                : "bg-red-500/10 text-red-600 border-red-200/50"
                            }>
                              {bill.paid ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                              {bill.paid ? 'Paid' : 'Pending'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 h-full flex flex-col">
          <Card className="border-primary/10 shadow-sm flex-1">
            <CardHeader>
              <CardTitle >Financial Summary</CardTitle>
              <CardDescription>Overall collection for {hostels.find(h => h.id === parseInt(selectedHostel))?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-green-500/5 border border-green-500/10 transition-all hover:bg-green-500/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-full bg-green-500/10 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold truncate">Collected</span>
                </div>
                <span className="font-semibold text-green-600 ml-2 whitespace-nowrap">₹{paidAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 transition-all hover:bg-red-500/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-full bg-red-500/10 shrink-0">
                    <Clock className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-semibold truncate">Outstanding</span>
                </div>
                <span className="font-semibold text-red-600 ml-2 whitespace-nowrap">₹{unpaidAmount.toLocaleString()}</span>
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground font-medium">Collection Progress</span>
                  <span className="font-semibold">{totalRevenue > 0 ? ((paidAmount / totalRevenue) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000" 
                    style={{ width: `${totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <Separator className="my-4" />
              
              <Separator className="my-4" />
              
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Mess Activity</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-orange-500" />
                    <span>Total Meals Consumed</span>
                  </div>
                  <span className="font-semibold">{stats?.statistics.total_meals_consumed.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>Meals Skipped</span>
                  </div>
                  <span className="font-medium text-muted-foreground">{stats?.statistics.total_meals_skipped.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessBillingView;
