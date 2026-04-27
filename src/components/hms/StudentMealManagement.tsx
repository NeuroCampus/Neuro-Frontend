import React, { useState, useEffect } from 'react';
import { getTodayMenu } from '../../utils/hms_api';
import { useToast } from '../../hooks/use-toast';
import {
  ChefHat,
  Clock,
  Leaf,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { motion } from 'framer-motion';

interface MenuItem {
  id: number;
  name: string;
  vegetarian: boolean;
  cost: number;
  calories?: number;
}

interface Meal {
  id: number;
  meal_type: number;
  meal_type_detail: {
    name: string;
    time_from: string;
    time_to: string;
  };
  items: MenuItem[];
  day_name?: string;
}

const StudentMealManagement: React.FC = () => {
  const { toast } = useToast();

  const [todayMenu, setTodayMenu] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodayMenu();
  }, []);

  const loadTodayMenu = async () => {
    setLoading(true);
    try {
      const todayRes = await getTodayMenu();
      if (todayRes.success && todayRes.results) {
        setTodayMenu(todayRes.results);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load today\'s menu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMealIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return <Coffee className="w-5 h-5" />;
    if (lower.includes('lunch')) return <Sun className="w-5 h-5" />;
    if (lower.includes('dinner')) return <Moon className="w-5 h-5" />;
    return <Utensils className="w-5 h-5" />;
  };

  const getMealGradient = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return "from-orange-500/20 to-yellow-500/10 border-orange-200/50";
    if (lower.includes('lunch')) return "from-blue-500/20 to-cyan-500/10 border-blue-200/50";
    if (lower.includes('dinner')) return "from-indigo-500/20 to-purple-500/10 border-indigo-200/50";
    return "from-slate-500/20 to-slate-500/10 border-slate-200/50";
  };

  const getMealAccentColor = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('breakfast')) return "text-orange-600";
    if (lower.includes('lunch')) return "text-blue-600";
    if (lower.includes('dinner')) return "text-indigo-600";
    return "text-slate-600";
  };

  return (
    <Card className="border-primary/10 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-lg">
              <ChefHat className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Today's Mess Menu</CardTitle>
              <CardDescription>Scheduled meals and nutrition info</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-none">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 w-full bg-muted/50 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : todayMenu.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/5">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-bold text-muted-foreground">No menu scheduled</p>
            <p className="text-sm text-muted-foreground">The mess menu for today hasn't been uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {todayMenu.map((meal) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`group relative rounded-2xl border p-5 bg-gradient-to-br ${getMealGradient(meal.meal_type_detail.name)} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-background/80 shadow-sm ${getMealAccentColor(meal.meal_type_detail.name)}`}>
                      {getMealIcon(meal.meal_type_detail.name)}
                    </div>
                    <h3 className="font-bold text-lg">{meal.meal_type_detail.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-background/50 px-2 py-1 rounded-md border">
                    <Clock className="w-3 h-3" />
                    {meal.meal_type_detail.time_from} - {meal.meal_type_detail.time_to}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {meal.items.map((item) => (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className={`h-7 px-3 flex items-center gap-1.5 bg-background/90 shadow-sm transition-all hover:scale-105 ${
                        item.vegetarian 
                        ? "border-green-500/20 text-green-700" 
                        : "border-red-500/20 text-red-700"
                      }`}
                    >
                      {item.vegetarian && <Leaf className="w-3 h-3" />}
                      <span className="font-medium text-[11px]">{item.name}</span>
                      {item.calories && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="text-[9px] opacity-60 font-mono">{item.calories} kcal</span>
                        </>
                      )}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentMealManagement;
