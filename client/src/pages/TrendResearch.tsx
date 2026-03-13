import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TrendResearch() {
  const [nicheId, setNicheId] = useState<number | null>(null);
  const [manualTopic, setManualTopic] = useState("");

  const utils = trpc.useUtils();
  const nichesQuery = trpc.niche.list.useQuery();

  const selectedNicheId = nicheId ?? nichesQuery.data?.[0]?.id ?? null;

  const ideasQuery = trpc.trendResearch.generateIdeas.useQuery(
    { nicheId: selectedNicheId ?? 0, limit: 15 },
    { enabled: selectedNicheId !== null }
  );

  const autoGenerateMutation = trpc.niche.autoGenerateTopics.useMutation({
    onSuccess: async (result) => {
      toast.success(`Đã tạo ${result.inserted} topics tự động vào queue`);
      await Promise.all([utils.niche.list.invalidate(), utils.niche.getTopicQueue.invalidate()]);
    },
    onError: (error) => toast.error(error.message || "Auto-generate topics thất bại"),
  });

  const pushIdeasMutation = trpc.trendResearch.pushIdeasToQueue.useMutation({
    onSuccess: async (result) => {
      toast.success(`Đã thêm ${result.inserted} ideas vào queue`);
      await Promise.all([utils.niche.list.invalidate(), utils.niche.getTopicQueue.invalidate()]);
    },
    onError: (error) => toast.error(error.message || "Push ideas vào queue thất bại"),
  });

  const queueQuery = trpc.niche.getTopicQueue.useQuery(
    { nicheId: selectedNicheId ?? 0 },
    { enabled: selectedNicheId !== null }
  );

  const manualEnqueueMutation = trpc.niche.enqueueTopic.useMutation({
    onSuccess: async () => {
      setManualTopic("");
      toast.success("Đã thêm topic vào queue");
      await queueQuery.refetch();
    },
    onError: (error) => toast.error(error.message || "Thêm topic thất bại"),
  });

  const ideas = ideasQuery.data ?? [];
  const queue = queueQuery.data ?? [];

  const selectedNiche = useMemo(
    () => nichesQuery.data?.find((n) => n.id === selectedNicheId),
    [nichesQuery.data, selectedNicheId]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Trend Research Engine</h1>
          <p className="text-muted-foreground">
            Phân tích trend theo niche, tạo idea và đẩy trực tiếp vào topic queue cho pipeline tự động.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Niche đang phân tích</CardTitle>
            <CardDescription>Chọn niche để sinh topic ideas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(nichesQuery.data ?? []).map((n) => (
              <Button
                key={n.id}
                size="sm"
                variant={selectedNicheId === n.id ? "default" : "outline"}
                onClick={() => setNicheId(n.id)}
              >
                {n.nicheName}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Tabs defaultValue="ideas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ideas">Topic Ideas</TabsTrigger>
            <TabsTrigger value="queue">Topic Queue</TabsTrigger>
          </TabsList>

          <TabsContent value="ideas" className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (!selectedNicheId) return;
                  autoGenerateMutation.mutate({ nicheId: selectedNicheId, limit: 10 });
                }}
                disabled={!selectedNicheId || autoGenerateMutation.isPending}
              >
                Auto-generate 10 topics
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (!selectedNicheId || ideas.length === 0) return;
                  pushIdeasMutation.mutate({
                    nicheId: selectedNicheId,
                    topics: ideas.slice(0, 10).map((i) => ({
                      topic: i.topic,
                      priority: i.priority,
                      source: i.source,
                    })),
                  });
                }}
                disabled={!selectedNicheId || ideas.length === 0 || pushIdeasMutation.isPending}
              >
                Push top ideas vào queue
              </Button>
            </div>

            <div className="grid gap-3">
              {ideasQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải trend ideas...</p>
              ) : ideas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu trend.</p>
              ) : (
                ideas.map((idea, idx) => (
                  <Card key={`${idea.topic}-${idx}`}>
                    <CardContent className="py-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{idea.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          Source: {idea.source} • Score: {idea.score ?? "N/A"}
                        </p>
                      </div>
                      <Badge>Priority {idea.priority}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardContent className="py-4 flex gap-2">
                <Input
                  value={manualTopic}
                  onChange={(e) => setManualTopic(e.target.value)}
                  placeholder={`Nhập topic mới cho niche ${selectedNiche?.nicheName || ""}`}
                />
                <Button
                  onClick={() => {
                    if (!selectedNicheId || manualTopic.trim().length < 5) {
                      toast.error("Topic cần tối thiểu 5 ký tự");
                      return;
                    }
                    manualEnqueueMutation.mutate({
                      nicheId: selectedNicheId,
                      topic: manualTopic.trim(),
                      priority: 100,
                      source: "manual",
                    });
                  }}
                >
                  Thêm queue
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-3">
              {queueQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải queue...</p>
              ) : queue.length === 0 ? (
                <p className="text-sm text-muted-foreground">Queue hiện trống.</p>
              ) : (
                queue.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="py-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          Status: {item.status} • Source: {item.source}
                        </p>
                      </div>
                      <Badge>Priority {item.priority}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
