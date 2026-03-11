import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  TrendingUp,
} from "lucide-react";

interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  duration: number;
  startTime?: Date;
  endTime?: Date;
  output?: string;
  error?: string;
}

interface WorkflowExecution {
  id: string;
  name: string;
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  steps: WorkflowStep[];
  startTime?: Date;
  endTime?: Date;
  totalDuration: number;
}

export default function WorkflowVisualization() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowExecution | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Mock workflow data
  const mockWorkflow: WorkflowExecution = {
    id: "workflow-1",
    name: "Faceless Video Generation Workflow",
    status: "running",
    progress: 45,
    totalDuration: 0,
    steps: [
      {
        id: 1,
        name: "Schedule Trigger",
        description: "Check scheduled time and start workflow",
        status: "completed",
        duration: 2,
        startTime: new Date(Date.now() - 600000),
        endTime: new Date(Date.now() - 598000),
      },
      {
        id: 2,
        name: "Viral Video Scraper",
        description: "Scrape trending videos from YouTube",
        status: "completed",
        duration: 45,
        startTime: new Date(Date.now() - 598000),
        endTime: new Date(Date.now() - 553000),
      },
      {
        id: 3,
        name: "Hook Pattern Analysis",
        description: "Analyze hook patterns from trending videos",
        status: "completed",
        duration: 30,
        startTime: new Date(Date.now() - 553000),
        endTime: new Date(Date.now() - 523000),
      },
      {
        id: 4,
        name: "Hook Generator",
        description: "Generate optimized hooks for video",
        status: "running",
        duration: 15,
        startTime: new Date(Date.now() - 523000),
      },
      {
        id: 5,
        name: "Topic Generator",
        description: "Generate trending topics",
        status: "pending",
        duration: 0,
      },
      {
        id: 6,
        name: "Script Engineering",
        description: "Generate video script",
        status: "pending",
        duration: 0,
      },
      {
        id: 7,
        name: "Scene Planner",
        description: "Plan scenes and transitions",
        status: "pending",
        duration: 0,
      },
      {
        id: 8,
        name: "Generate Image",
        description: "Generate AI images for scenes",
        status: "pending",
        duration: 0,
      },
      {
        id: 9,
        name: "Thumbnail CTR Optimizer",
        description: "Optimize thumbnail for CTR",
        status: "pending",
        duration: 0,
      },
      {
        id: 10,
        name: "Voice Generation",
        description: "Generate voice narration",
        status: "pending",
        duration: 0,
      },
      {
        id: 11,
        name: "Video Rendering",
        description: "Render final video",
        status: "pending",
        duration: 0,
      },
      {
        id: 12,
        name: "SEO Metadata",
        description: "Generate SEO metadata",
        status: "pending",
        duration: 0,
      },
      {
        id: 13,
        name: "Upload YouTube",
        description: "Upload video to YouTube",
        status: "pending",
        duration: 0,
      },
    ],
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "running":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "skipped":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "running":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "skipped":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20";
    }
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSelectedWorkflow(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(selectedWorkflow || mockWorkflow, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workflow-${Date.now()}.json`;
    a.click();
  };

  const workflow = selectedWorkflow || mockWorkflow;
  const completedSteps = workflow.steps.filter((s) => s.status === "completed").length;
  const failedSteps = workflow.steps.filter((s) => s.status === "failed").length;
  const totalDuration = workflow.steps.reduce((sum, s) => sum + s.duration, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-amber-600" />
            <h1 className="text-3xl font-bold text-white">Workflow Visualization</h1>
          </div>
          <p className="text-slate-400">Monitor and visualize your video generation workflow in real-time</p>
        </div>

        {/* Workflow Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{workflow.steps.length}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{completedSteps}</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{workflow.progress}%</div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Est. Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{totalDuration}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Workflow Progress</CardTitle>
            <CardDescription>Overall completion status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full bg-slate-800 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all"
                style={{ width: `${workflow.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{workflow.progress}% Complete</span>
              <span className="text-sm text-slate-400">{completedSteps} of {workflow.steps.length} steps</span>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={handlePlayPause}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 gap-2 ml-auto"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        </div>

        {/* Workflow Steps */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Workflow Steps</h2>
          {workflow.steps.map((step, index) => (
            <Card
              key={step.id}
              className={`border-slate-800 bg-slate-900/50 transition-all ${
                step.status === "running" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800">
                      <span className="text-sm font-semibold text-slate-300">{index + 1}</span>
                    </div>
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{step.name}</h3>
                      <Badge className={`${getStatusColor(step.status)} border`}>
                        {step.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{step.description}</p>

                    {/* Progress Bar for Running Step */}
                    {step.status === "running" && (
                      <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                        <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: "60%" }} />
                      </div>
                    )}

                    {/* Error Message */}
                    {step.error && (
                      <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                        {step.error}
                      </div>
                    )}

                    {/* Output */}
                    {step.output && (
                      <div className="text-sm text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-700 max-h-24 overflow-y-auto">
                        <pre className="font-mono text-xs">{step.output}</pre>
                      </div>
                    )}
                  </div>

                  {/* Status Icon & Duration */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {getStatusIcon(step.status)}
                    {step.duration > 0 && (
                      <span className="text-xs text-slate-400">{step.duration}s</span>
                    )}
                  </div>
                </div>

                {/* Timeline Connector */}
                {index < workflow.steps.length - 1 && (
                  <div className="ml-5 mt-3 h-4 border-l-2 border-slate-700" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Summary */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle>Workflow Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-400">Status</p>
              <p className="text-lg font-semibold text-white capitalize">{workflow.status}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Completed Steps</p>
              <p className="text-lg font-semibold text-green-500">{completedSteps}/{workflow.steps.length}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Failed Steps</p>
              <p className="text-lg font-semibold text-red-500">{failedSteps}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Duration</p>
              <p className="text-lg font-semibold text-amber-600">{totalDuration}s</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
