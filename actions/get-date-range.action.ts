import { userLogger } from "@dynatrace-sdk/automation-action-utils/actions";
import { getDateRangeSchema } from "../ui/shared/types/get-date-range";
import yesterday from "../ui/shared/utils";

function buildDayRange(dateStr: string): { from_time: string; to_time: string } {
  // Parse YYYY-MM-DD as UTC midnight to match the same convention as yesterday()
  const date = new Date(dateStr + "T00:00:00Z");

  date.setUTCHours(0, 0, 0, 0);
  const from_time = date.toISOString().slice(0, -1); // remove trailing Z

  date.setUTCHours(23, 59, 59, 0);
  const to_time = date.toISOString().slice(0, -1);

  return { from_time, to_time };
}

export default async (rawPayload: unknown) => {
  const payload = getDateRangeSchema.parse(rawPayload);

  let from_time: string;
  let to_time: string;
  let target_date: string;

  if (payload.target_date && payload.target_date.trim() !== "") {
    const range = buildDayRange(payload.target_date.trim());
    from_time = range.from_time;
    to_time = range.to_time;
    target_date = payload.target_date.trim();
    userLogger.info(`[get-date-range] Using provided date: ${target_date} → ${from_time} to ${to_time}`);
  } else {
    const interval = yesterday();
    from_time = interval.from_time;
    to_time = interval.to_time;
    target_date = from_time.slice(0, 10);
    userLogger.info(`[get-date-range] No date provided, defaulting to yesterday: ${target_date} → ${from_time} to ${to_time}`);
  }

  return { from_time, to_time, target_date };
};
