// content/extractLinks.ts
// Extracts real URLs from table cells, cleaning tracking params

export interface LinkData {
  text: string;
  url: string | null;
}

export function extractLink(cell: Element): LinkData {
  const anchor = cell.querySelector('a');

  if (!anchor) {
    return {
      text: (cell.textContent || '').trim(),
      url: null,
    };
  }

  const href = anchor.getAttribute('href') || '';
  const text = (anchor.textContent || '').trim();

  return {
    text,
    url: cleanUrl(href),
  };
}

export function cleanUrl(href: string): string | null {
  if (!href || href === '#' || href.startsWith('javascript:')) return null;

  try {
    // Handle relative URLs
    const url = href.startsWith('http') ? new URL(href) : new URL(href, window.location.origin);

    // Remove common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'ref', 'referrer', 'fbclid', 'gclid', 'msclkid',
      '_ga', '_gl', 'mc_cid', 'mc_eid',
      'source', 'medium', 'campaign',
    ];

    trackingParams.forEach(param => url.searchParams.delete(param));

    // Remove fragment/hash
    url.hash = '';

    return url.toString();
  } catch {
    // If URL parsing fails, return cleaned string
    return href.split('#')[0].split('?')[0] || null;
  }
}

export function extractAllLinks(cell: Element): string {
  const anchors = cell.querySelectorAll('a');
  if (anchors.length === 0) return '';

  const urls = Array.from(anchors)
    .map(a => cleanUrl(a.getAttribute('href') || ''))
    .filter(Boolean);

  return urls.join(', ');
}
