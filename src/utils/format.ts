export function formatTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function statusColor(status: "GREEN" | "YELLOW" | "RED"): string {
  switch (status) {
    case "GREEN":
      return "#10b981";
    case "YELLOW":
      return "#facc15";
    case "RED":
      return "#f97316";
    default:
      return "white";
  }
}

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
