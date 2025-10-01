'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSortable, SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X, Download, Save, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdvancedFilterBuilder from './AdvancedFilterBuilder';

interface ReportField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  category: string;
}

interface SelectedField {
  id: string;
  fieldId: string;
  label: string;
  sort?: 'asc' | 'desc' | null;
  aggregate?: 'none' | 'count' | 'sum' | 'avg' | 'min' | 'max';
}

/**
 * Custom Report Builder Component
 *
 * Features:
 * - Drag-and-drop field selection
 * - Custom field ordering
 * - Advanced filtering
 * - Grouping and aggregation
 * - Sort controls
 * - Save report templates
 * - Export options
 */
export default function ReportBuilder() {
  const { toast } = useToast();
  const [reportName, setReportName] = useState('');
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Available fields for report building
  const availableFields: ReportField[] = [
    // Pilot fields
    { id: 'pilot_name', name: 'Pilot Name', type: 'text', category: 'Pilot' },
    { id: 'employee_id', name: 'Employee ID', type: 'text', category: 'Pilot' },
    { id: 'role', name: 'Role', type: 'text', category: 'Pilot' },
    { id: 'seniority', name: 'Seniority', type: 'number', category: 'Pilot' },
    { id: 'contract_type', name: 'Contract Type', type: 'text', category: 'Pilot' },
    { id: 'age', name: 'Age', type: 'number', category: 'Pilot' },
    { id: 'commencement_date', name: 'Commencement Date', type: 'date', category: 'Pilot' },

    // Certification fields
    { id: 'check_type', name: 'Check Type', type: 'text', category: 'Certification' },
    { id: 'check_category', name: 'Check Category', type: 'text', category: 'Certification' },
    { id: 'issue_date', name: 'Issue Date', type: 'date', category: 'Certification' },
    { id: 'expiry_date', name: 'Expiry Date', type: 'date', category: 'Certification' },
    { id: 'days_until_expiry', name: 'Days Until Expiry', type: 'number', category: 'Certification' },
    { id: 'status', name: 'Status', type: 'text', category: 'Certification' },

    // Leave fields
    { id: 'leave_type', name: 'Leave Type', type: 'text', category: 'Leave' },
    { id: 'start_date', name: 'Start Date', type: 'date', category: 'Leave' },
    { id: 'end_date', name: 'End Date', type: 'date', category: 'Leave' },
    { id: 'duration', name: 'Duration', type: 'number', category: 'Leave' },
    { id: 'leave_status', name: 'Leave Status', type: 'text', category: 'Leave' },
  ];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedFields((fields) => {
        const oldIndex = fields.findIndex((f) => f.id === active.id);
        const newIndex = fields.findIndex((f) => f.id === over.id);
        return arrayMove(fields, oldIndex, newIndex);
      });
    }
  };

  const addField = (field: ReportField) => {
    const newField: SelectedField = {
      id: `field-${Date.now()}`,
      fieldId: field.id,
      label: field.name,
      sort: null,
      aggregate: 'none',
    };
    setSelectedFields([...selectedFields, newField]);
  };

  const removeField = (id: string) => {
    setSelectedFields(selectedFields.filter((f) => f.id !== id));
  };

  const updateFieldSort = (id: string, sort: 'asc' | 'desc' | null) => {
    setSelectedFields(selectedFields.map((f) =>
      f.id === id ? { ...f, sort } : f
    ));
  };

  const updateFieldAggregate = (id: string, aggregate: string) => {
    setSelectedFields(selectedFields.map((f) =>
      f.id === id ? { ...f, aggregate: aggregate as any } : f
    ));
  };

  const handleSaveTemplate = () => {
    if (!reportName) {
      toast({
        title: 'Report name required',
        description: 'Please enter a name for your report template.',
        variant: 'destructive',
      });
      return;
    }

    // Save template logic here
    toast({
      title: 'Template saved',
      description: `Report template "${reportName}" has been saved successfully.`,
    });
  };

  const handleRunReport = () => {
    if (selectedFields.length === 0) {
      toast({
        title: 'No fields selected',
        description: 'Please select at least one field for your report.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Running report',
      description: 'Generating your custom report...',
    });
  };

  const handleExport = (format: string) => {
    toast({
      title: 'Export started',
      description: `Exporting report as ${format.toUpperCase()}...`,
    });
  };

  // Group available fields by category
  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Design custom reports with drag-and-drop field selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="reportName">Report Name</Label>
              <Input
                id="reportName"
                placeholder="Enter report name..."
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveTemplate} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
            <Button onClick={handleRunReport} className="bg-[#E4002B] hover:bg-[#C00020]">
              <Play className="h-4 w-4 mr-2" />
              Run Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Fields</CardTitle>
            <CardDescription>Drag fields to report or click to add</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="Pilot">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="Pilot">Pilot</TabsTrigger>
                <TabsTrigger value="Certification">Cert</TabsTrigger>
                <TabsTrigger value="Leave">Leave</TabsTrigger>
              </TabsList>
              {Object.entries(fieldsByCategory).map(([category, fields]) => (
                <TabsContent key={category} value={category} className="space-y-2 mt-4">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => addField(field)}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{field.name}</span>
                      </div>
                      <Plus className="h-4 w-4 text-[#E4002B]" />
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Selected Fields */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Report Fields</CardTitle>
            <CardDescription>
              {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected - Drag to reorder
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No fields selected</p>
                <p className="text-sm mt-2">Add fields from the left panel to build your report</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedFields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selectedFields.map((field) => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        onRemove={removeField}
                        onSortChange={updateFieldSort}
                        onAggregateChange={updateFieldAggregate}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Add filters to refine your report data</CardDescription>
        </CardHeader>
        <CardContent>
          <AdvancedFilterBuilder
            availableFields={availableFields}
            filters={filters}
            onChange={setFilters}
          />
        </CardContent>
      </Card>

      {/* Grouping & Export */}
      <Card>
        <CardHeader>
          <CardTitle>Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="groupBy">Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grouping field..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  {selectedFields.map((field) => (
                    <SelectItem key={field.id} value={field.fieldId}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Export Options</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('excel')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sortable Field Item Component
interface SortableFieldItemProps {
  field: SelectedField;
  onRemove: (id: string) => void;
  onSortChange: (id: string, sort: 'asc' | 'desc' | null) => void;
  onAggregateChange: (id: string, aggregate: string) => void;
}

function SortableFieldItem({ field, onRemove, onSortChange, onAggregateChange }: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-white"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      <div className="flex-1">
        <span className="font-medium">{field.label}</span>
      </div>

      <Select
        value={field.aggregate || 'none'}
        onValueChange={(value) => onAggregateChange(field.id, value)}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Aggregate</SelectItem>
          <SelectItem value="count">Count</SelectItem>
          <SelectItem value="sum">Sum</SelectItem>
          <SelectItem value="avg">Average</SelectItem>
          <SelectItem value="min">Minimum</SelectItem>
          <SelectItem value="max">Maximum</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-1">
        <Button
          variant={field.sort === 'asc' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange(field.id, field.sort === 'asc' ? null : 'asc')}
          className={field.sort === 'asc' ? 'bg-[#E4002B] hover:bg-[#C00020]' : ''}
        >
          ↑
        </Button>
        <Button
          variant={field.sort === 'desc' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSortChange(field.id, field.sort === 'desc' ? null : 'desc')}
          className={field.sort === 'desc' ? 'bg-[#E4002B] hover:bg-[#C00020]' : ''}
        >
          ↓
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(field.id)}
      >
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}
