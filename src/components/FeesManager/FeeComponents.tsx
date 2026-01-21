import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  DollarSign
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext'; // Added theme context import

interface FeeComponent {
  id: number;
  name: string;
  amount: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const FeeComponents: React.FC = () => {
  const { theme } = useTheme(); // Using theme context
  const [components, setComponents] = useState<FeeComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<FeeComponent | null>(null);

  // Form states
  const [componentName, setComponentName] = useState('');
  const [componentAmount, setComponentAmount] = useState('');
  const [componentDescription, setComponentDescription] = useState('');

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/components/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee components');
      }

      const data = await response.json();
      setComponents(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setComponentName('');
    setComponentAmount('');
    setComponentDescription('');
    setEditingComponent(null);
  };

  const handleCreateComponent = async () => {
    if (!componentName.trim() || !componentAmount) return;

    try {
      const token = localStorage.getItem('access_token');
      const componentData = {
        name: componentName.trim(),
        amount: parseFloat(componentAmount),
        description: componentDescription.trim() || undefined,
      };

      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/components/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create fee component');
      }

      await fetchComponents();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create component');
    }
  };

  const handleEditComponent = (component: FeeComponent) => {
    setEditingComponent(component);
    setComponentName(component.name);
    setComponentAmount(component.amount.toString());
    setComponentDescription(component.description || '');
    setIsCreateDialogOpen(true);
  };

  const handleUpdateComponent = async () => {
    if (!editingComponent || !componentName.trim() || !componentAmount) return;

    try {
      const token = localStorage.getItem('access_token');
      const componentData = {
        name: componentName.trim(),
        amount: parseFloat(componentAmount),
        description: componentDescription.trim() || undefined,
      };

      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/components/${editingComponent.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(componentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update fee component');
      }

      await fetchComponents();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update component');
    }
  };

  const handleDeleteComponent = async (componentId: number) => {
    if (!confirm('Are you sure you want to delete this fee component? This may affect existing fee templates.')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/components/${componentId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete fee component');
      }

      await fetchComponents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete component');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading fee components...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-foreground' : 'text-gray-900'}`}>Fee Components</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>Manage basic fee building blocks used in templates</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
              className="bg-[#a259ff] hover:bg-[#8a4dde] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Component
            </Button>
          </DialogTrigger>
          <DialogContent className={`${theme === 'dark' ? 'bg-background text-foreground' : 'bg-white text-gray-900'} p-6 max-w-md`}>
            <DialogHeader className="mb-4">
              <DialogTitle>
                {editingComponent ? 'Edit Fee Component' : 'Create New Fee Component'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="componentName">Component Name</Label>
                <Input
                  id="componentName"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., Tuition Fee, Library Fee"
                  className={`${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'} mt-1`}
                />
              </div>
              <div>
                <Label htmlFor="componentAmount">Amount (₹)</Label>
                <Input
                  id="componentAmount"
                  type="number"
                  value={componentAmount}
                  onChange={(e) => setComponentAmount(e.target.value)}
                  placeholder="0.00"
                  className={`${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'} mt-1`}
                />
              </div>
              <div>
                <Label htmlFor="componentDescription">Description (Optional)</Label>
                <Textarea
                  id="componentDescription"
                  value={componentDescription}
                  onChange={(e) => setComponentDescription(e.target.value)}
                  placeholder="Brief description of this fee component"
                  className={`${theme === 'dark' ? 'bg-background border-border' : 'bg-white border-gray-300'} mt-1`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={editingComponent ? handleUpdateComponent : handleCreateComponent}
                  className="bg-[#a259ff] hover:bg-[#8a4dde] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingComponent ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className={`${theme === 'dark' ? 'bg-card text-card-foreground' : 'bg-white text-gray-900'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Fee Components List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className={theme === 'dark' ? 'bg-muted' : 'bg-gray-100'}>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow 
                  key={component.id} 
                  className={theme === 'dark' ? 'border-border' : 'border-gray-200'}
                >
                  <TableCell className="font-medium">{component.name}</TableCell>
                  <TableCell>{formatCurrency(component.amount)}</TableCell>
                  <TableCell>{component.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={component.is_active ? "default" : "secondary"}>
                      {component.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditComponent(component)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteComponent(component.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {components.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <DollarSign className="h-12 w-12 text-muted-foreground mb-2" />
                      <h3 className="font-medium text-lg mb-1">No fee components found</h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500'}`}>
                        Create your first fee component to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeeComponents;