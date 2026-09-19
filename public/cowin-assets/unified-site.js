(() => {
  if (window.cowinSiteReady) return;
  window.cowinSiteReady = true;
  const header = document.querySelector('.cowin-header');
  const toggle = header?.querySelector('.cowin-toggle');
  const dropdown = header?.querySelector('.cowin-dropdown');
  const trigger = dropdown?.querySelector('button');
  let closeTimer;
  function setDropdown(open) {
    clearTimeout(closeTimer);
    dropdown?.classList.toggle('is-open', open);
    trigger?.setAttribute('aria-expanded', String(open));
  }
  function close() {
    header?.classList.remove('menu-open');
    toggle?.setAttribute('aria-expanded', 'false');
    setDropdown(false);
  }
  toggle?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(open));
    if (!open) setDropdown(false);
  });
  trigger?.addEventListener('click', (event) => setDropdown(event.pointerType === 'mouse' && matchMedia('(min-width: 981px)').matches ? true : trigger.getAttribute('aria-expanded') !== 'true'));
  dropdown?.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse' && matchMedia('(min-width: 981px)').matches) setDropdown(true); });
  dropdown?.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') closeTimer = setTimeout(() => setDropdown(false), 160); });
  dropdown?.addEventListener('focusout', (event) => { if (!dropdown.contains(event.relatedTarget)) setDropdown(false); });
  header?.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('click', event => { if (!header?.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); } });
  window.addEventListener('pageshow', close);
  matchMedia('(min-width: 981px)').addEventListener('change', close);

  document.querySelectorAll('form[action="/api/inquiry"]').forEach(form => {
    const button = form.querySelector('[type="submit"]');
    const status = document.createElement('p');
    status.className = 'inquiry-feedback';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
    let pending = false;
    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (pending || !form.reportValidity()) return;
      pending = true;
      const label = button?.textContent;
      if (button) { button.disabled = true; button.textContent = 'Sending inquiry…'; }
      status.textContent = 'Sending your inquiry. Please wait.';
      try {
        const response = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to send. Please try again or contact us on WhatsApp.');
        status.textContent = 'Thank you. Your inquiry has been received by our team.';
        form.reset();
      } catch (error) {
        status.textContent = error.message || 'Connection interrupted. Your details are still here. Please try again or contact us on WhatsApp.';
      } finally {
        pending = false;
        delete form.dataset.submitting;
        if (button) { button.disabled = false; button.removeAttribute('aria-busy'); button.textContent = label; }
      }
    }, true);
  });
})();
