"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartConfig {
  chartType: "bar" | "line" | "area" | "pie" | "scatter";
  dataKey: string;
  valueKeys: string[];
  title: string;
  colors?: string[];
}

interface QueryDataChartProps {
  data: Record<string, any>[];
  chartConfig: ChartConfig | null;
}

// Default colors if not provided
const DEFAULT_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
];

export function QueryDataChart({ data, chartConfig }: QueryDataChartProps) {
  // If no data or no chart config, show a message

  // Apply default colors if not provided
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        No data available for visualization
      </div>
    );
  }

  if (!chartConfig) {
    return (
      <div className="text-center py-8">Chart configuration not available</div>
    );
  }
  const colors = chartConfig.colors || DEFAULT_COLORS;

  // Ensure data is formatted for the chart
  const chartData = useMemo(() => {
    // For single-value results (like COUNT queries), create a formatted dataset
    if (data.length === 1 && Object.keys(data[0]).length === 1) {
      const key = Object.keys(data[0])[0];
      // Create a more visualization-friendly dataset with categories
      return [{ category: "Result", [key]: data[0][key] }];
    }

    // For normal multi-row results
    return data.map((item) => {
      // Create a copy of the item to avoid modifying the original
      const newItem = { ...item };

      // Ensure the dataKey exists, if not, add a placeholder
      if (!(chartConfig.dataKey in newItem)) {
        newItem[chartConfig.dataKey] = "N/A";
      }

      return newItem;
    });
  }, [data, chartConfig]);

  // Render the appropriate chart based on the type
  const renderChart = () => {
    switch (chartConfig.chartType) {
      case "bar":
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartConfig.valueKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                name={key}
              />
            ))}
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartConfig.valueKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                name={key}
              />
            ))}
          </LineChart>
        );

      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={chartConfig.dataKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {chartConfig.valueKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                stroke={colors[index % colors.length]}
                name={key}
              />
            ))}
          </AreaChart>
        );

      case "pie":
        // For pie charts, we need a different data structure
        // We'll use the first valueKey for simplicity
        const pieDataKey = chartConfig.valueKeys[0];
        return (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={pieDataKey}
              nameKey={chartConfig.dataKey}
              cx="50%"
              cy="50%"
              outerRadius={120}
              label={(entry) => entry[chartConfig.dataKey]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );

      case "scatter":
        // For scatter charts, we need at least two value keys
        // First will be x-value, second will be y-value
        const xKey = chartConfig.valueKeys[0] || "x";
        const yKey = chartConfig.valueKeys[1] || "y";
        return (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} name={xKey} />
            <YAxis dataKey={yKey} name={yKey} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
            <Legend />
            <Scatter
              name={`${xKey} vs ${yKey}`}
              data={chartData}
              fill={colors[0]}
            />
          </ScatterChart>
        );

      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">{chartConfig.title}</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
