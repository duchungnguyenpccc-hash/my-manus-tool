import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { scriptVersions } from "../../drizzle/schema";

export const scriptVersioningService = {
  async createVersion(params: {
    projectId: number;
    userId: number;
    nicheId?: number | null;
    versionLabel?: string;
    prompt: string;
    content: string;
    metadata?: Record<string, unknown>;
  }) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const last = await db
      .select()
      .from(scriptVersions)
      .where(eq(scriptVersions.projectId, params.projectId))
      .orderBy(desc(scriptVersions.versionNumber))
      .limit(1);

    const versionNumber = (last[0]?.versionNumber ?? 0) + 1;

    const result: any = await db.insert(scriptVersions).values({
      projectId: params.projectId,
      userId: params.userId,
      nicheId: params.nicheId ?? null,
      versionNumber,
      versionLabel: params.versionLabel ?? `v${versionNumber}`,
      prompt: params.prompt,
      content: params.content,
      metadata: params.metadata ?? {},
    });

    return {
      id: Number(result?.[0]?.insertId ?? result?.insertId ?? 0),
      versionNumber,
    };
  },

  async listByProject(projectId: number, userId: number) {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(scriptVersions)
      .where(and(eq(scriptVersions.projectId, projectId), eq(scriptVersions.userId, userId)))
      .orderBy(desc(scriptVersions.versionNumber));
  },
};
