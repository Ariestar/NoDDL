import { ParsedDeadline, parseDeadlineBeijing } from '../core/time';

/**
 * Read the deadline from the experiment sidebar rendered by the platform.
 * The page exposes both start and end times in one paragraph, so only the
 * value following the visible "截止时间" label is considered.
 */
export function parseExperimentDeadlineFromDom(doc: Document, nowMs = Date.now()): ParsedDeadline | undefined {
  const deadlineText = Array.from(
    doc.querySelectorAll<HTMLElement>('.blog-sidebar .panel-body p')
  ).find(element => /截止时间/.test(element.textContent || ''))?.textContent;

  const match = deadlineText?.match(
    /截止时间\s*[：:]\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?)/
  );
  if (!match) return undefined;

  const parsed = parseDeadlineBeijing(match[1], nowMs);
  return parsed.timestamp > 0 ? parsed : undefined;
}
