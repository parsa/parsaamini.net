(() => {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  const endpoint = form.dataset.endpoint;
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById('contact-status');
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)) return;
  button.disabled = false;
  status.textContent = '';
  let pending = null;
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const data = new URLSearchParams(new FormData(form));
    const contents = data.toString();
    if (!pending || pending.contents !== contents) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      pending = {contents, id: Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')};
    }
    data.set('submission_id', pending.id);
    sending = true;
    button.disabled = true;
    form.querySelectorAll('input,textarea').forEach(field => field.readOnly = true);
    status.textContent = 'Sending…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      // URL-encoded body is a CORS simple request; no credentials or custom headers.
      // Require a readable receipt before confirming delivery.
      const response = await fetch(endpoint, {method: 'POST', body: data, credentials: 'omit', redirect: 'follow', signal: controller.signal});
      if (!response.ok) throw new Error('Transport failure');
      const receipt = await response.json();
      if (receipt.ok === true && receipt.id === pending.id) {
        status.textContent = 'Thank you. Your message has been received.';
        form.reset();
        pending = null;
      } else {
        status.textContent = receipt.ok === false && typeof receipt.error === 'string'
          ? receipt.error : 'We could not confirm delivery. Please try again.';
      }
    } catch (_) {
      status.textContent = 'We could not confirm delivery. Your message is still here; please try again.';
    } finally {
      clearTimeout(timer);
      sending = false;
      button.disabled = false;
      form.querySelectorAll('input,textarea').forEach(field => field.readOnly = false);
    }
  });
})();
