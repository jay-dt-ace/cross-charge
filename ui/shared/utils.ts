export default function yesterday() {
  // Calculate yesterday
  const Yesterday = new Date(); // get a new Date for "today"
  Yesterday.setDate(Yesterday.getDate() - 1); // subtract 1 day from today

  // Set the start time of the previous day (00:00:00)
  Yesterday.setUTCHours(0);
  Yesterday.setUTCMinutes(0);
  Yesterday.setUTCSeconds(0);
  Yesterday.setUTCMilliseconds(0);

  // yesterday at start of day
  const from = Yesterday.toISOString().slice(0, -1); // remove "Z" from end of string

  // Set the end time of the previous day (23:59:59)
  Yesterday.setUTCHours(23);
  Yesterday.setUTCMinutes(59);
  Yesterday.setUTCSeconds(59);

  // Yesterday end of day
  const to = Yesterday.toISOString().slice(0, -1); // remove "Z" from end of string

  return { from_time: from, to_time: to };
}
