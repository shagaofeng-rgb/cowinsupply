(() => {
  if (window.cowinSiteReady) return;
  window.cowinSiteReady = true;
  const header = document.querySelector('.cowin-header');
  const toggle = header?.querySelector('.cowin-toggle');
  const nav = header?.querySelector('.cowin-nav');
  const dropdown = header?.querySelector('.cowin-dropdown');
  const trigger = dropdown?.querySelector('button');
  const panel = dropdown?.querySelector('.cowin-dropdown-panel');
  const wide = matchMedia('(min-width: 981px)');
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
    if (open) trigger?.focus();
    else setDropdown(false);
  });
  trigger?.addEventListener('click', (event) => {
    const hoverClick = event.detail > 0 && event.pointerType === 'mouse' && wide.matches;
    setDropdown(hoverClick || trigger.getAttribute('aria-expanded') !== 'true');
    if (!wide.matches) trigger.focus();
  });
  dropdown?.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse' && wide.matches) setDropdown(true); });
  dropdown?.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && wide.matches) {
      closeTimer = setTimeout(() => { if (!panel?.contains(document.activeElement)) setDropdown(false); }, 160);
    }
  });
  dropdown?.addEventListener('focusout', (event) => { if (!dropdown.contains(event.relatedTarget)) setDropdown(false); });
  header?.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
  document.addEventListener('click', event => { if (!header?.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (trigger?.getAttribute('aria-expanded') === 'true') {
      const restore = dropdown.contains(document.activeElement) || toggle?.getAttribute('aria-expanded') === 'true';
      setDropdown(false);
      if (restore) trigger.focus();
      event.preventDefault();
    } else if (toggle?.getAttribute('aria-expanded') === 'true') {
      const restore = nav?.contains(document.activeElement) || document.activeElement === document.body;
      close();
      if (restore) toggle.focus();
      event.preventDefault();
    }
  });
  // Reset a restored page, but leave menus alone while a new page finishes loading.
  window.addEventListener('pageshow', (event) => { if (event.persisted) close(); });
  wide.addEventListener('change', close);

  document.querySelectorAll('form[action="/api/inquiry"]').forEach(form => {
    const button = form.querySelector('[type="submit"]');
    const confirmation = form.hasAttribute('data-inquiry-confirmation');
    const labelNode = button?.querySelector('[data-submit-label]') || button;
    const providedStatus = form.querySelector('.inquiry-feedback');
    const status = providedStatus || document.createElement('p');
    status.classList.add('inquiry-feedback');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    if (!providedStatus) form.append(status);
    let pending = false;
    let submissionKey;
    const label = labelNode?.textContent;
    const restore = () => {
      pending = false;
      delete form.dataset.submitting;
      if (button) { button.disabled = false; button.removeAttribute('aria-busy'); labelNode.textContent = label; }
    };
    if (confirmation) window.addEventListener('pageshow', event => {
      if (!event.persisted) return;
      restore();
      status.textContent = '';
      delete status.dataset.state;
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (pending || !form.reportValidity()) return;
      pending = true;
      let navigating = false;
      if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); labelNode.textContent = 'Sending inquiry…'; }
      if (confirmation) status.dataset.state = 'pending';
      status.textContent = 'Sending your inquiry. Please wait.';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000);
      try {
        submissionKey ||= window.crypto?.randomUUID?.();
        const headers = { 'Content-Type': 'application/json' };
        if (submissionKey) headers['Idempotency-Key'] = submissionKey;
        const response = await fetch('/api/inquiry', { method: 'POST', headers, signal: controller.signal, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to send. Please try again or contact us on WhatsApp.');
        submissionKey = undefined;
        status.textContent = 'Thank you. Your inquiry has been received by our team.';
        if (confirmation) {
          status.dataset.state = 'success';
          form.reset();
          window.location.assign('/message?success=1');
          navigating = true;
        } else {
          form.reset();
        }
      } catch (error) {
        if (confirmation) status.dataset.state = 'error';
        status.textContent = (controller.signal.aborted || error instanceof TypeError ? '' : error.message) || 'Connection interrupted. Your details are still here. Please try again or contact us on WhatsApp.';
      } finally {
        clearTimeout(timeout);
        if (!navigating) restore();
      }
    }, true);
  });
})();
