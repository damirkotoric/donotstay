export type BadgeState = 'loading' | 'stay' | 'depends' | 'do_not_stay' | 'error' | 'rate_limited';

interface BadgeUpdate {
  state: BadgeState;
  verdict?: string;
  confidence?: number;
  message?: string;
}

let badgeElement: HTMLElement | null = null;

/**
 * Inject the floating badge into the page
 */
export function injectBadge(onClick: () => void): void {
  // Remove existing badge if present
  const existing = document.getElementById('donotstay-badge');
  if (existing) {
    existing.remove();
  }

  badgeElement = document.createElement('div');
  badgeElement.id = 'donotstay-badge';
  badgeElement.className = 'loading';
  badgeElement.innerHTML = `
    <div class="spinner"></div>
    <span class="text">Analyzing...</span>
  `;
  badgeElement.addEventListener('click', onClick);

  document.body.appendChild(badgeElement);
}

/**
 * Update badge state and content
 */
export function updateBadge(update: BadgeUpdate): void {
  if (!badgeElement) return;

  badgeElement.className = update.state;

  switch (update.state) {
    case 'loading':
      badgeElement.innerHTML = `
        <div class="spinner"></div>
        <span class="text">Analyzing...</span>
      `;
      break;

    case 'stay':
      badgeElement.innerHTML = `
        <span class="icon">&#10003;</span>
        <span class="text">Stay</span>
        ${update.confidence ? `<span class="confidence">${update.confidence}%</span>` : ''}
      `;
      break;

    case 'depends':
      badgeElement.innerHTML = `
        <span class="icon">&#8226;</span>
        <span class="text">It depends</span>
        ${update.confidence ? `<span class="confidence">${update.confidence}%</span>` : ''}
      `;
      break;

    case 'do_not_stay':
      badgeElement.innerHTML = `
        <span class="icon">&#10007;</span>
        <span class="text">Do Not Stay</span>
        ${update.confidence ? `<span class="confidence">${update.confidence}%</span>` : ''}
      `;
      break;

    case 'error':
      badgeElement.innerHTML = `
        <span class="icon">!</span>
        <span class="text">${update.message || 'Error'}</span>
      `;
      break;

    case 'rate_limited':
      badgeElement.innerHTML = `
        <span class="icon">&#128274;</span>
        <span class="text">Limit reached</span>
      `;
      break;
  }
}

/**
 * Remove badge from page
 */
export function removeBadge(): void {
  if (badgeElement) {
    badgeElement.remove();
    badgeElement = null;
  }
}
