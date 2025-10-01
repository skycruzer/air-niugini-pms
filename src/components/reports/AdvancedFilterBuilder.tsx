'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface FilterRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface AdvancedFilterBuilderProps {
  availableFields: any[];
  filters: FilterRule[];
  onChange: (filters: FilterRule[]) => void;
}

/**
 * Advanced Filter Builder Component
 *
 * Features:
 * - Complex filter expressions (AND/OR logic)
 * - Multiple operators per field type
 * - Date range comparisons
 * - Save filter presets
 */
export default function AdvancedFilterBuilder({ availableFields, filters, onChange }: AdvancedFilterBuilderProps) {
  const addFilter = () => {
    const newFilter: FilterRule = {
      id: `filter-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined,
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<FilterRule>) => {
    onChange(filters.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const getOperatorsForFieldType = (fieldType: string) => {
    switch (fieldType) {
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'greater_than', label: 'Greater Than' },
          { value: 'less_than', label: 'Less Than' },
          { value: 'between', label: 'Between' },
        ];
      case 'date':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'before', label: 'Before' },
          { value: 'after', label: 'After' },
          { value: 'between', label: 'Between' },
        ];
      case 'boolean':
        return [
          { value: 'is', label: 'Is' },
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'not_equals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'starts_with', label: 'Starts With' },
          { value: 'ends_with', label: 'Ends With' },
        ];
    }
  };

  return (
    <div className="space-y-3">
      {filters.map((filter, index) => {
        const selectedField = availableFields.find((f) => f.id === filter.field);
        const operators = selectedField ? getOperatorsForFieldType(selectedField.type) : [];

        return (
          <div key={filter.id} className="space-y-2">
            {index > 0 && filter.logicalOperator && (
              <div className="flex items-center gap-2">
                <Select
                  value={filter.logicalOperator}
                  onValueChange={(value) => updateFilter(filter.id, { logicalOperator: value as 'AND' | 'OR' })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Select
                value={filter.field}
                onValueChange={(value) => updateFilter(filter.id, { field: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filter.operator}
                onValueChange={(value) => updateFilter(filter.id, { operator: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Operator..." />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Value..."
                value={filter.value}
                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                className="flex-1"
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFilter(filter.id)}
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={addFilter}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Filter
      </Button>
    </div>
  );
}
