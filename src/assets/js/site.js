/* Shared script for every page. Small, independent parts inside one wrapper that holds the shared helpers. */
(() => {
  const setInert = (el, on) => el.toggleAttribute('inert', on);

  /* Videos load and play only when needed. The hero starts straight away; a video with a data-src waits until play() is called.
     Visitors who prefer less motion get the still poster frames and nothing plays. */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const play = (video) => {
    if (calm) return;
    if (video.dataset.src) { video.src = video.dataset.src; delete video.dataset.src; }
    video.play().catch(() => {});
  };
  if (calm) document.querySelectorAll('video').forEach((video) => { video.removeAttribute('autoplay'); video.removeAttribute('src'); video.load(); }); // drops the download, the poster stays

  /* 1. Things rise into place the first time they scroll into view.
        The CSS hides them (only when the page has the .js class and the visitor allows motion);
        this adds .seen so the CSS can animate them in. */
  const items = document.querySelectorAll('.person, .case, .offer, .h2, .contact h2, .about, .foot .word');
  const reveal = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('seen');
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  items.forEach((el) => reveal.observe(el));

  /* 1a. The hero video fades in over its still first frame once it is really playing. */
  document.querySelectorAll('.hero-video').forEach((video) => {
    const show = () => {
      video.classList.add('is-playing');
      // the motion eases in too: the video starts at a quarter speed and reaches full speed over about 2 seconds, so it never lurches into motion
      const t0 = performance.now();
      video.playbackRate = 0.25;
      const ramp = (now) => {
        const x = Math.min(1, (now - t0) / 2000);
        video.playbackRate = 0.25 + 0.75 * x * x * (3 - 2 * x);
        if (x < 1) requestAnimationFrame(ramp);
      };
      requestAnimationFrame(ramp);
    };
    if (!video.paused && video.readyState > 2) show(); else video.addEventListener('playing', show, { once: true });
  });

  /* 1b. Each section's content drifts up into place as the section scrolls in. This is timed (not tied to the scroll wheel),
         so it stays smooth however you scroll. It starts as soon as the top of the section is a little way into view. */
  const drift = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('arrived');
      drift.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('main > .band, .s-foot').forEach((el) => drift.observe(el));   // the section, not its padded content, so it starts as the edge appears

  /* 2. The hero and the big section videos (the "What we do" background and the "Who we are" feature) play only while they are on screen,
        so the phone or laptop never decodes video nobody can see. The section videos start loading a little before they scroll into view. */
  document.querySelectorAll('.hero-video, .lazy-video').forEach((video) => {
    const margin = video.matches('.lazy-video') ? '200px' : '0px';
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? play(video) : video.pause()), { rootMargin: margin }).observe(video);
  });

  /* 3. Contact form: check the fields, send to Formspree without leaving the page, show the result. */
  const form = document.querySelector('.form');
  if (form) {
    const button = form.querySelector('.btn-send');
    const label = button.querySelector('.lbl-txt');
    const status = form.querySelector('.form-status');
    const say = (message) => { status.textContent = message; status.classList.add('show'); };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('tried');               // show every error message
        form.querySelector(':invalid')?.focus();
        return;
      }
      button.disabled = true;
      button.classList.add('busy');
      label.textContent = 'Sending';
      status.classList.remove('show');

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then((response) => {
          if (!response.ok) throw new Error('Formspree answered ' + response.status);
          form.classList.add('sent');
          label.textContent = 'Sent';
          say('Thank you. Your message has been sent.');
        })
        .catch(() => {
          button.disabled = false;
          label.textContent = 'Send message';
          say('Something went wrong. Please try again.');
        })
        .finally(() => button.classList.remove('busy'));
    });
  }

  /* 4. Cards: the "What we do" cards flip over (their video plays only while the back is showing),
        and the team cards expand to show a bio (the whole card is the click target). With a mouse, both close again when it leaves the card.
        The hidden side is made inert so keyboard users cannot Tab into it. */
  document.querySelectorAll('.offer').forEach((card) => {
    const front = card.querySelector('.front');
    const back = card.querySelector('.back');
    const video = card.querySelector('.card-video');
    const flipButton = card.querySelector('.flip-btn');
    const set = (flipped) => {
      card.classList.toggle('flipped', flipped);
      flipButton.setAttribute('aria-expanded', flipped);
      setInert(back, !flipped);
      setInert(front, flipped);
      if (flipped) play(video); else video.pause();
    };
    card.addEventListener('click', (event) => {
      if (event.target.closest('.more')) return;   // the link on the back works normally
      const flipped = !card.classList.contains('flipped');
      set(flipped);
      if (event.detail === 0) (flipped ? card.querySelector('.flip-back') : flipButton).focus({ preventScroll: true }); // keyboard click: follow the flip; a mouse click leaves focus alone so leaving the card can flip it back
    });
    card.addEventListener('pointerleave', (event) => { // with a mouse, moving off the card flips it back
      if (event.pointerType !== 'mouse') return;       // touch has no hover, so it stays tap to flip, tap to flip back
      if (card.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return; // keyboard user is still in it
      set(false);
    });
  });

  document.querySelectorAll('.person').forEach((person) => {
    const button = person.querySelector('.more-btn');   // the + circle is a hint, and the keyboard way in
    const bio = person.querySelector('.bio');
    const set = (open) => {
      person.classList.toggle('open', open);
      button.setAttribute('aria-expanded', open);
      setInert(bio, !open);
    };
    person.addEventListener('click', (event) => {       // a click anywhere on the card (the button's click bubbles up too)
      if (event.target.closest('a')) return;            // links inside the bio keep working
      set(!person.classList.contains('open'));
    });
    person.addEventListener('pointerleave', (event) => { // with a mouse, moving off the card closes it again
      if (event.pointerType !== 'mouse') return;        // touch has no hover, so it stays tap to open, tap to close
      if (person.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return; // keyboard user is still in it
      set(false);
    });
  });

  /* 6. The volatility-surface icon on the risk card plays a short story while the card is hovered: a flat grid, the surface rises
        from the front to the back, then a marker climbs the ridges and settles on the highest peak. Un-hovering plays it backwards.
        Each mesh cell has its flat shape in d and its risen shape in data-to (same number of points), and its flat and risen shade
        in data-g. The morph is done here, not in CSS, because Safari cannot animate the CSS `d` property. */
  if (!calm) document.querySelectorAll('.offer').forEach((card) => {
    const svg = card.querySelector('.ic-vol');
    if (!svg) return;
    const num = /-?\d*\.?\d+/g, RISE = 0.5, ease = (x) => 1 - Math.pow(1 - x, 3);
    const marker = svg.querySelector('.atm'), ring = svg.querySelector('.ring');
    const way = marker.dataset.path.split(';').map((point) => point.split(',').map(Number));
    const route = way.slice(0, -1).flatMap((_, i) => Array.from({ length: 12 }, (__, n) => { // a smooth curve (Catmull-Rom) through the waypoints, as fine steps
      const [p0, p1, p2, p3] = [way[Math.max(0, i - 1)], way[i], way[i + 1], way[Math.min(way.length - 1, i + 2)]], u = n / 12;
      return [0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * u * u * u));
    })).concat([way[way.length - 1]]);
    const reach = route.map((point, i) => i && Math.hypot(point[0] - route[i - 1][0], point[1] - route[i - 1][1])).reduce((sum, d, i) => (sum.push((sum[i - 1] || 0) + d), sum), []); // distance along the route at each waypoint
    const parts = [...svg.querySelectorAll('.quad')].map((el) => {
      const from = el.getAttribute('d').match(num).map(Number), to = el.dataset.to.match(num).map(Number), shape = el.getAttribute('d').split(num);
      const [g0, g1] = el.dataset.g.split(',').map(Number), delay = Number(el.dataset.row) * 0.035;
      return (progress) => {
        const e = ease(Math.min(1, Math.max(0, (progress - delay) / (RISE - 0.245))));
        el.setAttribute('d', shape.reduce((d, piece, i) => d + piece + (i < from.length ? (from[i] + (to[i] - from[i]) * e).toFixed(2) : ''), ''));
        const g = Math.round(g0 + (g1 - g0) * e);
        el.style.fill = 'rgb(' + g + ',' + g + ',' + g + ')';
      };
    });
    parts.push((progress) => {
      const t = Math.min(1, Math.max(0, (progress - RISE) / (1 - RISE))), along = (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)) * reach[reach.length - 1];
      const i = Math.min(route.length - 2, reach.findIndex((d) => d > along) - 1 < 0 ? route.length - 2 : reach.findIndex((d) => d > along) - 1), f = (along - reach[i]) / (reach[i + 1] - reach[i]);
      marker.setAttribute('cx', route[i][0] + (route[i + 1][0] - route[i][0]) * f);
      marker.setAttribute('cy', route[i][1] + (route[i + 1][1] - route[i][1]) * f);
      marker.style.opacity = Math.min(1, t * 8);
      ring.style.opacity = Math.max(0, (t - 0.85) / 0.15);
      ring.setAttribute('r', 2 + 3 * Math.max(0, (t - 0.85) / 0.15));
    });
    let progress = 0, target = 0, last = 0, frame = 0;
    const step = (now) => {
      progress += Math.sign(target - progress) * Math.min(Math.abs(target - progress), (now - last) / 3200);
      last = now;
      parts.forEach((set) => set(progress));
      frame = progress === target ? 0 : requestAnimationFrame(step);
    };
    const go = (to) => { target = to; if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } };
    card.addEventListener('mouseenter', () => go(1));
    card.addEventListener('mouseleave', () => go(0));
  });

  /* 7. On the home page the logo link would reload the whole page (the video restarts and the hero cuts in again),
        so there it just glides back to the top instead. From other pages it is a normal link and cross-fades. */
  const brand = document.querySelector('.brand');
  if (brand && document.querySelector('.hero')) brand.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;   // new tab and friends keep working
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });
})();
