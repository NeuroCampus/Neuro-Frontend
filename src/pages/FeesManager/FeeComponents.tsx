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
          <h1 className="text-3xl font-bold text-gray-900">Fee Components</h1>
          <p className="text-gray-600 mt-2">Manage basic fee building blocks used in templates</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingComponent ? "Edit Fee Component" : "Add Fee Component"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="componentName">Component Name *</Label>
                <Input
                  id="componentName"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., Tuition Fee, Library Fee"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="componentAmount">Amount *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="componentAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={componentAmount}
                    onChange={(e) => setComponentAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="componentDescription">Description (Optional)</Label>
                <Textarea
                  id="componentDescription"
                  value={componentDescription}
                  onChange={(e) => setComponentDescription(e.target.value)}
                  placeholder="Optional description for this fee component"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={editingComponent ? handleUpdateComponent : handleCreateComponent}
                  disabled={!componentName.trim() || !componentAmount}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingComponent ? "Update Component" : "Add Component"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Components List */}
      <div className="grid gap-6">
        {components.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Fee Components</h3>
              <p className="text-gray-600 mb-4">Create your first fee component to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Components ({components.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">
                          {component.name}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(component.amount)}
                        </TableCell>
                        <TableCell>
                          {component.description || <span className="text-gray-400">No description</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={component.is_active ? 'default' : 'secondary'}>
                            {component.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(component.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleEditComponent(component)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComponent(component.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FeeComponents;