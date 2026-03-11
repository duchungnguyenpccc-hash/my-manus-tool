import { getApiKey } from "../utils/apiKeyDb";

/**
 * Google Sheets Service
 * Handles reading topics from Google Sheets and updating results
 */

interface SheetTopic {
  id: string;
  topic: string;
  status: "pending" | "processing" | "completed" | "failed";
  youtubeUrl?: string;
  createdAt: string;
}

interface SheetConfig {
  spreadsheetId: string;
  sheetName: string;
  range: string;
}

/**
 * Read topics from Google Sheets
 * Expects columns: A=Topic, B=Status, C=YouTube URL
 */
export async function readTopicsFromSheet(
  userId: number,
  config: SheetConfig
): Promise<SheetTopic[]> {
  try {
    // Get Google Sheets API key (stored as YouTube API key)
    const apiKey = await getApiKey(userId, "youtube");
    if (!apiKey) {
      throw new Error("Google Sheets API key not configured");
    }

    // Note: In production, use @google-cloud/sheets library
    // For now, this is a placeholder that shows the structure
    const topics: SheetTopic[] = [];

    console.log(`[Google Sheets] Reading topics from ${config.spreadsheetId}/${config.sheetName}`);

    // TODO: Implement actual Google Sheets API call
    // const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    // const response = await sheets.spreadsheets.values.get({
    //   spreadsheetId: config.spreadsheetId,
    //   range: `${config.sheetName}!${config.range}`,
    // });

    return topics;
  } catch (error) {
    console.error("[Google Sheets] Error reading topics:", error);
    throw new Error(`Failed to read topics from Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Update topic status in Google Sheets
 */
export async function updateTopicStatus(
  userId: number,
  config: SheetConfig,
  topicId: string,
  status: "pending" | "processing" | "completed" | "failed",
  youtubeUrl?: string
): Promise<void> {
  try {
    const apiKey = await getApiKey(userId, "youtube");
    if (!apiKey) {
      throw new Error("Google Sheets API key not configured");
    }

    console.log(`[Google Sheets] Updating topic ${topicId} status to ${status}`);

    // TODO: Implement actual Google Sheets API call
    // const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    // await sheets.spreadsheets.values.update({
    //   spreadsheetId: config.spreadsheetId,
    //   range: `${config.sheetName}!B${rowIndex}`,
    //   valueInputOption: "RAW",
    //   requestBody: {
    //     values: [[status]],
    //   },
    // });
  } catch (error) {
    console.error("[Google Sheets] Error updating status:", error);
    throw new Error(`Failed to update status in Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Append result to Google Sheets
 */
export async function appendResultToSheet(
  userId: number,
  config: SheetConfig,
  topic: string,
  youtubeUrl: string,
  status: string
): Promise<void> {
  try {
    const apiKey = await getApiKey(userId, "youtube");
    if (!apiKey) {
      throw new Error("Google Sheets API key not configured");
    }

    console.log(`[Google Sheets] Appending result for topic: ${topic}`);

    // TODO: Implement actual Google Sheets API call
    // const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    // await sheets.spreadsheets.values.append({
    //   spreadsheetId: config.spreadsheetId,
    //   range: `${config.sheetName}!A:D`,
    //   valueInputOption: "RAW",
    //   requestBody: {
    //     values: [[topic, status, youtubeUrl, new Date().toISOString()]],
    //   },
    // });
  } catch (error) {
    console.error("[Google Sheets] Error appending result:", error);
    throw new Error(`Failed to append result to Google Sheets: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Validate Google Sheets configuration
 */
export async function validateSheetsConfig(
  userId: number,
  config: SheetConfig
): Promise<boolean> {
  try {
    const apiKey = await getApiKey(userId, "youtube");
    if (!apiKey) {
      throw new Error("Google Sheets API key not configured");
    }

    // TODO: Implement actual validation
    console.log(`[Google Sheets] Validating config for ${config.spreadsheetId}`);

    return true;
  } catch (error) {
    console.error("[Google Sheets] Config validation failed:", error);
    return false;
  }
}
