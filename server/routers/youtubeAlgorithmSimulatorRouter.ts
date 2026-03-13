import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { simulateViralPotential } from "../services/youtubeAlgorithmSimulatorService";

export const youtubeAlgorithmSimulatorRouter = router({
  evaluateTopic: protectedProcedure
    .input(
      z.object({
        topic: z.string().min(5),
        title: z.string().min(5).optional(),
        hook: z.string().optional(),
        structure: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return simulateViralPotential({
        topic: input.topic,
        title: input.title || input.topic,
        hook: input.hook,
        structure: input.structure,
      });
    }),

  evaluateBatch: protectedProcedure
    .input(
      z.object({
        topics: z.array(
          z.object({
            topic: z.string().min(5),
            title: z.string().optional(),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      return Promise.all(
        input.topics.map((t) =>
          simulateViralPotential({
            topic: t.topic,
            title: t.title || t.topic,
          })
        )
      );
    }),
});
