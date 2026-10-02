/* Responsive navigation and current-page state for the site's shared header. */
(() => {
  const menu = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('.nav-drawer');
  const backdrop = document.querySelector('.drawer-backdrop');
  const header = document.querySelector('.site-header-bar');
  const desktop = matchMedia('(min-width: 768px)');
  const path = location.pathname.replace(/\/$/, '');
  let open = false;

  document.querySelectorAll('a[data-navtype][href]').forEach(link => {
    const target = new URL(link.href).pathname.replace(/\/$/, '');
    const active = target === path || (target.endsWith('/home') && (path === '' || path === new URL(document.querySelector('.brand-link').href).pathname.replace(/\/home\/$/, '')));
    const item = link.closest('.nav-item');
    item.classList.toggle('drawer-item-active', active && item.classList.contains('drawer-item'));
    item.classList.toggle('desktop-item-active', active && item.classList.contains('desktop-item'));
    item.removeAttribute('aria-current');
    link.removeAttribute('aria-selected');
    if (active) link.setAttribute('aria-current', 'page');
  });

  function toggle(value) {
    open = value && !desktop.matches;
    drawer.style.display = open ? 'block' : 'none';
    drawer.classList.toggle('drawer-open', open);
    drawer.inert = !open;
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close sidebar' : 'Show sidebar');
    menu.title = open ? 'Close sidebar' : 'Show sidebar';
    header.style.opacity = open ? '0' : '';
    header.inert = open;
    backdrop.style.width = open ? '100%' : '';
    backdrop.style.opacity = open ? '0.5' : '';
    backdrop.style.zIndex = open ? '60' : '';
    const icon = menu.querySelector('svg');
    icon.classList.toggle('menu-icon-open', open);
    icon.querySelector('.menu-line-top').setAttribute('d', open ? 'M-9 -9 L9 9' : 'M-9 -5 L9 -5');
    icon.querySelector('.menu-line-middle').style.opacity = open ? '0' : '';
    icon.querySelector('.menu-line-bottom').setAttribute('d', open ? 'M-9 9 L9 -9' : 'M-9 5 L9 5');
  }
  menu.addEventListener('click', () => toggle(!open));
  menu.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(!open); }
  });
  backdrop.addEventListener('click', () => toggle(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && open) { toggle(false); menu.focus(); }
    if (event.key === 'Tab' && open) {
      const links = [...drawer.querySelectorAll('ul a[href]')];
      if (event.shiftKey && document.activeElement === menu) { event.preventDefault(); links.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); menu.focus(); }
    }
  });
  desktop.addEventListener('change', () => toggle(false));
  toggle(false);
})();
