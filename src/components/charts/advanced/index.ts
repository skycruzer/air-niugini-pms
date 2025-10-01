/**
 * Advanced Chart Components Export
 *
 * Specialized charts for advanced analytics:
 * - HeatmapChart: Availability and pattern visualization
 * - RadarChart: Multi-metric comparison (via Recharts)
 * - TreemapChart: Hierarchical data visualization
 * - FunnelChart: Conversion and workflow visualization
 */

export { default as HeatmapChart } from './HeatmapChart';

// Note: RadarChart is exported from Recharts library
// import { RadarChart } from 'recharts';

// TreemapChart, SankeyChart, and FunnelChart would require additional libraries
// or custom implementations. For production use:
// - d3.js for TreemapChart and SankeyChart
// - Custom SVG implementation for FunnelChart
