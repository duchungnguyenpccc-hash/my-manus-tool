import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Download, Calendar, Eye, Heart, MessageCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

interface VideoAnalytics {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  engagementRate: number;
  revenue: number;
  uploadDate: string;
}

interface PerformanceMetrics {
  totalViews: number;
  totalEngagement: number;
  averageEngagementRate: number;
  totalRevenue: number;
  averageViewsPerVideo: number;
  growthRate: number;
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState("30d");

  const [videoAnalytics] = useState<VideoAnalytics[]>([
    {
      videoId: "1",
      title: "How AI is Changing Everything",
      views: 2500000,
      likes: 125000,
      comments: 45000,
      shares: 12000,
      watchTime: 1250000,
      engagementRate: 6.8,
      revenue: 8500,
      uploadDate: "2024-03-01",
    },
    {
      videoId: "2",
      title: "Make $10k/Month with Faceless Videos",
      views: 1800000,
      likes: 98000,
      comments: 32000,
      shares: 8500,
      watchTime: 900000,
      engagementRate: 7.2,
      revenue: 6200,
      uploadDate: "2024-02-28",
    },
    {
      videoId: "3",
      title: "5 Habits of Millionaires",
      views: 3200000,
      likes: 156000,
      comments: 52000,
      shares: 15000,
      watchTime: 1600000,
      engagementRate: 6.5,
      revenue: 11000,
      uploadDate: "2024-02-25",
    },
    {
      videoId: "4",
      title: "The Future of Content Creation",
      views: 1200000,
      likes: 72000,
      comments: 28000,
      shares: 6500,
      watchTime: 600000,
      engagementRate: 8.1,
      revenue: 4100,
      uploadDate: "2024-02-20",
    },
  ]);

  const [performanceMetrics] = useState<PerformanceMetrics>({
    totalViews: 8700000,
    totalEngagement: 451000,
    averageEngagementRate: 7.15,
    totalRevenue: 29800,
    averageViewsPerVideo: 2175000,
    growthRate: 45,
  });

  const chartData = [
    { date: "Mar 1", views: 2500000, revenue: 8500 },
    { date: "Mar 2", views: 1800000, revenue: 6200 },
    { date: "Mar 3", views: 3200000, revenue: 11000 },
    { date: "Mar 4", views: 1200000, revenue: 4100 },
    { date: "Mar 5", views: 2800000, revenue: 9600 },
    { date: "Mar 6", views: 2100000, revenue: 7200 },
    { date: "Mar 7", views: 3500000, revenue: 12000 },
  ];

  const categoryData = [
    { name: "Technology", value: 35, fill: "#f59e0b" },
    { name: "Finance", value: 28, fill: "#3b82f6" },
    { name: "Lifestyle", value: 22, fill: "#10b981" },
    { name: "Other", value: 15, fill: "#8b5cf6" },
  ];

  const handleExportAnalytics = () => {
    toast.success("Analytics exported to PDF");
  };

  const handleExportData = () => {
    toast.success("Data exported to CSV");
  };

  return (
    <DashboardLayout>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAnalytics}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>
        <p className="text-slate-400">Track your video performance and revenue metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {(performanceMetrics.totalViews / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-green-500 mt-1">↑ {performanceMetrics.growthRate}% this month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {performanceMetrics.averageEngagementRate.toFixed(2)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {performanceMetrics.totalEngagement.toLocaleString()} total engagements
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${performanceMetrics.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Avg ${(performanceMetrics.totalRevenue / videoAnalytics.length).toFixed(0)}/video
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Views & Revenue Trend */}
        <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
          <CardHeader>
            <CardTitle>Views & Revenue Trend</CardTitle>
            <CardDescription>Last 7 days performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis yAxisId="left" stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: "#f59e0b" }}
                  yAxisId="left"
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981" }}
                  yAxisId="right"
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Content by Category</CardTitle>
            <CardDescription>Video distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#f1f5f9" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Video Performance Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Video Performance</CardTitle>
            <CardDescription>Detailed metrics for each video</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Video Title</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Views</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Engagement</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-300">Revenue</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {videoAnalytics.map((video) => (
                  <tr key={video.videoId} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-white">{video.title}</td>
                    <td className="text-right py-3 px-4 text-slate-300">
                      {(video.views / 1000000).toFixed(1)}M
                    </td>
                    <td className="text-right py-3 px-4">
                      <Badge
                        className={
                          video.engagementRate > 7
                            ? "bg-green-500/20 text-green-400"
                            : "bg-blue-500/20 text-blue-400"
                        }
                      >
                        {video.engagementRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-4 text-amber-600 font-semibold">
                      ${video.revenue.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4">
                      <Badge className="bg-green-500/20 text-green-400">Published</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle>ROI Calculator</CardTitle>
          <CardDescription>Estimate your return on investment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Videos Created
              </label>
              <div className="text-3xl font-bold text-white mb-2">
                {videoAnalytics.length}
              </div>
              <p className="text-xs text-slate-400">Total videos in this period</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Cost Per Video
              </label>
              <div className="text-3xl font-bold text-white mb-2">
                $
                {(
                  performanceMetrics.totalRevenue /
                  videoAnalytics.length /
                  2
                ).toFixed(0)}
              </div>
              <p className="text-xs text-slate-400">Estimated production cost</p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <label className="text-sm font-medium text-slate-300 block mb-2">
                ROI
              </label>
              <div className="text-3xl font-bold text-green-500 mb-2">
                {(
                  ((performanceMetrics.totalRevenue -
                    performanceMetrics.totalRevenue / 2) /
                    (performanceMetrics.totalRevenue / 2)) *
                  100
                ).toFixed(0)}
                %
              </div>
              <p className="text-xs text-slate-400">Return on investment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
