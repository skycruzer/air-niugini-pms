'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title?: string;
  description?: string;
  colorScale?: [string, string];
}

/**
 * Heatmap Chart Component
 *
 * Perfect for:
 * - Pilot availability by day/week
 * - Certification expiry patterns
 * - Leave utilization patterns
 */
export default function HeatmapChart({
  data,
  title = 'Heatmap',
  description,
  colorScale = ['#FEF3C7', '#E4002B'],
}: HeatmapChartProps) {
  // Get unique x and y values
  const xValues = useMemo(() => Array.from(new Set(data.map((d) => d.x))), [data]);
  const yValues = useMemo(() => Array.from(new Set(data.map((d) => d.y))), [data]);

  // Get min and max values for color scaling
  const [minValue, maxValue] = useMemo(() => {
    const values = data.map((d) => d.value);
    return [Math.min(...values), Math.max(...values)];
  }, [data]);

  // Get color for a value
  const getColor = (value: number) => {
    if (maxValue === minValue) return colorScale[0];
    const ratio = (value - minValue) / (maxValue - minValue);

    // Simple linear interpolation between two colors
    const r1 = parseInt(colorScale[0].slice(1, 3), 16);
    const g1 = parseInt(colorScale[0].slice(3, 5), 16);
    const b1 = parseInt(colorScale[0].slice(5, 7), 16);

    const r2 = parseInt(colorScale[1].slice(1, 3), 16);
    const g2 = parseInt(colorScale[1].slice(3, 5), 16);
    const b2 = parseInt(colorScale[1].slice(5, 7), 16);

    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Get value for specific x, y
  const getValue = (x: string, y: string) => {
    const item = data.find((d) => d.x === x && d.y === y);
    return item?.value ?? 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-sm font-medium text-left border" />
                {xValues.map((x) => (
                  <th key={x} className="p-2 text-sm font-medium text-center border">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yValues.map((y) => (
                <tr key={y}>
                  <td className="p-2 text-sm font-medium border">{y}</td>
                  {xValues.map((x) => {
                    const value = getValue(x, y);
                    const color = getColor(value);
                    return (
                      <td
                        key={`${x}-${y}`}
                        className="p-4 text-center border cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: color }}
                        title={`${x}, ${y}: ${value}`}
                      >
                        <span className="text-sm font-medium">{value}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-sm text-gray-600">Low</span>
          <div className="flex h-4 w-64 rounded overflow-hidden">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: getColor(minValue + (maxValue - minValue) * (i / 9)),
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">High</span>
        </div>
      </CardContent>
    </Card>
  );
}
