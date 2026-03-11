import { describe, it, expect } from "vitest";
import {
  parseCSVContent,
  validateCSVData,
  generateCSVTemplate,
  csvRowToProjectConfig,
  getImportStatistics,
  parseUploadSchedule,
} from "./csvImportService";

describe("CSV Import Service", () => {
  describe("parseCSVContent", () => {
    it("should parse valid CSV content", () => {
      const csv = `projectName,topic,niche,description
Test Project,AI Tutorial,AI/Tech,Test Description
Another Project,Finance Tips,Finance,Finance Tips`;

      const result = parseCSVContent(csv);
      expect(result).toHaveLength(2);
      expect(result[0].projectName).toBe("Test Project");
      expect(result[0].topic).toBe("AI Tutorial");
    });

    it("should handle CSV with optional fields", () => {
      const csv = `projectName,topic,niche,videoCount,uploadSchedule
Test Project,AI Tutorial,AI/Tech,10,weekly`;

      const result = parseCSVContent(csv);
      expect(result[0].videoCount).toBe("10");
      expect(result[0].uploadSchedule).toBe("weekly");
    });

    it("should handle simple CSV without headers", () => {
      const csv = "invalid csv content without proper structure";
      const result = parseCSVContent(csv);
      // csv-parse will parse it as a single row with the content as first column
      expect(result).toBeDefined();
    });
  });

  describe("validateCSVData", () => {
    it("should validate correct data", () => {
      const rows = [
        {
          projectName: "Test Project",
          topic: "AI Tutorial",
          niche: "AI/Tech",
        },
      ];

      const result = validateCSVData(rows);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validRows).toHaveLength(1);
    });

    it("should detect missing required fields", () => {
      const rows = [
        {
          projectName: "",
          topic: "AI Tutorial",
          niche: "AI/Tech",
        },
      ];

      const result = validateCSVData(rows);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe("projectName");
    });

    it("should validate video count range", () => {
      const rows = [
        {
          projectName: "Test",
          topic: "AI",
          niche: "Tech",
          videoCount: "150" as any,
        },
      ];

      const result = validateCSVData(rows);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "videoCount")).toBe(true);
    });

    it("should validate upload schedule values", () => {
      const rows = [
        {
          projectName: "Test",
          topic: "AI",
          niche: "Tech",
          uploadSchedule: "invalid_schedule",
        },
      ];

      const result = validateCSVData(rows);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "uploadSchedule")).toBe(true);
    });

    it("should validate monetization values", () => {
      const rows = [
        {
          projectName: "Test",
          topic: "AI",
          niche: "Tech",
          monetization: "invalid_monetization",
        },
      ];

      const result = validateCSVData(rows);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === "monetization")).toBe(true);
    });
  });

  describe("generateCSVTemplate", () => {
    it("should generate valid CSV template", () => {
      const template = generateCSVTemplate();
      expect(template).toContain("projectName");
      expect(template).toContain("topic");
      expect(template).toContain("niche");
      expect(template).toContain("AI Tutorial Series");
    });

    it("should be parseable", () => {
      const template = generateCSVTemplate();
      const rows = parseCSVContent(template);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe("parseUploadSchedule", () => {
    it("should parse daily schedule", () => {
      const result = parseUploadSchedule("daily");
      expect(result).toBe("0 0 * * *");
    });

    it("should parse weekly schedule", () => {
      const result = parseUploadSchedule("weekly");
      expect(result).toBe("0 0 * * 0");
    });

    it("should parse monthly schedule", () => {
      const result = parseUploadSchedule("monthly");
      expect(result).toBe("0 0 1 * *");
    });

    it("should be case insensitive", () => {
      const result = parseUploadSchedule("DAILY");
      expect(result).toBe("0 0 * * *");
    });
  });

  describe("csvRowToProjectConfig", () => {
    it("should convert CSV row to project config", () => {
      const row = {
        projectName: "Test Project",
        topic: "AI Tutorial",
        niche: "AI/Tech",
        description: "Test Description",
        videoCount: "10" as any,
        uploadSchedule: "weekly",
        tags: "AI,Tutorial,Tech",
        monetization: "adsense",
      };

      const config = csvRowToProjectConfig(row);
      expect(config.name).toBe("Test Project");
      expect(config.topic).toBe("AI Tutorial");
      expect(config.niche).toBe("AI/Tech");
      expect(config.videoCount).toBe(10);
      expect(config.tags).toEqual(["AI", "Tutorial", "Tech"]);
      expect(config.monetization).toBe("adsense");
    });

    it("should use default values for optional fields", () => {
      const row = {
        projectName: "Test",
        topic: "AI",
        niche: "Tech",
      };

      const config = csvRowToProjectConfig(row);
      expect(config.description).toBe("");
      expect(config.videoCount).toBe(5);
      expect(config.tags).toEqual([]);
      expect(config.monetization).toBe("none");
    });
  });

  describe("getImportStatistics", () => {
    it("should calculate statistics correctly", () => {
      const result = {
        totalRows: 10,
        successCount: 9,
        errorCount: 1,
        projects: [],
        importedAt: new Date(),
        duration: 45,
      };

      const stats = getImportStatistics(result);
      expect(stats.successRate).toBe(90);
      expect(stats.errorRate).toBe(10);
      expect(stats.averageTimePerProject).toBe(4.5);
      expect(stats.totalDuration).toContain("45s");
    });

    it("should format duration correctly", () => {
      const result = {
        totalRows: 10,
        successCount: 10,
        errorCount: 0,
        projects: [],
        importedAt: new Date(),
        duration: 125, // 2 minutes 5 seconds
      };

      const stats = getImportStatistics(result);
      expect(stats.totalDuration).toBe("2m 5s");
    });
  });
});
