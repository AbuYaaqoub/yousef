// content/extractTooltips.ts
// Extracts real values hidden inside tooltips, aria-labels, title attributes, hidden spans

export function extractTooltipValue(cell: Element): string | null {
  // 1. Check aria-label on the cell itself
  const ariaLabel = cell.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    const clean = ariaLabel.trim();
    if (isNumericValue(clean)) return clean;
  }

  // 2. Check title attribute
  const title = cell.getAttribute('title');
  if (title && title.trim()) {
    const clean = title.trim();
    if (isNumericValue(clean)) return clean;
  }

  // 3. Look for hidden spans with full values (SEMrush often hides full numbers)
  const hiddenSpans = cell.querySelectorAll('[aria-hidden="true"], .sr-only, [class*="visually-hidden"], [class*="hidden"]');
  for (const span of hiddenSpans) {
    const text = (span.textContent || '').trim();
    if (text && isNumericValue(text)) return text;
  }

  // 4. Look for data attributes
  const dataValue = cell.getAttribute('data-value') ||
                    cell.getAttribute('data-original') ||
                    cell.getAttribute('data-full-value') ||
                    cell.getAttribute('data-number');
  if (dataValue && dataValue.trim()) return dataValue.trim();

  // 5. Check child elements for tooltip triggers
  const tooltipTrigger = cell.querySelector('[data-tooltip], [data-tippy-content], [aria-describedby]');
  if (tooltipTrigger) {
    const tooltipContent = tooltipTrigger.getAttribute('data-tooltip') ||
                           tooltipTrigger.getAttribute('data-tippy-content');
    if (tooltipContent && tooltipContent.trim()) {
      const numeric = extractNumericFromTooltip(tooltipContent);
      if (numeric) return numeric;
    }
  }

  return null;
}

function isNumericValue(text: string): boolean {
  // Matches: 1600, 1,600, 1.6K, 1.6M, 24%, 7.81%
  return /^[\d,\.]+[KkMmBb%]?$/.test(text.replace(/\s/g, ''));
}

function extractNumericFromTooltip(tooltip: string): string | null {
  // Try to find a number in the tooltip text
  const match = tooltip.match(/[\d,\.]+\s*[KkMmBb]?/);
  return match ? match[0].trim() : null;
}

export function resolveAbbreviatedValue(cell: Element, displayText: string): string {
  // First try to get the real value from tooltip
  const tooltipValue = extractTooltipValue(cell);
  if (tooltipValue) return tooltipValue;

  // Return display text as-is (preserve 1.6K, etc.)
  return displayText;
}
