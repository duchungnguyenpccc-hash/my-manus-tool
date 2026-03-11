import { parse } from "csv-parse/sync";

/**
 * CSV Import Service
 * Handles bulk project creation from CSV files
 */

export interface CSVProjectRow {
  projectName: string;
  topic: string;
  niche: string;
  description?: string;
  videoCount?: number;
  uploadSchedule?: string;
  tags?: string;
  monetization?: string;
}

export interface CSVImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  projects: Array<{
    rowNumber: number;
    projectName: string;
    status: "success" | "error";
    projectId?: string;
    error?: string;
  }>;
  importedAt: Date;
  duration: number;
}

export interface CSVValidationError {
  rowNumber: number;
  field: string;
  value: any;
  error: string;
}

/**
 * Parse CSV file content
 */
export function parseCSVContent(content: string): CSVProjectRow[] {
  try {
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];

    return records;
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate CSV data
 */
export function validateCSVData(rows: CSVProjectRow[]): {
  isValid: boolean;
  errors: CSVValidationError[];
  validRows: CSVProjectRow[];
} {
  const errors: CSVValidationError[] = [];
  const validRows: CSVProjectRow[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because CSV starts at row 1 and header is row 1
    const rowErrors: CSVValidationError[] = [];

    // Validate required fields
    if (!row.projectName || row.projectName.trim() === "") {
      rowErrors.push({
        rowNumber,
        field: "projectName",
        value: row.projectName,
        error: "Project name is required",
      });
    }

    if (!row.topic || row.topic.trim() === "") {
      rowErrors.push({
        rowNumber,
        field: "topic",
        value: row.topic,
        error: "Topic is required",
      });
    }

    if (!row.niche || row.niche.trim() === "") {
      rowErrors.push({
        rowNumber,
        field: "niche",
        value: row.niche,
        error: "Niche is required",
      });
    }

    // Validate optional fields
    if (row.videoCount) {
      const count = parseInt(row.videoCount as any);
      if (isNaN(count) || count < 1 || count > 100) {
        rowErrors.push({
          rowNumber,
          field: "videoCount",
          value: row.videoCount,
          error: "Video count must be a number between 1 and 100",
        });
      }
    }

    if (row.uploadSchedule) {
      const validSchedules = ["daily", "weekly", "biweekly", "monthly"];
      if (!validSchedules.includes(row.uploadSchedule.toLowerCase())) {
        rowErrors.push({
          rowNumber,
          field: "uploadSchedule",
          value: row.uploadSchedule,
          error: `Upload schedule must be one of: ${validSchedules.join(", ")}`,
        });
      }
    }

    if (row.monetization) {
      const validMonetization = ["adsense", "sponsorship", "affiliate", "none"];
      if (!validMonetization.includes(row.monetization.toLowerCase())) {
        rowErrors.push({
          rowNumber,
          field: "monetization",
          value: row.monetization,
          error: `Monetization must be one of: ${validMonetization.join(", ")}`,
        });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validRows.push(row);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validRows,
  };
}

/**
 * Generate sample CSV template
 */
export function generateCSVTemplate(): string {
  const headers = [
    "projectName",
    "topic",
    "niche",
    "description",
    "videoCount",
    "uploadSchedule",
    "tags",
    "monetization",
  ];

  const sampleRows = [
    [
      "AI Tutorial Series",
      "Machine Learning Basics",
      "AI/Tech",
      "Complete ML tutorial series",
      "10",
      "weekly",
      "AI,ML,Tutorial",
      "adsense",
    ],
    [
      "Finance Tips",
      "Personal Finance Hacks",
      "Finance",
      "Money saving tips and tricks",
      "5",
      "biweekly",
      "Finance,Money,Tips",
      "sponsorship",
    ],
    [
      "Gaming Highlights",
      "Top Gaming Moments",
      "Gaming",
      "Best gaming moments compilation",
      "15",
      "daily",
      "Gaming,Highlights,Fun",
      "affiliate",
    ],
  ];

  const csvContent = [
    headers.join(","),
    ...sampleRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Format CSV for download
 */
export function formatCSVForDownload(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value;
    })
  );

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

/**
 * Parse upload schedule cron expression
 */
export function parseUploadSchedule(schedule: string): string {
  const scheduleMap: Record<string, string> = {
    daily: "0 0 * * *", // Every day at midnight
    weekly: "0 0 * * 0", // Every Sunday at midnight
    biweekly: "0 0 * * 0", // Every 2 weeks (simplified to weekly)
    monthly: "0 0 1 * *", // First day of month at midnight
  };

  return scheduleMap[schedule.toLowerCase()] || "0 0 * * *";
}

/**
 * Convert CSV row to project config
 */
export function csvRowToProjectConfig(row: CSVProjectRow): {
  name: string;
  topic: string;
  niche: string;
  description: string;
  videoCount: number;
  uploadSchedule: string;
  tags: string[];
  monetization: string;
} {
  return {
    name: row.projectName,
    topic: row.topic,
    niche: row.niche,
    description: row.description || "",
    videoCount: row.videoCount ? parseInt(row.videoCount as any) : 5,
    uploadSchedule: parseUploadSchedule(row.uploadSchedule || "weekly"),
    tags: row.tags ? row.tags.split(",").map((t) => t.trim()) : [],
    monetization: row.monetization || "none",
  };
}

/**
 * Process CSV import with progress tracking
 */
export async function processCSVImport(
  csvContent: string,
  onProgress?: (progress: { processed: number; total: number; current: string }) => void
): Promise<{
  validRows: CSVProjectRow[];
  validation: {
    isValid: boolean;
    errors: CSVValidationError[];
  };
}> {
  try {
    // Parse CSV
    const rows = parseCSVContent(csvContent);

    // Validate data
    const validation = validateCSVData(rows);

    // Report progress
    if (onProgress) {
      onProgress({
        processed: validation.validRows.length,
        total: rows.length,
        current: "Validation complete",
      });
    }

    return {
      validRows: validation.validRows,
      validation,
    };
  } catch (error) {
    throw new Error(`CSV Import Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get CSV import statistics
 */
export function getImportStatistics(result: CSVImportResult): {
  successRate: number;
  errorRate: number;
  averageTimePerProject: number;
  totalDuration: string;
} {
  const successRate = (result.successCount / result.totalRows) * 100;
  const errorRate = (result.errorCount / result.totalRows) * 100;
  const averageTimePerProject = result.duration / result.totalRows;

  const minutes = Math.floor(result.duration / 60);
  const seconds = result.duration % 60;
  const totalDuration = `${minutes}m ${seconds}s`;

  return {
    successRate: Math.round(successRate * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
    averageTimePerProject: Math.round(averageTimePerProject * 100) / 100,
    totalDuration,
  };
}
