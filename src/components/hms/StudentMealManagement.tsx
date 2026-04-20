import React, { useState, useEffect } from 'react';
import {
  getWeeklyMenu,
  getTodayMenu,
  skipMeal,
  markMealLeave,
  getMyMealSkips,
} from '../../utils/hms_api';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/use-toast';
import {
  ChefHat,
  UtensilsCrossed,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';

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

interface MealSkip {
  id: number;
  date: string;
  meal_type_detail?: {
    name: string;
  };
  skip_type: string;
  skip_type_display: string;
}

interface WeeklyMenuData {
  [key: string]: {
    day_name: string;
    meals: Meal[];
  };
}

const StudentMealManagement: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === 'dark';

  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenuData | null>(null);
  const [todayMenu, setTodayMenu] = useState<Meal[]>([]);
  const [mealSkips, setMealSkips] = useState<MealSkip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSkipForm, setShowSkipForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const [skipFormData, setSkipFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: '',
    reason: '',
  });

  const [leaveFormData, setLeaveFormData] = useState({
    from_date: new Date().toISOString().split('T')[0],
    to_date: new Date().toISOString().split('T')[0],
    reason: '',
  });

  useEffect(() => {
    loadMealData();
  }, []);

  const loadMealData = async () => {
    setLoading(true);
    try {
      const [weeklyRes, todayRes, skipsRes] = await Promise.all([
        getWeeklyMenu(),
        getTodayMenu(),
        getMyMealSkips(),
      ]);

      if (weeklyRes.success && weeklyRes.data) setWeeklyMenu(weeklyRes.data);
      if (todayRes.success && todayRes.results) setTodayMenu(todayRes.results);
      if (skipsRes.success && skipsRes.results) setMealSkips(skipsRes.results);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load meal data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkipMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skipFormData.meal_type) {
      toast({
        title: 'Validation Error',
        description: 'Please select a meal type',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await skipMeal({
        date: skipFormData.date,
        meal_type: parseInt(skipFormData.meal_type),
        reason: skipFormData.reason,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Meal skipped successfully',
        });
        setShowSkipForm(false);
        setSkipFormData({
          date: new Date().toISOString().split('T')[0],
          meal_type: '',
          reason: '',
        });
        loadMealData();
      } else {
        throw new Error(response.message || 'Failed to skip meal');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to skip meal',
        variant: 'destructive',
      });
    }
  };

  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFormData.from_date || !leaveFormData.to_date) {
      toast({
        title: 'Validation Error',
        description: 'Please select both from and to dates',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await markMealLeave({
        from_date: leaveFormData.from_date,
        to_date: leaveFormData.to_date,
        reason: leaveFormData.reason,
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: 'Leave marked successfully',
        });
        setShowLeaveForm(false);
        setLeaveFormData({
          from_date: new Date().toISOString().split('T')[0],
          to_date: new Date().toISOString().split('T')[0],
          reason: '',
        });
        loadMealData();
      } else {
        throw new Error(response.message || 'Failed to mark leave');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark leave',
        variant: 'destructive',
      });
    }
  };

  const isSkipped = (date: string, mealTypeId: number) => {
    return mealSkips.some(
      (skip) => skip.date === date && (skip.meal_type_detail?.name || 'All')
    );
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-sm`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className={`h-6 w-6 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Meal Management
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSkipForm(!showSkipForm)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              isDark
                ? 'bg-amber-600/80 text-white hover:bg-amber-600'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            }`}
          >
            <Plus className="h-4 w-4" />
            Skip Meal
          </button>
          <button
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              isDark
                ? 'bg-red-600/80 text-white hover:bg-red-600'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <Plus className="h-4 w-4" />
            Mark Leave
          </button>
        </div>
      </div>

      {/* Skip Meal Form */}
      {showSkipForm && (
        <div className={`mb-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-4`}>
          <h3 className={`mb-4 flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <UtensilsCrossed className="h-4 w-4" />
            Skip a Meal
          </h3>
          <form onSubmit={handleSkipMeal} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date *
                </label>
                <input
                  type="date"
                  value={skipFormData.date}
                  onChange={(e) => setSkipFormData({ ...skipFormData, date: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meal Type *
                </label>
                <select
                  value={skipFormData.meal_type}
                  onChange={(e) => setSkipFormData({ ...skipFormData, meal_type: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                >
                  <option value="">Select Meal Type</option>
                  {todayMenu.map((meal) => (
                    <option key={meal.id} value={meal.meal_type_detail.name}>
                      {meal.meal_type_detail.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason
                </label>
                <input
                  type="text"
                  value={skipFormData.reason}
                  onChange={(e) => setSkipFormData({ ...skipFormData, reason: e.target.value })}
                  placeholder="Optional reason"
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-amber-600 py-2 font-medium text-white hover:bg-amber-700 transition-colors"
              >
                Skip Meal
              </button>
              <button
                type="button"
                onClick={() => setShowSkipForm(false)}
                className={`flex-1 rounded-lg border ${
                  isDark
                    ? 'border-slate-600 text-gray-300 hover:bg-slate-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } py-2 font-medium transition-colors`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mark Leave Form */}
      {showLeaveForm && (
        <div className={`mb-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-4`}>
          <h3 className={`mb-4 flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <AlertCircle className="h-4 w-4" />
            Mark Leave from Mess
          </h3>
          <form onSubmit={handleMarkLeave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  From Date *
                </label>
                <input
                  type="date"
                  value={leaveFormData.from_date}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, from_date: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  To Date *
                </label>
                <input
                  type="date"
                  value={leaveFormData.to_date}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, to_date: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reason
                </label>
                <input
                  type="text"
                  value={leaveFormData.reason}
                  onChange={(e) => setLeaveFormData({ ...leaveFormData, reason: e.target.value })}
                  placeholder="e.g., Vacation, Sick leave"
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 transition-colors"
              >
                Mark Leave
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveForm(false)}
                className={`flex-1 rounded-lg border ${
                  isDark
                    ? 'border-slate-600 text-gray-300 hover:bg-slate-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                } py-2 font-medium transition-colors`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Menu */}
      <div className="mb-6">
        <h3 className={`mb-4 flex items-center gap-2 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Clock className={`h-5 w-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          Today's Menu
        </h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className={`h-6 w-6 animate-spin rounded-full border-4 ${isDark ? 'border-slate-700 border-t-orange-400' : 'border-gray-300 border-t-orange-600'}`} />
          </div>
        ) : todayMenu.length === 0 ? (
          <div className={`rounded-lg border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-gray-50'} py-6 text-center`}>
            <ChefHat className={`mx-auto h-10 w-10 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No meals scheduled for today
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {todayMenu.map((meal) => (
              <div
                key={meal.id}
                className={`rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-4`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {meal.meal_type_detail.name}
                  </h4>
                  <CheckCircle className={`h-5 w-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <p className={`mb-3 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Clock className="inline h-4 w-4 mr-1" />
                  {meal.meal_type_detail.time_from} - {meal.meal_type_detail.time_to}
                </p>
                <div className="flex flex-wrap gap-2">
                  {meal.items.map((item) => (
                    <span
                      key={item.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.vegetarian
                          ? isDark
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-green-100 text-green-700'
                          : isDark
                            ? 'bg-red-900/30 text-red-300'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.name} {item.vegetarian ? '🥗' : '🍗'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Menu */}
      {weeklyMenu && (
        <div>
          <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Weekly Menu
          </h3>
          <div className="space-y-4">
            {Object.entries(weeklyMenu).map(([day, dayData]) => (
              dayData.meals.length > 0 && (
                <div
                  key={day}
                  className={`rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-4`}
                >
                  <h4 className={`mb-3 text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {dayData.day_name}
                  </h4>
                  <div className="space-y-2">
                    {dayData.meals.map((meal) => (
                      <div key={meal.id} className={`rounded px-3 py-2 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <p className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {meal.meal_type_detail.name} ({meal.meal_type_detail.time_from})
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {meal.items.map((item) => (
                            <span
                              key={item.id}
                              className={`rounded text-xs px-2 py-1 ${
                                item.vegetarian
                                  ? isDark
                                    ? 'bg-green-900/20 text-green-300'
                                    : 'bg-green-100 text-green-700'
                                  : isDark
                                    ? 'bg-red-900/20 text-red-300'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMealManagement;
