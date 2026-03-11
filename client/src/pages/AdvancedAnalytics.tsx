import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Download, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";

interface ABTestResult {
  id: string;
  name: string;
  variant: string;
  metric: string;
  control: number;
  treatment: number;
  improvement: number;
  pValue: number;
  isSignificant: boolean;
  confidence: number;
  sampleSize: number;
  duration: number;
}

interface PerformanceTrend {
  date: string;
  views: number;
  engagement: number;
  ctr: number;
  revenue: number;
}

export default function AdvancedAnalytics() {
  const [selectedMetric, setSelectedMetric] = useState("ctr");
  const [dateRange, setDateRange] = useState("30d");

  // Mock A/B test results
  const abTestResults: ABTestResult[] = [
    {
      id: "test-1",
      name: "Thumbnail Design Test",
      variant: "Design A vs Design B",
      metric: "CTR",
      control: 4.5,
      treatment: 6.2,
      improvement: 37.8,
      pValue: 0.001,
      isSignificant: true,
      confidence: 99,
      sampleSize: 5000,
      duration: 7,
    },
    {
      id: "test-2",
      name: "Hook Variation Test",
      variant: "Hook 1 vs Hook 2",
      metric: "Retention",
      control: 42,
      treatment: 48,
      improvement: 14.3,
      pValue: 0.05,
      isSignificant: true,
      confidence: 95,
      sampleSize: 3000,
      duration: 7,
    },
    {
      id: "test-3",
      name: "Video Length Test",
      variant: "10min vs 15min",
      metric: "Watch Time",
      control: 480,
      treatment: 520,
      improvement: 8.3,
      pValue: 0.12,
      isSignificant: false,
      confidence: 88,
      sampleSize: 2000,
      duration: 14,
    },
    {
      id: "test-4",
      name: "Title Format Test",
      variant: "Question vs Statement",
      metric: "CTR",
      control: 4.5,
      treatment: 5.8,
      improvement: 28.9,
      pValue: 0.003,
      isSignificant: true,
      confidence: 99,
      sampleSize: 4500,
      duration: 7,
    },
  ];

  // Mock performance trends
  const performanceTrends: PerformanceTrend[] = [
    { date: "Mar 1", views: 2500000, engagement: 125000, ctr: 4.5, revenue: 8500 },
    { date: "Mar 2", views: 2800000, engagement: 145000, ctr: 5.2, revenue: 9200 },
    { date: "Mar 3", views: 3200000, engagement: 165000, ctr: 5.8, revenue: 11000 },
    { date: "Mar 4", views: 2900000, engagement: 140000, ctr: 5.1, revenue: 9800 },
    { date: "Mar 5", views: 3500000, engagement: 180000, ctr: 6.2, revenue: 12500 },
    { date: "Mar 6", views: 3800000, engagement: 195000, ctr: 6.5, revenue: 13200 },
    { date: "Mar 7", views: 4200000, engagement: 220000, ctr: 7.1, revenue: 14800 },
  ];

  // Mock niche comparison
  const nicheComparison = [
    { niche: "AI/Tech", avgCTR: 5.2, avgEngagement: 6.8, avgRevenue: 0.08 },
    { niche: "Finance", avgCTR: 4.8, avgEngagement: 5.2, avgRevenue: 0.12 },
    { niche: "Lifestyle", avgCTR: 6.1, avgEngagement: 7.5, avgRevenue: 0.06 },
    { niche: "Gaming", avgCTR: 7.2, avgEngagement: 9.1, avgRevenue: 0.05 },
    { niche: "Education", avgCTR: 4.5, avgEngagement: 5.8, avgRevenue: 0.04 },
  ];

  const handleExportResults = () => {
    const data = JSON.stringify(abTestResults, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ab-test-results-${Date.now()}.json`;
    a.click();
    toast.success("Results exported successfully");
  };

  const handleExportTrends = () => {
    const data = JSON.stringify(performanceTrends, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-trends-${Date.now()}.json`;
    a.click();
    toast.success("Trends exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <h1 className="text-3xl font-bold text-white">Advanced Analytics</h1>
          </div>
          <p className="text-slate-400">A/B testing results, performance trends, and niche insights</p>
        </div>

        <Tabs defaultValue="ab-tests" className="space-y-4">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
            <TabsTrigger value="trends">Performance Trends</TabsTrigger>
            <TabsTrigger value="niche">Niche Comparison</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* A/B Tests Tab */}
          <TabsContent value="ab-tests" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Active A/B Tests</h2>
              <Button
                onClick={handleExportResults}
                variant="outline"
                className="border-slate-700 hover:bg-slate-800 gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="grid gap-4">
              {abTestResults.map((test) => (
                <Card key={test.id} className="border-slate-800 bg-slate-900/50">
                  <CardContent className="py-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Test Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">{test.name}</h3>
                        <p className="text-sm text-slate-400 mb-4">{test.variant}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Metric:</span>
                            <span className="text-white font-medium">{test.metric}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Sample Size:</span>
                            <span className="text-white font-medium">{test.sampleSize.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Duration:</span>
                            <span className="text-white font-medium">{test.duration} days</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Confidence:</span>
                            <span className="text-white font-medium">{test.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Results */}
                      <div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-800/50 p-4 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Control</p>
                            <p className="text-2xl font-bold text-white">{test.control}</p>
                          </div>
                          <div className="bg-slate-800/50 p-4 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">Treatment</p>
                            <p className="text-2xl font-bold text-white">{test.treatment}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-slate-400">Improvement:</span>
                            <div className="flex items-center gap-1">
                              {test.improvement > 0 ? (
                                <ArrowUpRight className="w-4 h-4 text-green-500" />
                              ) : (
                                <ArrowDownLeft className="w-4 h-4 text-red-500" />
                              )}
                              <span
                                className={`text-lg font-bold ${
                                  test.improvement > 0 ? "text-green-500" : "text-red-500"
                                }`}
                              >
                                {test.improvement > 0 ? "+" : ""}
                                {test.improvement.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <Badge
                            className={`${
                              test.isSignificant
                                ? "bg-green-500/10 text-green-700 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                            } border`}
                          >
                            {test.isSignificant ? "Statistically Significant" : "Not Significant"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Performance Trends</h2>
              <Button
                onClick={handleExportTrends}
                variant="outline"
                className="border-slate-700 hover:bg-slate-800 gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            {/* CTR Trend */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>CTR Trend (Last 7 Days)</CardTitle>
                <CardDescription>Click-through rate performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
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
                      dataKey="ctr"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b" }}
                      name="CTR (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
                <CardDescription>Daily revenue performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Niche Comparison Tab */}
          <TabsContent value="niche" className="space-y-4">
            <h2 className="text-xl font-bold text-white">Niche Performance Comparison</h2>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Average Metrics by Niche</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nicheComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="niche" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Legend />
                    <Bar dataKey="avgCTR" fill="#f59e0b" name="Avg CTR (%)" />
                    <Bar dataKey="avgEngagement" fill="#10b981" name="Avg Engagement (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Niche Table */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle>Detailed Niche Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Niche</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Avg CTR</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Avg Engagement</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">CPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nicheComparison.map((niche) => (
                        <tr key={niche.niche} className="border-b border-slate-800 hover:bg-slate-800/50">
                          <td className="py-3 px-4 text-white">{niche.niche}</td>
                          <td className="py-3 px-4 text-white">{niche.avgCTR}%</td>
                          <td className="py-3 px-4 text-white">{niche.avgEngagement}%</td>
                          <td className="py-3 px-4 text-white">${(niche.avgRevenue * 1000).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4">
            <h2 className="text-xl font-bold text-white">Key Insights & Recommendations</h2>

            <div className="grid gap-4">
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="text-green-400">✅ Best Performing Strategy</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>
                    Thumbnail Design A shows a <strong>37.8% improvement</strong> in CTR with 99% confidence. This design
                    should be used as the baseline for future tests.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-blue-400">💡 Optimization Opportunity</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>
                    Gaming niche shows the highest CTR (7.2%) but lowest revenue ($0.05 CPM). Consider targeting
                    Finance niche ($0.12 CPM) for better monetization.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="text-amber-400">⚠️ Test Recommendation</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <p>
                    Video Length Test (10min vs 15min) is not statistically significant. Consider running a new test
                    with a larger sample size or different video lengths (5min vs 20min).
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader>
                  <CardTitle className="text-purple-400">🎯 Next Steps</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-300">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Scale Thumbnail Design A across all videos</li>
                    <li>Run Hook Variation Test with larger sample size</li>
                    <li>Test different call-to-action placements</li>
                    <li>Analyze audience demographics for better targeting</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
