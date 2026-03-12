import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit2, ListTodo, Play, ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type NicheFormState = {
  nicheName: string;
  description: string;
  category: string;
};

const defaultFormState: NicheFormState = {
  nicheName: "",
  description: "",
  category: "",
};

export function Niches() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNicheId, setEditingNicheId] = useState<number | null>(null);
  const [formState, setFormState] = useState<NicheFormState>(defaultFormState);
  const [expandedNicheId, setExpandedNicheId] = useState<number | null>(null);
  const [topicInputByNiche, setTopicInputByNiche] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();

  const nichesQuery = trpc.niche.list.useQuery();
  const niches = nichesQuery.data ?? [];

  const topicQueueQuery = trpc.niche.getTopicQueue.useQuery(
    { nicheId: expandedNicheId ?? 0 },
    { enabled: expandedNicheId !== null }
  );

  const createNicheMutation = trpc.niche.create.useMutation({
    onSuccess: async () => {
      await utils.niche.list.invalidate();
      toast.success("Đã tạo niche thành công");
      setIsCreateOpen(false);
      setFormState(defaultFormState);
    },
    onError: (error) => toast.error(error.message || "Tạo niche thất bại"),
  });

  const updateNicheMutation = trpc.niche.update.useMutation({
    onSuccess: async () => {
      await utils.niche.list.invalidate();
      toast.success("Đã cập nhật niche");
      setEditingNicheId(null);
      setFormState(defaultFormState);
    },
    onError: (error) => toast.error(error.message || "Cập nhật niche thất bại"),
  });

  const deleteNicheMutation = trpc.niche.delete.useMutation({
    onSuccess: async () => {
      await utils.niche.list.invalidate();
      toast.success("Đã xóa niche");
    },
    onError: (error) => toast.error(error.message || "Xóa niche thất bại"),
  });

  const enqueueTopicMutation = trpc.niche.enqueueTopic.useMutation({
    onSuccess: async (_, vars) => {
      if (expandedNicheId === vars.nicheId) {
        await topicQueueQuery.refetch();
      }
      await utils.niche.list.invalidate();
      setTopicInputByNiche((prev) => ({ ...prev, [vars.nicheId]: "" }));
      toast.success("Đã thêm topic vào queue");
    },
    onError: (error) => toast.error(error.message || "Thêm topic thất bại"),
  });

  const createProjectFromQueueMutation = trpc.project.createFromNicheQueue.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.project.list.invalidate(), utils.project.getStats.invalidate(), utils.niche.list.invalidate()]);
      await topicQueueQuery.refetch();
      toast.success(`Đã tạo project #${result.projectId} từ topic queue`);
    },
    onError: (error) => toast.error(error.message || "Tạo project từ queue thất bại"),
  });

  const filteredNiches = useMemo(
    () =>
      niches.filter(
        (niche) =>
          niche.nicheName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          niche.category?.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [niches, searchTerm]
  );

  const openEdit = (niche: any) => {
    setEditingNicheId(niche.id);
    setFormState({
      nicheName: niche.nicheName || "",
      description: niche.description || "",
      category: niche.category || "",
    });
  };

  const submitCreate = () => {
    if (!formState.nicheName.trim()) {
      toast.error("Vui lòng nhập tên niche");
      return;
    }

    createNicheMutation.mutate({
      nicheName: formState.nicheName,
      description: formState.description || undefined,
      category: formState.category || undefined,
      targetAudience: {},
      performanceTargets: {},
      monetizationStrategy: {},
    });
  };

  const submitEdit = () => {
    if (!editingNicheId) return;
    if (!formState.nicheName.trim()) {
      toast.error("Vui lòng nhập tên niche");
      return;
    }

    updateNicheMutation.mutate({
      nicheId: editingNicheId,
      updates: {
        nicheName: formState.nicheName,
        description: formState.description || undefined,
        category: formState.category || undefined,
      },
    });
  };

  const toggleQueue = (nicheId: number) => {
    setExpandedNicheId((prev) => (prev === nicheId ? null : nicheId));
  };

  const topicQueue = topicQueueQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Niche Management</h1>
            <p className="text-muted-foreground">Quản lý niche, topic queue và tạo project tự động theo niche</p>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setIsCreateOpen(true);
              setEditingNicheId(null);
              setFormState(defaultFormState);
            }}
          >
            <Plus className="h-4 w-4" />
            Tạo Niche
          </Button>
        </div>

        <Input
          placeholder="Tìm niche theo tên hoặc category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />

        {(isCreateOpen || editingNicheId !== null) && (
          <Card>
            <CardHeader>
              <CardTitle>{editingNicheId ? "Chỉnh sửa niche" : "Tạo niche mới"}</CardTitle>
              <CardDescription>Thiết lập niche để quản lý topic queue và pipeline tự động</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Tên niche (vd: AI Tools, Finance, Health...)"
                value={formState.nicheName}
                onChange={(e) => setFormState((prev) => ({ ...prev, nicheName: e.target.value }))}
              />
              <Input
                placeholder="Category"
                value={formState.category}
                onChange={(e) => setFormState((prev) => ({ ...prev, category: e.target.value }))}
              />
              <Input
                placeholder="Mô tả ngắn về niche"
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button
                  onClick={editingNicheId ? submitEdit : submitCreate}
                  disabled={createNicheMutation.isPending || updateNicheMutation.isPending}
                >
                  {editingNicheId ? "Lưu cập nhật" : "Tạo niche"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingNicheId(null);
                    setFormState(defaultFormState);
                  }}
                >
                  Hủy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {nichesQuery.isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Đang tải niches...</div>
        ) : filteredNiches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Chưa có niche nào</p>
              <Button onClick={() => setIsCreateOpen(true)}>Tạo niche đầu tiên</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredNiches.map((niche) => {
              const isExpanded = expandedNicheId === niche.id;
              return (
                <Card key={niche.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{niche.nicheName}</CardTitle>
                        <CardDescription>{niche.category || "No category"}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(niche)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => deleteNicheMutation.mutate({ nicheId: niche.id })}
                          disabled={deleteNicheMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {niche.description && <p className="text-sm text-muted-foreground">{niche.description}</p>}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Queued Topics</p>
                        <p className="font-semibold">{(niche as any).queuedTopics || 0}</p>
                      </div>
                      <div className="bg-muted p-2 rounded">
                        <p className="text-xs text-muted-foreground">Niche ID</p>
                        <p className="font-semibold">#{niche.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleQueue(niche.id)} className="gap-2">
                        <ListTodo className="h-4 w-4" />
                        Topic Queue
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>

                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => createProjectFromQueueMutation.mutate({ nicheId: niche.id })}
                        disabled={createProjectFromQueueMutation.isPending}
                      >
                        <Play className="h-4 w-4" />
                        Tạo Project từ Queue
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 border rounded-lg p-3 bg-muted/40">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nhập topic mới cho niche này..."
                            value={topicInputByNiche[niche.id] || ""}
                            onChange={(e) =>
                              setTopicInputByNiche((prev) => ({
                                ...prev,
                                [niche.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            onClick={() => {
                              const topic = (topicInputByNiche[niche.id] || "").trim();
                              if (topic.length < 5) {
                                toast.error("Topic phải có ít nhất 5 ký tự");
                                return;
                              }
                              enqueueTopicMutation.mutate({ nicheId: niche.id, topic, priority: 100, source: "manual" });
                            }}
                            disabled={enqueueTopicMutation.isPending}
                          >
                            Thêm
                          </Button>
                        </div>

                        {topicQueueQuery.isLoading ? (
                          <p className="text-sm text-muted-foreground">Đang tải topic queue...</p>
                        ) : topicQueue.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Queue trống.</p>
                        ) : (
                          <div className="space-y-2">
                            {topicQueue.map((item) => (
                              <div key={item.id} className="p-2 rounded bg-background border flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-sm">{item.topic}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Priority: {item.priority} • Status: {item.status}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground">#{item.id}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
