(() => {
  const page = document.querySelector('.interior');
  if (!page) return;

  for (const box of page.querySelectorAll('[data-collapsible-wide]')) {
    const narrow = matchMedia('(max-width:' + (box.dataset.collapsibleWide || 760) + 'px)');
    const sync = () => { box.open = !narrow.matches; };
    sync();
    narrow.addEventListener('change', sync);
  }

  for (const img of page.querySelectorAll('.cw-media img')) {
    const media = img.closest('.cw-media');
    const failed = () => media.setAttribute('data-media-missing', '');
    img.addEventListener('error', failed);
    img.addEventListener('load', () => media.removeAttribute('data-media-missing'));
    if (img.complete && !img.naturalWidth) failed();
  }

  for (const gallery of page.querySelectorAll('[data-multi-gallery]')) {
    const photo = gallery.querySelector('.cw-gallery-main img');
    const thumbs = [...gallery.querySelectorAll('[data-gallery-src]')];
    const zoom = gallery.querySelector('[data-gallery-zoom]');
    const dialog = gallery.querySelector('dialog');
    if (!photo || !zoom || !dialog) continue;
    const dialogPhoto = dialog.querySelector('img');
    for (const thumb of thumbs) {
      thumb.addEventListener('click', () => {
        if (thumb.getAttribute('aria-pressed') === 'true') return;
        photo.closest('.cw-media').removeAttribute('data-media-missing');
        photo.alt = thumb.dataset.galleryAlt;
        photo.src = thumb.dataset.gallerySrc;
        for (const item of thumbs) item.setAttribute('aria-pressed', String(item === thumb));
      });
    }
    zoom.addEventListener('click', () => {
      if (!photo.getAttribute('src') || photo.closest('.cw-media').hasAttribute('data-media-missing')) return;
      dialogPhoto.src = photo.src;
      dialogPhoto.alt = photo.alt;
      dialog.showModal();
    });
    dialog.addEventListener('close', () => zoom.focus());
  }

  const sectionNav = page.querySelector('.cw-section-nav');
  if (sectionNav) {
    const links = [...sectionNav.querySelectorAll('a')];
    const setCurrent = () => {
      const hash = location.hash || '#specifications';
      for (const link of links) {
        if (link.hash === hash) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    };
    setCurrent();
    window.addEventListener('hashchange', setCurrent);
  }

  const bar = page.querySelector('[data-mobile-quote]');
  const inquiry = page.querySelector('#inquiry');
  if (bar && inquiry) {
    const form = inquiry.querySelector('form');
    let formVisible = false;
    const sync = () => {
      bar.hidden = formVisible || Boolean(form?.contains(document.activeElement));
    };
    if (location.hash === '#inquiry') bar.hidden = true;
    new IntersectionObserver(([entry]) => {
      formVisible = entry.isIntersecting;
      sync();
    }, { rootMargin: '0px 0px 70px' }).observe(inquiry);
    inquiry.addEventListener('focusin', sync);
    inquiry.addEventListener('focusout', () => requestAnimationFrame(sync));
  }

})();
