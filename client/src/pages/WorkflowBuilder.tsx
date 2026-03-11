import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Play, Save, MoreVertical, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isPublic: boolean;
  createdAt: Date;
}

const STEP_TYPES = [
  {
    id: "schedule",
    name: "Schedule Trigger",
    description: "Trigger workflow at scheduled time",
    icon: "⏰",
    inputs: [],
    outputs: ["timestamp"],
  },
  {
    id: "scraper",
    name: "Viral Video Scraper",
    description: "Scrape trending videos",
    icon: "📹",
    inputs: [],
    outputs: ["videos"],
  },
  {
    id: "analyzer",
    name: "Content Analyzer",
    description: "Analyze content patterns",
    icon: "🔍",
    inputs: ["videos"],
    outputs: ["patterns"],
  },
  {
    id: "generator",
    name: "Content Generator",
    description: "Generate content",
    icon: "✨",
    inputs: [],
    outputs: ["content"],
  },
  {
    id: "optimizer",
    name: "Content Optimizer",
    description: "Optimize content",
    icon: "⚡",
    inputs: ["content"],
    outputs: ["optimized"],
  },
  {
    id: "renderer",
    name: "Video Renderer",
    description: "Render video",
    icon: "🎬",
    inputs: ["scenes", "audio"],
    outputs: ["video"],
  },
  {
    id: "uploader",
    name: "Upload Service",
    description: "Upload to platform",
    icon: "☁️",
    inputs: ["video"],
    outputs: ["url"],
  },
];

const PREBUILT_WORKFLOWS: Workflow[] = [
  {
    id: "template-1",
    name: "Faceless Video Generation",
    description: "Complete workflow for generating faceless videos",
    steps: [
      { id: "1", name: "Schedule Trigger", type: "schedule", config: {}, inputs: [], outputs: ["timestamp"] },
      { id: "2", name: "Viral Video Scraper", type: "scraper", config: {}, inputs: [], outputs: ["videos"] },
      { id: "3", name: "Hook Pattern Analysis", type: "analyzer", config: {}, inputs: ["videos"], outputs: ["patterns"] },
      { id: "4", name: "Hook Generator", type: "generator", config: {}, inputs: ["patterns"], outputs: ["hooks"] },
      { id: "5", name: "Script Engineering", type: "generator", config: {}, inputs: ["hooks"], outputs: ["script"] },
      { id: "6", name: "Voice Generation", type: "generator", config: {}, inputs: ["script"], outputs: ["audio"] },
      { id: "7", name: "Video Rendering", type: "renderer", config: {}, inputs: ["audio"], outputs: ["video"] },
      { id: "8", name: "Upload YouTube", type: "uploader", config: {}, inputs: ["video"], outputs: ["url"] },
    ],
    isPublic: true,
    createdAt: new Date(),
  },
  {
    id: "template-2",
    name: "Quick YouTube Shorts",
    description: "Fast workflow for generating YouTube Shorts",
    steps: [
      { id: "1", name: "Hook Generator", type: "generator", config: {}, inputs: [], outputs: ["hooks"] },
      { id: "2", name: "Script Engineering", type: "generator", config: {}, inputs: ["hooks"], outputs: ["script"] },
      { id: "3", name: "Voice Generation", type: "generator", config: {}, inputs: ["script"], outputs: ["audio"] },
      { id: "4", name: "Video Rendering", type: "renderer", config: {}, inputs: ["audio"], outputs: ["video"] },
      { id: "5", name: "Upload Shorts", type: "uploader", config: {}, inputs: ["video"], outputs: ["url"] },
    ],
    isPublic: true,
    createdAt: new Date(),
  },
];

export default function WorkflowBuilder() {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [selectedStepType, setSelectedStepType] = useState<string | null>(null);

  const handleCreateWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `workflow-${Date.now()}`,
      name: workflowName || "New Workflow",
      description: "",
      steps: [],
      isPublic: false,
      createdAt: new Date(),
    };
    setCurrentWorkflow(newWorkflow);
    setWorkflowName("");
    toast.success("Workflow created");
  };

  const handleAddStep = (stepType: string) => {
    if (!currentWorkflow) return;

    const stepTypeData = STEP_TYPES.find((s) => s.id === stepType);
    if (!stepTypeData) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: stepTypeData.name,
      type: stepType,
      config: {},
      inputs: stepTypeData.inputs,
      outputs: stepTypeData.outputs,
    };

    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep],
    });
    toast.success(`${stepTypeData.name} added`);
  };

  const handleRemoveStep = (stepId: string) => {
    if (!currentWorkflow) return;
    setCurrentWorkflow({
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter((s) => s.id !== stepId),
    });
    toast.success("Step removed");
  };

  const handleSaveWorkflow = () => {
    if (!currentWorkflow) return;
    toast.success(`Workflow "${currentWorkflow.name}" saved`);
  };

  const handleRunWorkflow = () => {
    if (!currentWorkflow) return;
    toast.success("Workflow started");
  };

  const handleUseTemplate = (template: Workflow) => {
    setCurrentWorkflow({
      ...template,
      id: `workflow-${Date.now()}`,
      name: `${template.name} (Copy)`,
    });
    toast.success("Template loaded");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Workflow Builder</h1>
          <p className="text-slate-400">Create custom workflows without coding</p>
        </div>

        <Tabs defaultValue={currentWorkflow ? "editor" : "templates"} className="space-y-4">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            {currentWorkflow && <TabsTrigger value="editor">Editor</TabsTrigger>}
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-bold text-white">Pre-built Templates</h2>
              <p className="text-slate-400">Start with a pre-built workflow or create your own</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {PREBUILT_WORKFLOWS.map((template) => (
                <Card key={template.id} className="border-slate-800 bg-slate-900/50 hover:border-amber-500/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-white">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Steps: {template.steps.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {template.steps.slice(0, 3).map((step) => (
                          <Badge key={step.id} variant="outline" className="border-slate-700">
                            {step.name}
                          </Badge>
                        ))}
                        {template.steps.length > 3 && (
                          <Badge variant="outline" className="border-slate-700">
                            +{template.steps.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create New */}
            <Card className="border-slate-800 bg-slate-900/50 border-dashed">
              <CardHeader>
                <CardTitle className="text-white">Create Custom Workflow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Enter workflow name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
                <Button
                  onClick={handleCreateWorkflow}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Workflow
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor Tab */}
          {currentWorkflow && (
            <TabsContent value="editor" className="space-y-4">
              {/* Workflow Header */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{currentWorkflow.name}</CardTitle>
                      <CardDescription>{currentWorkflow.steps.length} steps</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveWorkflow}
                        variant="outline"
                        className="border-slate-700 hover:bg-slate-800 gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button
                        onClick={handleRunWorkflow}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Run
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Workflow Steps */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle>Workflow Steps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentWorkflow.steps.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No steps added yet. Add a step below.</p>
                  ) : (
                    currentWorkflow.steps.map((step, index) => (
                      <div key={step.id}>
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{step.name}</p>
                            <p className="text-xs text-slate-400">{step.type}</p>
                          </div>
                          <Button
                            onClick={() => handleRemoveStep(step.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {index < currentWorkflow.steps.length - 1 && (
                          <div className="flex justify-center py-2">
                            <ArrowRight className="w-4 h-4 text-slate-600 rotate-90" />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Add Step */}
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle>Add Step</CardTitle>
                  <CardDescription>Choose a step type to add to your workflow</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {STEP_TYPES.map((stepType) => (
                      <button
                        key={stepType.id}
                        onClick={() => handleAddStep(stepType.id)}
                        className="p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left"
                      >
                        <p className="text-2xl mb-1">{stepType.icon}</p>
                        <p className="font-medium text-white text-sm">{stepType.name}</p>
                        <p className="text-xs text-slate-400">{stepType.description}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
