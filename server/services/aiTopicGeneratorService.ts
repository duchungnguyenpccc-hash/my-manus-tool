import { and, eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { niches, topicCandidates } from "../../drizzle/schema";

type GeneratedTopic = {
  topic: string;
  titleSuggestion: string;
  hookSuggestion: string;
  score: number;
};

const fallbackTopics = (nicheName: string): GeneratedTopic[] => [
  { topic: `${nicheName}: 5 sai lầm phổ biến`, titleSuggestion: `5 sai lầm trong ${nicheName}`, hookSuggestion: "Bạn đang làm sai từ bước đầu tiên...", score: 78 },
  { topic: `${nicheName}: checklist thực chiến`, titleSuggestion: `Checklist ${nicheName} trong 7 ngày`, hookSuggestion: "Nếu chỉ có 1 tuần, hãy làm đúng 3 việc này.", score: 74 },
  { topic: `${nicheName}: case study`, titleSuggestion: `Case study ${nicheName} từ 0 đến 1`, hookSuggestion: "Từ con số 0 lên kết quả thực tế như thế nào?", score: 71 },
];

export const aiTopicGeneratorService = {
  async generateAndStoreTopics(userId: number, nicheId: number, limit = 10) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const niche = await db
      .select()
      .from(niches)
      .where(and(eq(niches.id, nicheId), eq(niches.userId, userId)))
      .limit(1);

    if (!niche.length) throw new Error("Niche not found");

    const nicheName = niche[0].nicheName;
    let generated: GeneratedTopic[] = [];

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a senior YouTube content strategist." },
          {
            role: "user",
            content: `Generate ${limit} Vietnamese YouTube topic ideas for niche '${nicheName}'. Return JSON array with keys: topic,titleSuggestion,hookSuggestion,score(0-100).`,
          },
        ],
      });

      const raw = response?.choices?.[0]?.message?.content;
      const content = typeof raw === "string" ? raw : JSON.stringify(raw ?? "[]");
      generated = JSON.parse(content);
    } catch {
      generated = fallbackTopics(nicheName).slice(0, limit);
    }

    if (!Array.isArray(generated) || generated.length === 0) {
      generated = fallbackTopics(nicheName).slice(0, limit);
    }

    await db.insert(topicCandidates).values(
      generated.map((item) => ({
        userId,
        nicheId,
        topic: item.topic,
        titleSuggestion: item.titleSuggestion,
        hookSuggestion: item.hookSuggestion,
        score: Math.max(0, Math.min(100, Math.round(item.score ?? 50))),
        source: "ai_generator" as const,
        status: "generated" as const,
        metadata: { niche: nicheName },
      }))
    );

    return generated;
  },

  async listTopicCandidates(userId: number, nicheId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(topicCandidates)
      .where(and(eq(topicCandidates.userId, userId), eq(topicCandidates.nicheId, nicheId)));
  },
};
