// content/detectTable.ts
// Detects SEMrush data tables using semantic selectors, not fragile class names

export function detectTable(): Element | null {
  // Strategy 1: Look for standard HTML tables in the main content area
  const strategies = [
    // SEMrush uses data-test attributes in some places
    () => document.querySelector('[data-test*="table"]'),
    () => document.querySelector('[data-testid*="table"]'),

    // Look for table with thead/tbody structure
    () => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.find(t => t.querySelector('thead') && t.querySelector('tbody tr')) || null;
    },

    // SEMrush often uses div-based tables with role="grid" or role="table"
    () => document.querySelector('[role="grid"]'),
    () => document.querySelector('[role="table"]'),

    // Look for common SEMrush table container patterns
    () => document.querySelector('.___DataTable, [class*="DataTable"], [class*="data-table"]'),
    () => document.querySelector('[class*="Table_table"], [class*="table_table"]'),
    () => document.querySelector('[class*="KeywordTable"], [class*="keyword-table"]'),

    // Generic: largest table visible on screen
    () => {
      const tables = Array.from(document.querySelectorAll('table, [role="grid"], [role="table"]'));
      const visible = tables.filter(t => isElementVisible(t));
      if (visible.length === 0) return null;
      // Return the one with most rows
      return visible.reduce((best, curr) => {
        const bestRows = best.querySelectorAll('tr, [role="row"]').length;
        const currRows = curr.querySelectorAll('tr, [role="row"]').length;
        return currRows > bestRows ? curr : best;
      });
    },
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result && isElementVisible(result)) {
        return result;
      }
    } catch (e) {
      // continue to next strategy
    }
  }

  return null;
}

export function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;

  // Check it's somewhat in viewport
  return rect.top < window.innerHeight + 500 && rect.bottom > -500;
}

export function getTableHeaders(table: Element): string[] {
  // Try thead > tr > th
  const thElements = table.querySelectorAll('thead th, thead [role="columnheader"], [role="columnheader"]');
  if (thElements.length > 0) {
    return Array.from(thElements).map(th => extractCellText(th));
  }

  // Try first row
  const firstRow = table.querySelector('tr, [role="row"]');
  if (firstRow) {
    const cells = firstRow.querySelectorAll('th, td, [role="cell"], [role="gridcell"]');
    if (cells.length > 0) {
      return Array.from(cells).map(c => extractCellText(c));
    }
  }

  return [];
}

export function extractCellText(cell: Element): string {
  // Get aria-label first
  const ariaLabel = cell.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  // Get title
  const title = cell.getAttribute('title');
  if (title && title.trim()) return title.trim();

  return (cell.textContent || '').trim().replace(/\s+/g, ' ');
}
