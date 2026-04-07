/**
 * Discord Webhook 배치 알림 공통 모듈.
 *
 * 사용법:
 *   import { notifyDiscord } from "../_shared/discord-notify.ts";
 *   await notifyDiscord({ jobName: "daily-sync-opendart", status: "success", rows: 150, elapsedMs: 3200 });
 */

interface BatchResult {
  jobName: string;
  status: "success" | "error" | "partial";
  rows: number;
  elapsedMs: number;
  errors?: string[];
}

const COLOR_SUCCESS = 3066993;   // #2ECC71
const COLOR_ERROR = 15158332;    // #E74C3C
const COLOR_PARTIAL = 16776960;  // #FFC300

const STATUS_EMOJI: Record<string, string> = {
  success: "\u2705",
  error: "\u274c",
  partial: "\u26a0\ufe0f",
};

export async function notifyDiscord(result: BatchResult): Promise<void> {
  const url = Deno.env.get("DISCORD_WEBHOOK_URL");
  if (!url) return;

  const color =
    result.status === "success"
      ? COLOR_SUCCESS
      : result.status === "error"
        ? COLOR_ERROR
        : COLOR_PARTIAL;

  const emoji = STATUS_EMOJI[result.status] ?? "\u2753";
  const elapsed = (result.elapsedMs / 1000).toFixed(1);

  const fields: { name: string; value: string; inline: boolean }[] = [
    { name: "Status", value: `${emoji} ${result.status.toUpperCase()}`, inline: true },
    { name: "Rows", value: String(result.rows), inline: true },
    { name: "Duration", value: `${elapsed}s`, inline: true },
  ];

  if (result.errors?.length) {
    const errorText = result.errors.slice(0, 5).join("\n");
    fields.push({
      name: "Errors",
      value: `\`\`\`${errorText.slice(0, 1000)}\`\`\``,
      inline: false,
    });
  }

  const payload = {
    embeds: [
      {
        title: result.jobName,
        color,
        fields,
        footer: { text: "omnia-invest" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      console.error(`[WARN] Discord 알림 실패: ${resp.status}`);
    }
  } catch (e) {
    console.error(`[WARN] Discord 알림 전송 실패: ${e}`);
  }
}
