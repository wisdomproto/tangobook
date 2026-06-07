/**
 * Google Analytics 4 Data API — Phase 3+ skeleton.
 *
 * Will use config.ga4.{propertyId, clientEmail, privateKey} with a
 * Google service account JWT to call the GA4 Data API.
 *
 * Endpoints planned:
 *  - POST https://analyticsdata.googleapis.com/v1beta/properties/{id}:runReport
 */

import { AppError } from '../../../middleware/error.middleware.js';

export interface GA4Dimension {
  name: string;
}

export interface GA4Metric {
  name: string;
}

export interface GA4ReportRow {
  dimensionValues: string[];
  metricValues: string[];
}

export interface GA4Report {
  dimensionHeaders: string[];
  metricHeaders: string[];
  rows: GA4ReportRow[];
  rowCount: number;
}

/**
 * Run a report against GA4 Data API.
 * Phase 3+: currently throws 501 until wired.
 */
export async function runReport(
  _dateRanges: Array<{ startDate: string; endDate: string }>,
  _dimensions: GA4Dimension[],
  _metrics: GA4Metric[]
): Promise<GA4Report> {
  throw new AppError(501, 'GA4 not wired yet (Phase 3+)');
}

/**
 * Get active users / sessions summary for a date range.
 * Phase 3+: currently throws 501 until wired.
 */
export async function getSessionsSummary(
  _startDate: string,
  _endDate: string
): Promise<{ sessions: number; activeUsers: number; bounceRate: number }> {
  throw new AppError(501, 'GA4 not wired yet (Phase 3+)');
}
