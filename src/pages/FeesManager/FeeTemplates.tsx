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
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  IndianRupee
} from 'lucide-react';

interface FeeComponent {
  id: number;
  name: string;
  amount: number;
  description?: string;
}

interface FeeTemplate {
  id: number;
  name: string;
  description?: string;
  total_amount: number;
  fee_type: string;
  semester?: number;
  is_active: boolean;
  components: FeeComponent[];
  created_at: string;
}

const FeeTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<FeeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FeeTemplate | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [feeType, setFeeType] = useState('semester');
  const [semester, setSemester] = useState<number | undefined>();
  const [components, setComponents] = useState<FeeComponent[]>([]);

  // Component form
  const [componentName, setComponentName] = useState('');
  const [componentAmount, setComponentAmount] = useState('');
  const [componentDescription, setComponentDescription] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/fee-templates/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee templates');
      }

      const data = await response.json();
      setTemplates(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setFeeType('semester');
    setSemester(undefined);
    setComponents([]);
    setComponentName('');
    setComponentAmount('');
    setComponentDescription('');
  };

  const addComponent = () => {
    if (!componentName.trim() || !componentAmount) return;

    const newComponent: FeeComponent = {
      id: Date.now(), // Temporary ID for new components
      name: componentName.trim(),
      amount: parseFloat(componentAmount),
      description: componentDescription.trim() || undefined,
    };

    setComponents([...components, newComponent]);
    setComponentName('');
    setComponentAmount('');
    setComponentDescription('');
  };

  const removeComponent = (componentId: number) => {
    setComponents(components.filter(comp => comp.id !== componentId));
  };

  const calculateTotal = () => {
    return components.reduce((sum, comp) => sum + comp.amount, 0);
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim() || components.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const templateData = {
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        fee_type: feeType,
        semester: semester,
        components: components.map(comp => ({
          name: comp.name,
          amount: comp.amount,
          description: comp.description,
        })),
      };

      const response = await fetch('http://127.0.0.1:8000/api/fees-manager/fee-templates/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create fee template');
      }

      await fetchTemplates();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/fees-manager/fee-templates/${templateId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete fee template');
      }

      await fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template');
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
        <span className="ml-2">Loading fee templates...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Templates</h1>
          <p className="text-gray-600 mt-2">Create and manage fee templates with components</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Fee Template</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Template Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., B.Tech Semester Fee"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feeType">Fee Type</Label>
                  <select
                    id="feeType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value)}
                  >
                    <option value="semester">Semester Fee</option>
                    <option value="exam">Exam Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateDescription">Description</Label>
                <Textarea
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Optional description for the fee template"
                />
              </div>

              {feeType === 'semester' && (
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    type="number"
                    min="1"
                    max="8"
                    value={semester || ''}
                    onChange={(e) => setSemester(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="e.g., 5"
                  />
                </div>
              )}

              {/* Components Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Fee Components</h3>

                {/* Add Component Form */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label htmlFor="componentName">Component Name *</Label>
                    <Input
                      id="componentName"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      placeholder="e.g., Tuition Fee"
                    />
                  </div>
                  <div>
                    <Label htmlFor="componentAmount">Amount *</Label>
                    <Input
                      id="componentAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={componentAmount}
                      onChange={(e) => setComponentAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="componentDescription">Description</Label>
                    <Input
                      id="componentDescription"
                      value={componentDescription}
                      onChange={(e) => setComponentDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addComponent} disabled={!componentName || !componentAmount}>
                      Add Component
                    </Button>
                  </div>
                </div>

                {/* Components List */}
                {components.length > 0 && (
                  <div className="border rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-3">Added Components:</h4>
                    <div className="space-y-2">
                      {components.map((component) => (
                        <div key={component.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{component.name}</span>
                            {component.description && (
                              <span className="text-sm text-gray-600 ml-2">({component.description})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatCurrency(component.amount)}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeComponent(component.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                )}

                {components.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No components added yet</p>
                    <p className="text-sm">Add fee components above to build your template</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={!templateName.trim() || components.length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Template
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

      {/* Templates List */}
      <div className="grid gap-6">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Fee Templates</h3>
              <p className="text-gray-600 mb-4">Create your first fee template to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description || 'No description'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {template.fee_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Total Amount</Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(template.total_amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Components</Label>
                    <p className="text-lg font-semibold">{template.components?.length || 0}</p>
                  </div>
                  {template.semester && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Semester</Label>
                      <p className="text-lg font-semibold">{template.semester}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(template.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Components Breakdown */}
                {template.components && template.components.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Fee Components:</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {template.components.map((component, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{component.name}</p>
                            {component.description && (
                              <p className="text-xs text-gray-600">{component.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(component.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeeTemplates;