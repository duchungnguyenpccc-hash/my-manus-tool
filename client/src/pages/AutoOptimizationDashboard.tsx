import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Zap, TrendingUp, Clock, Target } from "lucide-react";

interface Recommendation {
  id: string;
  type: "hook" | "thumbnail" | "script" | "schedule" | "metadata" | "tags";
  title: string;
  description: string;
  currentValue: string;
  suggestedValue: string;
  expectedImprovement: number;
  confidence: number;
  priority: "high" | "medium" | "low";
  status: "pending" | "applied" | "rejected";
  estimatedImpact: {
    ctrIncrease: number;
    retentionIncrease: number;
    viewsIncrease: number;
  };
}

export function AutoOptimizationDashboard() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    {
      id: "opt-1",
      type: "hook",
      title: "Expand Hook Length",
      description: "Current hook is too short. Expand to 30-50 characters for better engagement.",
      currentValue: "Discover AI secrets",
      suggestedValue: "Discover the shocking AI secrets that tech companies don't want you to know",
      expectedImprovement: 15,
      confidence: 0.85,
      priority: "high",
      status: "pending",
      estimatedImpact: { ctrIncrease: 2.5, retentionIncrease: 3, viewsIncrease: 10 },
    },
    {
      id: "opt-2",
      type: "thumbnail",
      title: "Increase Contrast",
      description: "Add more contrast to thumbnail for better visibility in search results.",
      currentValue: "Current thumbnail",
      suggestedValue: "High contrast version",
      expectedImprovement: 12,
      confidence: 0.78,
      priority: "high",
      status: "pending",
      estimatedImpact: { ctrIncrease: 2, retentionIncrease: 1, viewsIncrease: 8 },
    },
    {
      id: "opt-3",
      type: "schedule",
      title: "Reschedule Upload",
      description: "Upload at 6 PM UTC for maximum audience reach.",
      currentValue: "Current schedule",
      suggestedValue: "6 PM UTC (Peak time)",
      expectedImprovement: 20,
      confidence: 0.75,
      priority: "medium",
      status: "pending",
      estimatedImpact: { ctrIncrease: 3, retentionIncrease: 2, viewsIncrease: 25 },
    },
    {
      id: "opt-4",
      type: "tags",
      title: "Add More Tags",
      description: "Add 5 more tags to improve discoverability.",
      currentValue: "5 tags",
      suggestedValue: "10+ tags",
      expectedImprovement: 10,
      confidence: 0.8,
      priority: "medium",
      status: "pending",
      estimatedImpact: { ctrIncrease: 1, retentionIncrease: 0, viewsIncrease: 15 },
    },
  ]);

  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyOne = async (id: string) => {
    setIsApplying(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setRecommendations(
      recommendations.map((r) => (r.id === id ? { ...r, status: "applied" } : r))
    );
    setIsApplying(false);
  };

  const handleApplyAll = async () => {
    setIsApplying(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setRecommendations(recommendations.map((r) => ({ ...r, status: "applied" })));
    setIsApplying(false);
  };

  const handleReject = (id: string) => {
    setRecommendations(
      recommendations.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
  };

  const highPriority = recommendations.filter((r) => r.priority === "high" && r.status === "pending");
  const mediumPriority = recommendations.filter((r) => r.priority === "medium" && r.status === "pending");
  const applied = recommendations.filter((r) => r.status === "applied");

  const totalExpectedImprovement = recommendations
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.expectedImprovement, 0);

  const avgConfidence =
    recommendations.filter((r) => r.status === "pending").length > 0
      ? (recommendations
          .filter((r) => r.status === "pending")
          .reduce((sum, r) => sum + r.confidence, 0) /
          recommendations.filter((r) => r.status === "pending").length) *
        100
      : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "hook":
        return "🎣";
      case "thumbnail":
        return "🖼️";
      case "schedule":
        return "⏰";
      case "tags":
        return "🏷️";
      case "script":
        return "📝";
      case "metadata":
        return "📊";
      default:
        return "✨";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Auto-Optimization Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered recommendations to boost your video performance
            </p>
          </div>
          <Button
            onClick={handleApplyAll}
            disabled={isApplying || recommendations.filter((r) => r.status === "pending").length === 0}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            <Zap className="mr-2 h-4 w-4" />
            {isApplying ? "Applying..." : "Apply All"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Optimizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {recommendations.filter((r) => r.status === "pending").length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready to apply</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expected Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{totalExpectedImprovement.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Average boost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confidence Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground mt-1">Recommendation accuracy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Already Applied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applied.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Optimizations done</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              All ({recommendations.filter((r) => r.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="high">High Priority ({highPriority.length})</TabsTrigger>
            <TabsTrigger value="applied">Applied ({applied.length})</TabsTrigger>
          </TabsList>

          {/* All Recommendations */}
          <TabsContent value="all" className="space-y-4">
            {recommendations.filter((r) => r.status === "pending").length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">All optimizations have been applied!</p>
                </CardContent>
              </Card>
            ) : (
              recommendations
                .filter((r) => r.status === "pending")
                .map((rec) => (
                  <Card
                    key={rec.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedRec(rec)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-2xl">{getTypeIcon(rec.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{rec.title}</CardTitle>
                              <Badge className={getPriorityColor(rec.priority)}>
                                {rec.priority}
                              </Badge>
                              <Badge variant="outline">
                                {(rec.confidence * 100).toFixed(0)}% confident
                              </Badge>
                            </div>
                            <CardDescription className="mt-1">{rec.description}</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Value</p>
                          <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                            {rec.currentValue}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Suggested Value</p>
                          <p className="text-sm font-mono bg-green-50 dark:bg-green-950 p-2 rounded mt-1 text-green-700 dark:text-green-300">
                            {rec.suggestedValue}
                          </p>
                        </div>
                      </div>

                      {/* Impact Preview */}
                      <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-center">
                          <div className="text-blue-700 dark:text-blue-300 font-semibold">
                            +{rec.estimatedImpact.ctrIncrease}%
                          </div>
                          <div className="text-xs text-muted-foreground">CTR Increase</div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded text-center">
                          <div className="text-purple-700 dark:text-purple-300 font-semibold">
                            +{rec.estimatedImpact.retentionIncrease}%
                          </div>
                          <div className="text-xs text-muted-foreground">Retention</div>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded text-center">
                          <div className="text-orange-700 dark:text-orange-300 font-semibold">
                            +{rec.estimatedImpact.viewsIncrease}%
                          </div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                      </div>

                      {/* Overall Improvement */}
                      <div className="flex items-center gap-2 mb-4 p-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 rounded">
                        <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                          Expected Overall Improvement: +{rec.expectedImprovement}%
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyOne(rec.id);
                          }}
                          disabled={isApplying}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Apply Now
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(rec.id);
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* High Priority */}
          <TabsContent value="high" className="space-y-4">
            {highPriority.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No high-priority optimizations pending</p>
                </CardContent>
              </Card>
            ) : (
              highPriority.map((rec) => (
                <Card key={rec.id} className="border-red-200 dark:border-red-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{rec.title}</CardTitle>
                        <CardDescription>{rec.description}</CardDescription>
                      </div>
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApplyOne(rec.id)}
                        disabled={isApplying}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        Apply Immediately
                      </Button>
                      <Button onClick={() => handleReject(rec.id)} variant="outline">
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Applied */}
          <TabsContent value="applied" className="space-y-4">
            {applied.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No optimizations applied yet</p>
                </CardContent>
              </Card>
            ) : (
              applied.map((rec) => (
                <Card key={rec.id} className="border-green-200 dark:border-green-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-green-700 dark:text-green-300">
                          {rec.title}
                        </CardTitle>
                        <CardDescription>Applied successfully</CardDescription>
                      </div>
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>
                        <strong>From:</strong> {rec.currentValue}
                      </p>
                      <p className="mt-1">
                        <strong>To:</strong> {rec.suggestedValue}
                      </p>
                      <p className="mt-2 text-green-600 dark:text-green-400">
                        ✓ Expected improvement: +{rec.expectedImprovement}%
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Detail Panel */}
        {selectedRec && (
          <Card className="border-2 border-orange-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Optimization Details</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedRec(null)}
                  className="text-muted-foreground"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Why This Optimization?</h3>
                <p className="text-sm text-muted-foreground">{selectedRec.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Expected Impact</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• CTR increase: +{selectedRec.estimatedImpact.ctrIncrease}%</li>
                  <li>• Retention increase: +{selectedRec.estimatedImpact.retentionIncrease}%</li>
                  <li>• Views increase: +{selectedRec.estimatedImpact.viewsIncrease}%</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Confidence</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${selectedRec.confidence * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedRec.confidence * 100).toFixed(0)}% confident this will improve performance
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
