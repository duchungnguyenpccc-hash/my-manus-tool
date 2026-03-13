import { useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TopicAnalyzer() {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [structure, setStructure] = useState("Hook -> Body -> CTA");
  const [submitted, setSubmitted] = useState<{ topic: string; title: string; hook?: string; structure?: string } | null>(null);

  const evaluationQuery = trpc.algorithmSimulator.evaluateTopic.useQuery(
    submitted || { topic: "", title: "" },
    { enabled: Boolean(submitted) }
  );

  const prediction = evaluationQuery.data;
  const statusColor = useMemo(() => {
    if (!prediction) return "secondary" as const;
    return prediction.decision === "allow" ? ("default" as const) : ("destructive" as const);
  }, [prediction]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Topic Analyzer (YouTube Algorithm Simulator)</h1>
          <p className="text-muted-foreground">Dự đoán viral potential trước khi sản xuất video. Chỉ topic điểm cao mới nên vào pipeline.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Phân tích chủ đề</CardTitle>
            <CardDescription>Nhập topic/title/hook để tính viral score (0-100)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
            <Input placeholder="Title (optional, mặc định = topic)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Hook" value={hook} onChange={(e) => setHook(e.target.value)} />
            <Input placeholder="Story structure" value={structure} onChange={(e) => setStructure(e.target.value)} />
            <Button
              onClick={() => {
                if (topic.trim().length < 5) {
                  toast.error("Topic cần ít nhất 5 ký tự");
                  return;
                }
                setSubmitted({ topic: topic.trim(), title: (title || topic).trim(), hook: hook || undefined, structure: structure || undefined });
              }}
            >
              Evaluate Viral Score
            </Button>
          </CardContent>
        </Card>

        {prediction && (
          <Card>
            <CardHeader>
              <CardTitle>Kết quả mô phỏng thuật toán</CardTitle>
              <CardDescription>Viral score tổng hợp CTR + retention + demand + competition</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold">{prediction.viralScore}</div>
                <Badge variant={statusColor}>
                  {prediction.decision === "allow" ? "ALLOW" : "REJECT"} (threshold {prediction.threshold})
                </Badge>
              </div>

              <div className="grid md:grid-cols-4 gap-3">
                <Metric title="CTR" value={prediction.ctrScore} />
                <Metric title="Retention" value={prediction.retentionScore} />
                <Metric title="Demand" value={prediction.demandScore} />
                <Metric title="Competition" value={prediction.competitionScore} />
              </div>

              <div>
                <p className="font-medium mb-2">Signals</p>
                <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                  {(prediction.reasons || []).map((r: string, idx: number) => (
                    <li key={`${r}-${idx}`}>{r}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
