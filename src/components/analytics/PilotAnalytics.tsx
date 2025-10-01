'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { Users, Award, TrendingUp, Clock } from 'lucide-react';

interface PilotAnalyticsProps {
  timeRange: string;
}

export default function PilotAnalytics({ timeRange }: PilotAnalyticsProps) {
  const pilotMetrics = useMemo(() => ({
    total: 27,
    captains: 15,
    firstOfficers: 12,
    avgCertifications: 20.7,
    avgAge: 42,
    avgSeniority: 8.5,
  }), []);

  const seniorityData = useMemo(() => [
    { range: '0-2 years', count: 3 },
    { range: '3-5 years', count: 5 },
    { range: '6-10 years', count: 8 },
    { range: '11-15 years', count: 7 },
    { range: '16+ years', count: 4 },
  ], []);

  const certificationByPilot = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      pilot: `Pilot ${i + 1}`,
      certifications: 18 + Math.floor(Math.random() * 6),
      compliance: 90 + Math.floor(Math.random() * 10),
    })).sort((a, b) => b.certifications - a.certifications),
  []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Pilots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pilotMetrics.total}</div>
            <p className="text-xs text-gray-500">{pilotMetrics.captains} Captains, {pilotMetrics.firstOfficers} FOs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Avg Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pilotMetrics.avgCertifications}</div>
            <p className="text-xs text-gray-500">Per pilot</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Seniority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pilotMetrics.avgSeniority} yrs</div>
            <p className="text-xs text-gray-500">Average experience</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Age
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pilotMetrics.avgAge} yrs</div>
            <p className="text-xs text-gray-500">Fleet average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seniority Distribution</CardTitle>
            <CardDescription>Pilots by years of service</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={seniorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#E4002B" name="Pilots" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>By certification count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={certificationByPilot} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="pilot" type="category" width={70} />
                <Tooltip />
                <Bar dataKey="certifications" fill="#4F46E5" name="Certifications" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilot Performance Matrix</CardTitle>
          <CardDescription>Certifications vs Compliance Rate</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="certifications" name="Certifications" />
              <YAxis dataKey="compliance" name="Compliance %" domain={[85, 100]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Pilots" data={certificationByPilot} fill="#E4002B">
                {certificationByPilot.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.compliance >= 95 ? '#10B981' : entry.compliance >= 90 ? '#F59E0B' : '#EF4444'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
