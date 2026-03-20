const statusEl = document.getElementById('jsonbin-status');

export function showStatus(message, type = 'info') {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `jsonbin-status ${type}`;
  statusEl.style.display = 'inline-flex';
}

export function hideStatus(delay = 3000) {
  setTimeout(() => {
    if (statusEl) statusEl.style.display = 'none';
  }, delay);
}
