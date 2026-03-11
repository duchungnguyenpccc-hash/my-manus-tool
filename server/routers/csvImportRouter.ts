import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  parseCSVContent,
  validateCSVData,
  generateCSVTemplate,
  processCSVImport,
  getImportStatistics,
  csvRowToProjectConfig,
  type CSVImportResult,
  type CSVValidationError,
} from "../services/csvImportService";

export const csvImportRouter = router({
  /**
   * Validate CSV content without importing
   */
  validateCSV: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const rows = parseCSVContent(input.csvContent);
        const validation = validateCSVData(rows);

        return {
          success: true,
          totalRows: rows.length,
          validRows: validation.validRows.length,
          invalidRows: validation.errors.length,
          isValid: validation.isValid,
          errors: validation.errors,
          preview: validation.validRows.slice(0, 5),
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Get CSV template for download
   */
  getCSVTemplate: protectedProcedure.query(async () => {
    return {
      template: generateCSVTemplate(),
      filename: "projects-template.csv",
      description:
        "Download this template and fill in your project details. Required fields: projectName, topic, niche",
    };
  }),

  /**
   * Process CSV import and create projects
   */
  importProjects: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
        autoStart: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const startTime = Date.now();

      try {
        // Validate CSV
        const rows = parseCSVContent(input.csvContent);
        const validation = validateCSVData(rows);

        if (!validation.isValid) {
          return {
            success: false,
            error: "CSV validation failed",
            errors: validation.errors,
          };
        }

        // Convert to project configs
        const projectConfigs = validation.validRows.map((row) => csvRowToProjectConfig(row));

        // Simulate project creation (in production, would create actual projects)
        const results = projectConfigs.map((config, index) => ({
          rowNumber: index + 2,
          projectName: config.name,
          status: "success" as const,
          projectId: `project-${Date.now()}-${index}`,
        }));

        const duration = (Date.now() - startTime) / 1000;

        const importResult: CSVImportResult = {
          totalRows: rows.length,
          successCount: results.length,
          errorCount: validation.errors.length,
          projects: results,
          importedAt: new Date(),
          duration,
        };

        const stats = getImportStatistics(importResult);

        return {
          success: true,
          result: importResult,
          statistics: stats,
          projectConfigs,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Get import history
   */
  getImportHistory: protectedProcedure.query(async ({ ctx }) => {
    // Mock data - in production would fetch from database
    return {
      imports: [
        {
          id: "import-1",
          filename: "projects-batch-1.csv",
          totalRows: 10,
          successCount: 9,
          errorCount: 1,
          importedAt: new Date(Date.now() - 86400000),
          duration: 45,
        },
        {
          id: "import-2",
          filename: "projects-batch-2.csv",
          totalRows: 15,
          successCount: 15,
          errorCount: 0,
          importedAt: new Date(Date.now() - 172800000),
          duration: 62,
        },
      ],
    };
  }),

  /**
   * Get import statistics
   */
  getImportStats: protectedProcedure.query(async ({ ctx }) => {
    return {
      totalImports: 2,
      totalProjects: 24,
      successRate: 96,
      averageDuration: 53.5,
      lastImport: new Date(Date.now() - 86400000),
    };
  }),

  /**
   * Duplicate detection
   */
  checkDuplicates: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const rows = parseCSVContent(input.csvContent);
        const projectNames = rows.map((r: any) => r.projectName);
        const duplicates = projectNames.filter(
          (name, index) => projectNames.indexOf(name) !== index
        );

        const uniqueDuplicates = Array.from(new Set(duplicates));
        return {
          hasDuplicates: duplicates.length > 0,
          duplicates: uniqueDuplicates,
          duplicateCount: duplicates.length,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),

  /**
   * Batch scheduling
   */
  scheduleBatchImport: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
        scheduleTime: z.date(),
        autoStart: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const rows = parseCSVContent(input.csvContent);
        const validation = validateCSVData(rows);

        if (!validation.isValid) {
          return {
            success: false,
            error: "CSV validation failed",
          };
        }

        return {
          success: true,
          scheduledImportId: `scheduled-${Date.now()}`,
          projectCount: validation.validRows.length,
          scheduledTime: input.scheduleTime,
          status: "scheduled",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
});
