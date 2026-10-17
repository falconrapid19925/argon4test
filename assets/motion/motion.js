/* Shared static-demo motion. Recipes: transitions.dev; text rolls: slot-text 0.3.4. */
(() => {
  'use strict';
  const scriptURL = document.currentScript.src;
  const rootURL = new URL('../../', scriptURL);
  const demos = {
    noema: ['Noema', 'second_brain_landing_pages.html'],
    cairn: ['Cairn', 'cairn_second_brain_iterations.html'],
    commonplace: ['Commonplace', 'second_brain_five_landing_page_iterations.html']
  };
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = new Map();
  const effects = new Map();
  let slotFactory;
  let activePage;
  let activeIteration = 1;
  let navigation;
  let navigationTimer;
  let navigationExit;
  const resolve = target => typeof target === 'string' ? document.querySelector(target) : target;
  const clamp = n => Math.max(1, Math.min(5, parseInt(n, 10) || 1));
  const reduced = () => preference.matches;
  const token = (el, name, fallback) => parseFloat(getComputedStyle(el).getPropertyValue(name)) || fallback;
  const remember = (key, value) => { try { sessionStorage.setItem(key, String(value)); } catch {} };
  const recall = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  // A failed optional module leaves all labels as ordinary, usable text.
  const ready = import(new URL('../vendor/slot-text/index.js', scriptURL).href)
    .then(module => { slotFactory = module.slotText; return true; })
    .catch(() => false);

  function initial() {
    const hash = location.hash.match(/^#\/(?:pages\/)?([1-5])\/?$/);
    if (hash) return Number(hash[1]);
    const query = new URLSearchParams(location.search);
    for (const key of ['page', 'iter', 'v']) {
      if (/^[1-5]$/.test(query.get(key) || '')) return Number(query.get(key));
    }
    const path = location.pathname.match(/\/(?:pages\/)?([1-5])\/?$/);
    return path ? Number(path[1]) : 1;
  }

  function route(demo, n, updateHistory = true) {
    if (!demos[demo]) return;
    n = clamp(n);
    activeIteration = n;
    remember('motion:last:' + demo, n);
    const url = new URL(demos[demo][1], rootURL);
    url.hash = '/pages/' + n;
    // Keep query values unrelated to routing without allowing an old page= value to override history.
    url.search = location.search;
    for (const key of ['page', 'iter', 'v']) url.searchParams.delete(key);
    // In-page anchors belong to the document, not the iteration router.
    if (!updateHistory && location.hash && !/^#\/(?:pages\/)?[1-5]\/?$/.test(location.hash)) return;
    if (url.href !== location.href) {
      history[updateHistory ? 'pushState' : 'replaceState']({iteration: n}, '', url);
    } else if (!history.state || history.state.iteration !== n) {
      history.replaceState({iteration: n}, '', url);
    }
    updateNavigation();
  }

  function cleanupLabels() {
    for (const [el, record] of labels) {
      if (!el.isConnected || !el.contains(record.visual)) {
        record.controller.destroy();
        labels.delete(el);
      }
    }
  }

  function text(target, value) {
    const el = resolve(target);
    if (!el) return;
    value = String(value);
    let record = labels.get(el);
    if (record && !el.contains(record.visual)) {
      record.controller.destroy(); labels.delete(el); record = undefined;
    }
    if (record && record.value === value) return;
    if (reduced() || !slotFactory || value.length > 42 || /^H[1-6]$/.test(el.tagName)) {
      if (record) { record.controller.destroy(); labels.delete(el); }
      el.textContent = value;
      el.dataset.motionText = value;
      return;
    }
    if (!record) {
      const previous = el.textContent.trim();
      const accessible = document.createElement('span');
      accessible.className = 'motion-sr-only';
      const visual = document.createElement('span');
      visual.className = 'motion-text-visual';
      visual.setAttribute('aria-hidden', 'true');
      el.replaceChildren(accessible, visual);
      const controller = slotFactory(visual, previous, {
        rollBy: 'word', direction: 'up', duration: token(el, '--duration-quick', 150),
        stagger: 20, bounce: 0, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', interrupt: true
      });
      record = {controller, visual, accessible};
      labels.set(el, record);
    }
    record.value = value;
    record.accessible.textContent = value;
    el.dataset.motionText = value;
    record.controller.set(value);
  }

  function reveal(target, options = {}) {
    const el = resolve(target);
    if (!el) return;
    const old = effects.get(el);
    if (old) { old.cancel(); effects.delete(el); }
    el.dataset.motionReplays = String(Number(el.dataset.motionReplays || 0) + 1);
    if (reduced() || !el.animate || !el.getClientRects().length) return;
    const duration = options.duration ?? token(el, '--duration-fast', 250);
    const distance = options.distance ?? token(el, '--distance-base', 8);
    // Composite existing transforms rather than overwriting card rotations / drag positions.
    const baseTransform = getComputedStyle(el).transform;
    const base = baseTransform === 'none' ? '' : baseTransform;
    const animation = el.animate([
      {opacity: 0.2, transform: `${base} translateY(${distance}px)`},
      {opacity: 1, transform: base || 'none'}
    ], {duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)'});
    effects.set(el, animation);
    animation.finished.then(() => { if (effects.get(el) === animation) effects.delete(el); }).catch(() => {});
  }

  function enter(page, n) {
    page = resolve(page);
    if (!page) return;
    const previous = activePage;
    const focusWasInside = previous && previous !== page && previous.contains(document.activeElement);
    document.querySelectorAll('[data-demo-page]').forEach(el => {
      el.inert = el !== page;
      el.setAttribute('aria-hidden', el === page ? 'false' : 'true');
    });
    cleanupLabels();
    activeIteration = clamp(n);
    if (previous !== page) {
      if (previous) {
        previous.classList.remove('is-shown');
        previous.querySelectorAll('[data-motion]').forEach(el => {
          const effect = effects.get(el); if (effect) { effect.cancel(); effects.delete(el); }
        });
        const effect = effects.get(previous); if (effect) { effect.cancel(); effects.delete(previous); }
      }
      activePage = page;
      page.classList.add('t-stagger');
      const items = page.querySelectorAll('[data-motion]');
      items.forEach((el, index) => {
        el.classList.add('t-stagger-line');
        el.style.transitionDelay = reduced() ? '0ms' : `${Math.min(index, 5) * token(page, '--duration-stagger', 40)}ms`;
      });
      page.classList.remove('is-shown', 'is-hiding');
      void page.offsetHeight;
      page.classList.add('is-shown');
      page.dataset.motionEntries = String(Number(page.dataset.motionEntries || 0) + 1);
      // Fade only the page shell: fixed children and canvas geometry retain their coordinates.
      if (!reduced() && page.animate) {
        const animation = page.animate([{opacity: .15}, {opacity: 1}], {
          duration: token(page, '--page-slide-dur', 250), easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
        });
        effects.set(page, animation);
        animation.finished.then(() => { if (effects.get(page) === animation) effects.delete(page); }).catch(() => {});
      }
      if (focusWasInside) {
        const heading = page.querySelector('h1, h2');
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({preventScroll: true}); }
      }
    }
    updateNavigation();
    moveIterationPill();
  }

  function updateNavigation() {
    if (!navigation) return;
    const demo = document.body.dataset.demo;
    navigation.querySelectorAll('[data-collection]').forEach(link => {
      const key = link.dataset.collection;
      const url = new URL(demos[key][1], rootURL);
      url.hash = '/pages/' + (key === demo ? activeIteration : clamp(recall('motion:last:' + key)));
      link.href = url.href;
      if (key === demo) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    text(navigation.querySelector('.motion-position'), activeIteration + ' / 5');
  }

  function movePill(bar, target, pill, animated) {
    if (!target) return;
    const previous = pill.style.transition;
    if (!animated) pill.style.transition = 'none';
    pill.style.transform = `translateX(${target.offsetLeft}px)`;
    pill.style.width = `${target.offsetWidth}px`;
    if (!animated) { void pill.offsetWidth; pill.style.transition = previous; }
  }

  function moveIterationPill(animated = true) {
    const bar = document.querySelector('.switcher-Number-group, .switcher-tabs, [aria-label="Iteration routes"]');
    if (!bar) return;
    bar.classList.add('motion-iteration-track');
    let pill = bar.querySelector('.motion-iteration-pill');
    if (!pill) {
      pill = document.createElement('span'); pill.className = 'motion-iteration-pill';
      pill.setAttribute('aria-hidden', 'true'); bar.prepend(pill); animated = false;
    }
    const buttons = [...bar.querySelectorAll('button')];
    buttons.forEach((button, index) => {
      if (index + 1 === activeIteration) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    const target = buttons[activeIteration - 1];
    if (target) { pill.style.top = `${target.offsetTop}px`; pill.style.height = `${target.offsetHeight}px`; }
    movePill(bar, target, pill, animated && !reduced());
  }

  function installNavigation() {
    if (!document.body.dataset.demo) return;
    navigation = document.createElement('nav');
    navigation.className = 'motion-navigation'; navigation.setAttribute('aria-label', 'Design collections');
    const brand = document.createElement('span'); brand.className = 'motion-brand'; brand.textContent = 'Design studies';
    const bar = document.createElement('div'); bar.className = 't-tabs';
    const pill = document.createElement('span'); pill.className = 't-tabs-pill'; pill.setAttribute('aria-hidden', 'true');
    bar.append(pill);
    for (const [key, [name]] of Object.entries(demos)) {
      const link = document.createElement('a'); link.className = 't-tab';
      link.dataset.collection = key; link.textContent = name; bar.append(link);
    }
    const position = document.createElement('span'); position.className = 'motion-position';
    position.setAttribute('aria-label', 'Current iteration');
    navigation.append(brand, bar, position); document.body.prepend(navigation);
    navigation.addEventListener('click', event => {
      const link = event.target.closest('a[data-collection]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
      clearTimeout(navigationTimer);
      if (navigationExit) navigationExit.cancel();
      if (reduced() || !activePage || !activePage.animate) return;
      event.preventDefault();
      const destination = link.href;
      const duration = token(activePage, '--duration-quick', 150);
      navigationExit = activePage.animate([{opacity: 1}, {opacity: 0}], {duration, fill: 'forwards'});
      navigationTimer = setTimeout(() => location.assign(destination), duration);
    });
    window.addEventListener('pageshow', () => {
      clearTimeout(navigationTimer);
      if (navigationExit) { navigationExit.cancel(); navigationExit = undefined; }
      updateNavigation();
    });
    updateNavigation();
    const place = () => {
      movePill(bar, bar.querySelector('[aria-current="page"]'), pill, false);
      moveIterationPill(false);
    };
    requestAnimationFrame(place);
    window.addEventListener('resize', place);
    if (document.fonts) document.fonts.ready.then(place);
    // Keep the initial status plain until the optional text module is available.
    ready.then(() => updateNavigation());
  }

  preference.addEventListener('change', () => {
    if (!reduced()) return;
    for (const animation of effects.values()) animation.cancel(); effects.clear();
    for (const [el, record] of labels) { record.controller.destroy(); el.textContent = record.value; }
    labels.clear();
  });
  window.DemoMotion = {route, initial, enter, text, reveal, reduced, ready};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installNavigation, {once: true});
  else installNavigation();
})();
