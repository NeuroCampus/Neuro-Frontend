import React, { useState, useEffect } from 'react';
import {
  getMenus,
  manageMenu,
  getMenuItems,
  manageMenuItem,
  getHostels,
  getMealSkips,
} from '../../utils/hms_api';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../hooks/use-toast';
import {
  Plus,
  Trash2,
  Edit,
  ChefHat,
  UtensilsCrossed,
  Calendar,
  Clock,
  Users,
  TrendingUp,
} from 'lucide-react';

interface MealType {
  id: number;
  name: string;
  time_from?: string;
  time_to?: string;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  vegetarian: boolean;
  cost: number;
  calories?: number;
  is_active?: boolean;
}

interface Menu {
  id: number;
  hostel: number;
  hostel_name: string;
  day_of_week: string;
  day_name: string;
  meal_type: number;
  meal_type_detail?: MealType;
  items: MenuItem[];
  is_recurring: boolean;
  date?: string;
}

interface Hostel {
  id: number;
  name: string;
}

interface MealSkip {
  id: number;
  date: string;
  student_name: string;
  enrollment_no: string;
  skip_type_display: string;
}

const DAY_OPTIONS = [
  { value: '0', label: 'Monday' },
  { value: '1', label: 'Tuesday' },
  { value: '2', label: 'Wednesday' },
  { value: '3', label: 'Thursday' },
  { value: '4', label: 'Friday' },
  { value: '5', label: 'Saturday' },
  { value: '6', label: 'Sunday' },
];

// Map of choice codes to display names and times
const MEAL_TYPE_DISPLAY = {
  'BR': { label: 'Breakfast', time_from: '07:30', time_to: '09:00' },
  'LN': { label: 'Lunch', time_from: '12:00', time_to: '14:00' },
  'SN': { label: 'Snacks', time_from: '16:00', time_to: '17:30' },
  'DN': { label: 'Dinner', time_from: '19:00', time_to: '21:00' },
};

const DEFAULT_MEAL_TYPES = [
  { name: 'BR', time_from: '07:30', time_to: '09:00' },
  { name: 'LN', time_from: '12:00', time_to: '14:00' },
  { name: 'SN', time_from: '16:00', time_to: '17:30' },
  { name: 'DN', time_from: '19:00', time_to: '21:00' },
];

const getMealTypeLabel = (code: string) => {
  return MEAL_TYPE_DISPLAY[code as keyof typeof MEAL_TYPE_DISPLAY]?.label || code;
};

const MenuManagement: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const isDark = theme === 'dark';

  const [menus, setMenus] = useState<Menu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [mealSkips, setMealSkips] = useState<MealSkip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<string>('');
  const [showSkips, setShowSkips] = useState(false);
  
  // Food Item Management
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editingFoodItem, setEditingFoodItem] = useState<MenuItem | null>(null);
  const [foodFormData, setFoodFormData] = useState({
    name: '',
    description: '',
    vegetarian: true,
    cost: '',
    calories: '',
  });

  const [formData, setFormData] = useState({
    hostel: '',
    day_of_week: '0',
    meal_type: '',
    date: '',
    items: [] as number[],
    is_recurring: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Initial load: only fetch menus to keep initial load minimal
      const menusRes = await getMenus();
      if (menusRes.success && menusRes.results) setMenus(menusRes.results);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load menu data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Lazy loaders
  const loadHostels = async () => {
    if (hostels.length > 0) return;
    try {
      const res = await getHostels();
      if (res.success && res.results) {
        setHostels(res.results);
        if (res.results.length > 0 && !selectedHostel) setSelectedHostel(res.results[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to load hostels', e);
    }
  };

  const loadMealSkips = async () => {
    try {
      const res = await getMealSkips();
      if (res.success && res.results) setMealSkips(res.results);
    } catch (e) {
      console.error('Failed to load meal skips', e);
    }
  };

  // Load menu items only when form is opened
  const loadMenuItems = async () => {
    try {
      const itemsRes = await getMenuItems();
      if (itemsRes.success && itemsRes.results) {
        setMenuItems(itemsRes.results);
      }
    } catch (error) {
      console.error('Failed to load menu items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load food items',
        variant: 'destructive',
      });
    }
  };

  // Reload menus and menu items after food item changes
  const reloadMenuData = async () => {
    try {
      const [menusRes, itemsRes] = await Promise.all([getMenus(), getMenuItems()]);
      if (menusRes.success && menusRes.results) setMenus(menusRes.results);
      if (itemsRes.success && itemsRes.results) setMenuItems(itemsRes.results);
    } catch (error) {
      console.error('Failed to reload menu data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hostel || !formData.meal_type) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data: any = {
        hostel: parseInt(formData.hostel),
        day_of_week: formData.day_of_week,
        meal_type: isNaN(Number(formData.meal_type)) ? formData.meal_type : parseInt(formData.meal_type),
        items: formData.items,
        is_recurring: formData.is_recurring,
      };

      // include date when provided (for one-time menus)
      if (formData.date && !formData.is_recurring) {
        data.date = formData.date; // YYYY-MM-DD
      } else {
        data.date = null;
      }

      let response;
      if (editingMenu) {
        response = await manageMenu(data, editingMenu.id, 'PUT');
      } else {
        response = await manageMenu(data, undefined, 'POST');
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: editingMenu ? 'Menu updated successfully' : 'Menu created successfully',
        });
        setShowForm(false);
        setEditingMenu(null);
        setFormData({
          hostel: '',
          day_of_week: '0',
          meal_type: '',
          date: '',
          items: [],
          is_recurring: true,
        });
        loadInitialData();
      } else {
        throw new Error(response.message || 'Failed to save menu');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save menu',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setFormData({
      hostel: menu.hostel.toString(),
      day_of_week: menu.day_of_week,
      meal_type: menu.meal_type.toString(),
      date: menu.date || '',
      items: menu.items.map((item) => item.id),
      is_recurring: menu.is_recurring,
    });
    setShowForm(true);
    // Load required data for editing lazily
    loadHostels();
    loadMenuItems();
  };

  // When skip tracking is requested, load meal skips lazily
  useEffect(() => {
    if (showSkips && mealSkips.length === 0) {
      loadMealSkips();
    }
  }, [showSkips]);

  const handleDelete = async (menuId: number) => {
    if (!confirm('Are you sure you want to delete this menu?')) return;

    try {
      const response = await manageMenu(undefined, menuId, 'DELETE');
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Menu deleted successfully',
        });
        loadInitialData();
      } else {
        throw new Error(response.message || 'Failed to delete menu');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete menu',
        variant: 'destructive',
      });
    }
  };

  const toggleItemSelection = (itemId: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.includes(itemId)
        ? prev.items.filter((id) => id !== itemId)
        : [...prev.items, itemId],
    }));
  };

  // Food Item Handlers
  const handleFoodItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodFormData.name || !foodFormData.cost) {
      toast({
        title: 'Validation Error',
        description: 'Name and Cost are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        name: foodFormData.name,
        description: foodFormData.description,
        vegetarian: foodFormData.vegetarian,
        cost: parseInt(foodFormData.cost),
        calories: foodFormData.calories ? parseInt(foodFormData.calories) : null,
      };

      let response;
      if (editingFoodItem) {
        response = await manageMenuItem(data, editingFoodItem.id, 'PUT');
      } else {
        response = await manageMenuItem(data, undefined, 'POST');
      }

      if (response.success) {
        toast({
          title: 'Success',
          description: editingFoodItem ? 'Food item updated' : 'Food item created',
        });
        setShowFoodForm(false);
        setEditingFoodItem(null);
        setFoodFormData({
          name: '',
          description: '',
          vegetarian: true,
          cost: '',
          calories: '',
        });
        // Reload only menu items and menus
        await Promise.all([loadMenuItems(), getMenus().then(res => {
          if (res.success && res.results) setMenus(res.results);
        })]);
      } else {
        throw new Error(response.message || 'Failed to save food item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save food item',
        variant: 'destructive',
      });
    }
  };

  const handleEditFoodItem = (item: MenuItem) => {
    setEditingFoodItem(item);
    setFoodFormData({
      name: item.name,
      description: item.description || '',
      vegetarian: item.vegetarian,
      cost: item.cost.toString(),
      calories: item.calories ? item.calories.toString() : '',
    });
    setShowFoodForm(true);
  };

  const handleDeleteFoodItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to delete this food item?')) return;

    try {
      const response = await manageMenuItem(undefined, itemId, 'DELETE');
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Food item deleted successfully',
        });
        // Reload only menu items and menus
        await Promise.all([loadMenuItems(), getMenus().then(res => {
          if (res.success && res.results) setMenus(res.results);
        })]);
      } else {
        throw new Error(response.message || 'Failed to delete food item');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete food item',
        variant: 'destructive',
      });
    }
  };

  const getSkipCountForMenu = (menu: Menu) => {
    return mealSkips.filter((skip) => {
      if (menu.date) {
        return skip.date === menu.date;
      }
      const skipDate = new Date(skip.date);
      const skipDay = skipDate.getDay().toString();
      return menu.hostel_name && skipDay === menu.day_of_week;
    }).length;
  };

  const filteredMenus = selectedHostel
    ? menus.filter((m) => m.hostel === parseInt(selectedHostel))
    : menus;

  const hostelSkipStats = selectedHostel
    ? mealSkips.filter((skip) => {
        const hostel = hostels.find((h) => h.id === parseInt(selectedHostel));
        return hostel;
      })
    : [];

  return (
    <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} p-6 shadow-sm`}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Menu Management
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowForm(true);
              setEditingMenu(null);
              setFormData({
                hostel: '',
                day_of_week: '0',
                meal_type: '',
                date: '',
                items: [],
                is_recurring: true,
              });
              // Load required data for form lazily
              loadHostels();
              loadMenuItems();
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              isDark
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Plus className="h-4 w-4" />
            Add Menu
          </button>
          <button
            onClick={() => setShowSkips(!showSkips)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
              isDark
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            <Users className="h-4 w-4" />
            Skip Tracking
          </button>
        </div>
      </div>

      {/* Hostel Filter */}
      <div className="mb-6">
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Select Hostel
        </label>
        <select
          value={selectedHostel}
          onChange={(e) => setSelectedHostel(e.target.value)}
          onFocus={() => loadHostels()}
          className={`w-full rounded-lg border ${
            isDark
              ? 'border-slate-600 bg-slate-900 text-white'
              : 'border-gray-300 bg-white text-gray-900'
          } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">Select Hostel</option>
          {hostels.map((hostel) => (
            <option key={hostel.id} value={hostel.id}>
              {hostel.name}
            </option>
          ))}
        </select>
      </div>

      {/* Skip Tracking View */}
      {showSkips && (
        <div className={`mb-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-4`}>
          <h3 className={`mb-4 flex items-center gap-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <TrendingUp className="h-5 w-5" />
            Meal Skip Tracking
          </h3>

          {hostelSkipStats.length > 0 ? (
            <div className="space-y-3">
              {hostelSkipStats.map((skip) => (
                <div
                  key={skip.id}
                  className={`rounded-lg border ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'} p-3 flex items-center justify-between`}
                >
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {skip.student_name}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {skip.enrollment_no}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {skip.skip_type_display}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {skip.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`text-center py-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No meal skips recorded for this hostel
            </p>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className={`mb-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-6`}>
          <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editingMenu ? 'Edit Menu' : 'Create New Menu'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Hostel Selection */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Hostel *
                </label>
                <select
                  value={formData.hostel}
                  onChange={(e) => setFormData({ ...formData, hostel: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select Hostel</option>
                  {hostels.map((hostel) => (
                    <option key={hostel.id} value={hostel.id}>
                      {hostel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Day of Week *
                </label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Meal Type */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Meal Type *
                </label>
                <div className="mt-1 flex gap-2 items-center">
                  <select
                    value={formData.meal_type}
                    onChange={(e) => setFormData({ ...formData, meal_type: e.target.value })}
                    className={`flex-1 rounded-lg border ${
                      isDark
                        ? 'border-slate-600 bg-slate-900 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                    } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">Select Meal Type</option>
                    {DEFAULT_MEAL_TYPES.map((m) => (
                      <option key={m.name} value={m.name}>
                        {getMealTypeLabel(m.name)} ({m.time_from}-{m.time_to})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const todayStr = today.toISOString().slice(0, 10);
                      // Map JS getDay() (0=Sun..6=Sat) to our DAY_OPTIONS (0=Mon..6=Sun)
                      const mapped = ((today.getDay() + 6) % 7).toString();
                      setFormData((f) => ({ ...f, is_recurring: false, date: todayStr, day_of_week: mapped }));
                    }}
                    className={`rounded-lg px-3 py-2 text-sm ${isDark ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-900'}`}
                  >
                    Apply to Today
                  </button>
                </div>
              </div>

              {/* Date (optional for one-time menus) */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Recurring */}
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="rounded"
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Recurring Weekly
                  </span>
                </label>
              </div>

              {/* Menu Items Selection - Full Width */}
              <div className="col-span-full">
                <div className="flex items-center justify-between mb-3">
                  <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Food Items
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFoodItem(null);
                      setFoodFormData({
                        name: '',
                        description: '',
                        vegetarian: true,
                        cost: '',
                        calories: '',
                      });
                      setShowFoodForm(true);
                    }}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-green-900/30 text-green-300 hover:bg-green-900/50'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add Food
                  </button>
                </div>
                <div className={`space-y-2 rounded-lg border ${isDark ? 'border-slate-600 bg-slate-800/50' : 'border-gray-300 bg-gray-50'} p-4 max-h-96 overflow-y-auto`}>
                  {menuItems.length === 0 ? (
                    <p className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      No food items available
                    </p>
                  ) : (
                    menuItems.map((item) => (
                      <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        formData.items.includes(item.id)
                          ? isDark ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-300'
                          : isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.items.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="mt-1 rounded cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {item.name}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              item.vegetarian
                                ? isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'
                                : isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.vegetarian ? '🥗 Veg' : '🍗 Non-Veg'}
                            </span>
                          </div>
                          {item.description && (
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {item.description}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs">
                            {item.cost !== undefined && (
                              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>₹{item.cost}</strong>
                              </span>
                            )}
                            {item.calories !== undefined && (
                              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                <strong>{item.calories}</strong> cal
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditFoodItem(item)}
                            className={`rounded-lg p-1.5 ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} transition-colors`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFoodItem(item.id)}
                            className={`rounded-lg p-1.5 ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Selected: {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {editingMenu ? 'Update Menu' : 'Create Menu'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingMenu(null);
                }}
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

      {/* Food Item Form */}
      {showFoodForm && (
        <div className={`mb-6 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-6`}>
          <h3 className={`mb-4 text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editingFoodItem ? 'Edit Food Item' : 'Add New Food Item'}
          </h3>
          <form onSubmit={handleFoodItemSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={foodFormData.name}
                  onChange={(e) => setFoodFormData({ ...foodFormData, name: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="e.g., Paneer Butter Masala"
                />
              </div>

              {/* Cost */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cost (₹) *
                </label>
                <input
                  type="number"
                  value={foodFormData.cost}
                  onChange={(e) => setFoodFormData({ ...foodFormData, cost: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="100"
                />
              </div>

              {/* Calories */}
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Calories
                </label>
                <input
                  type="number"
                  value={foodFormData.calories}
                  onChange={(e) => setFoodFormData({ ...foodFormData, calories: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="180"
                />
              </div>

              {/* Vegetarian */}
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={foodFormData.vegetarian}
                    onChange={(e) => setFoodFormData({ ...foodFormData, vegetarian: e.target.checked })}
                    className="rounded"
                  />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Vegetarian
                  </span>
                </label>
              </div>

              {/* Description */}
              <div className="col-span-full">
                <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description
                </label>
                <textarea
                  value={foodFormData.description}
                  onChange={(e) => setFoodFormData({ ...foodFormData, description: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    isDark
                      ? 'border-slate-600 bg-slate-900 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={3}
                  placeholder="Description of the food item..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                {editingFoodItem ? 'Update Food Item' : 'Add Food Item'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFoodForm(false);
                  setEditingFoodItem(null);
                  setFoodFormData({
                    name: '',
                    description: '',
                    vegetarian: true,
                    cost: '',
                    calories: '',
                  });
                }}
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

      {/* Menus List */}
      {!showForm && (loading ? (
        <div className="flex justify-center py-8">
          <div className={`h-8 w-8 animate-spin rounded-full border-4 ${isDark ? 'border-slate-700 border-t-blue-400' : 'border-gray-300 border-t-blue-600'}`} />
        </div>
      ) : filteredMenus.length === 0 ? (
        <div className={`rounded-lg border-2 border-dashed ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-300 bg-gray-50'} py-8 text-center`}>
          <ChefHat className={`mx-auto h-12 w-12 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
          <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No menus created yet. Create your first menu to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMenus.map((menu) => {
            const today = new Date();
            const todayStr = today.toISOString().slice(0, 10);
            const todayWeekday = ((today.getDay() + 6) % 7).toString();
            const isToday = (menu.date === todayStr) || (menu.is_recurring && menu.day_of_week === todayWeekday);
            return (
            <div
              key={menu.id}
              className={`rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-gray-50'} p-4`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {menu.hostel_name} - {menu.day_name}
                    {isToday && (
                      <span className="ml-3 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Today
                      </span>
                    )}
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getMealTypeLabel(menu.meal_type_detail?.name || '')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {menu.is_recurring ? 'Weekly' : 'One-time'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className={`h-4 w-4 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                      <span className={`text-sm font-medium ${isDark ? 'text-orange-300' : 'text-orange-600'}`}>
                        {getSkipCountForMenu(menu)} skip(s)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(menu)}
                    className={`rounded-lg p-2 ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'} transition-colors`}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(menu.id)}
                    className={`rounded-lg p-2 ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-100 text-red-600 hover:bg-red-200'} transition-colors`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Menu Items */}
              {menu.items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {menu.items.map((item) => (
                    <div
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
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MenuManagement;
