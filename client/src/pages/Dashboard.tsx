import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Play, Trash2, ExternalLink, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ProjectCreationForm } from "@/components/ProjectCreationForm";
import DashboardLayout from "@/components/DashboardLayout";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const projectsQuery = trpc.project.list.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated }
  );

  const statsQuery = trpc.project.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const archiveMutation = trpc.project.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.project.list.invalidate(),
        utils.project.getStats.invalidate(),
      ]);
      toast.success("Project archived successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to archive project");
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const projects = projectsQuery.data ?? [];
  const stats = statsQuery.data;

  const monthlyProjects = useMemo(() => {
    const now = new Date();
    return projects.filter((project) => {
      const createdAt = new Date(project.createdAt);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
  }, [projects]);

  if (!isAuthenticated) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-500/20";
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
        <div className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-slate-400">Welcome back, {user?.name}</p>
            </div>
            <ProjectCreationForm />
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { label: "Total Projects", value: stats?.totalProjects ?? 0, icon: "📊" },
              { label: "Videos Created", value: stats?.completedProjects ?? 0, icon: "🎬" },
              { label: "Processing", value: stats?.processingProjects ?? 0, icon: "⚙️" },
              { label: "This Month", value: monthlyProjects, icon: "📈" },
            ].map((stat, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-400">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-white">{stat.value}</div>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Your Projects</h2>
              <p className="text-slate-400">Manage and monitor your video generation projects</p>
            </div>

            {projectsQuery.isLoading ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-8 text-slate-300 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading projects...
                </CardContent>
              </Card>
            ) : projects.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700 border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="text-5xl mb-4">🎥</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
                  <p className="text-slate-400 mb-6">Create your first video project to get started</p>
                  <div className="inline-flex">
                    <ProjectCreationForm />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white">{project.title}</CardTitle>
                          <CardDescription className="text-slate-400 mt-1">{project.topic}</CardDescription>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-2 ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          {project.status}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-slate-400">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {project.youtubeUrl && (
                            <a href={project.youtubeUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="border-slate-700 hover:bg-slate-700 gap-2">
                                <ExternalLink className="w-4 h-4" />
                                View on YouTube
                              </Button>
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-slate-700 hover:bg-slate-700 gap-2"
                            onClick={() => navigate(`/project/${project.id}`)}
                          >
                            <Play className="w-4 h-4" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => archiveMutation.mutate({ projectId: project.id })}
                            disabled={archiveMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
