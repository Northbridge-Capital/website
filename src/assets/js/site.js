/* Shared script for every page. Small, independent parts inside one wrapper that holds the shared helpers. */
(() => {
  const setInert = (el, on) => el.toggleAttribute('inert', on);

  // With a mouse, moving off a card closes it again. Touch has no hover (it stays tap to open, tap to close),
  // and a keyboard user who is still inside the card is left alone.
  const closeOnMouseLeave = (el, close) => el.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    if (el.contains(document.activeElement) && document.activeElement.matches(':focus-visible')) return;
    close();
  });

  /* Videos load and play only when needed. The hero starts straight away; a video with a data-src waits until play() is called.
     Visitors who prefer less motion get the still poster frames and nothing plays. */
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const play = (video) => {
    if (calm) return;
    if (video.dataset.src) { video.src = video.dataset.src; delete video.dataset.src; }
    video.play().catch(() => {});
  };
  if (calm) document.querySelectorAll('video').forEach((video) => { video.removeAttribute('autoplay'); video.removeAttribute('src'); video.load(); }); // drops the download, the poster stays

  /* Things rise into place the first time they scroll into view.
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

  /* The hero video fades in over its still first frame once it is really playing. */
  document.querySelectorAll('.hero-video').forEach((video) => {
    const show = () => video.classList.add('is-playing');
    if (!video.paused && video.readyState > 2) show(); else video.addEventListener('playing', show, { once: true });
  });

  /* Each section's content drifts up into place as the section scrolls in. This is timed (not tied to the scroll wheel),
         so it stays smooth however you scroll. It starts as soon as the top of the section is a little way into view. */
  const drift = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('arrived');
      drift.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('main > .band:not(#what), .s-foot').forEach((el) => drift.observe(el));   // the section, not its padded content, so it starts as the edge appears

  /* The hero videos (home and page headers) and every lazy video (the case cards, "Who we are" and the feature videos) play only while they are on screen,
        so the phone or laptop never decodes video nobody can see. Lazy videos start loading a little before they scroll into view. */
  document.querySelectorAll('.hero-video, .lazy-video').forEach((video) => {
    const margin = video.matches('.lazy-video') ? '200px' : '0px';
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? play(video) : video.pause()), { rootMargin: margin }).observe(video);
  });

  /* Contact form: check the fields, send to Formspree without leaving the page, show the result. */
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

  /* Cards: the "What we do" cards flip over (their video plays only while the back is showing),
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
    closeOnMouseLeave(card, () => set(false));
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
    closeOnMouseLeave(person, () => set(false));
  });

  /* The volatility-surface icon on the risk card is a flat grid that rises into its hills while the card is hovered, from the front
        to the back. Un-hovering lowers it again. Each mesh cell has its flat shape in d and its risen shape in data-to (same number of
        points), and its flat and risen shade in data-g. The morph is done here, not in CSS, because Safari cannot animate the CSS
        `d` property. Only for a mouse: on a touch screen a tap would raise it and nothing would lower it, and the card is flipped away anyway. */
  if (!calm && matchMedia('(hover: hover)').matches) document.querySelectorAll('.offer').forEach((card) => {
    const svg = card.querySelector('.ic-vol');
    if (!svg) return;
    const num = /-?\d*\.?\d+/g, STAGGER = 0.035, ease = (x) => 1 - Math.pow(1 - x, 3);
    const quads = [...svg.querySelectorAll('.quad')];
    const rise = 1 - STAGGER * Math.max(...quads.map((el) => Number(el.dataset.row)));   // the share of the timeline each cell takes to rise: the back row starts last and still ends at 1
    const parts = quads.map((el) => {
      const from = el.getAttribute('d').match(num).map(Number), to = el.dataset.to.match(num).map(Number), shape = el.getAttribute('d').split(num);
      const [g0, g1] = el.dataset.g.split(',').map(Number), delay = Number(el.dataset.row) * STAGGER;
      return (progress) => {
        const e = ease(Math.min(1, Math.max(0, (progress - delay) / rise)));
        el.setAttribute('d', shape.reduce((d, piece, i) => d + piece + (i < from.length ? (from[i] + (to[i] - from[i]) * e).toFixed(2) : ''), ''));
        const g = Math.round(g0 + (g1 - g0) * e);
        el.style.fill = 'rgb(' + g + ',' + g + ',' + g + ')';
      };
    });
    let progress = 0, target = 0, last = 0, frame = 0;
    const step = (now) => {
      progress += Math.sign(target - progress) * Math.min(Math.abs(target - progress), (now - last) / 800);
      last = now;
      parts.forEach((set) => set(progress));
      frame = progress === target ? 0 : requestAnimationFrame(step);
    };
    const go = (to) => { target = to; if (!frame) { last = performance.now(); frame = requestAnimationFrame(step); } };
    card.addEventListener('mouseenter', () => go(1));
    card.addEventListener('mouseleave', () => go(0));
  });

  /* On the home page the logo link would reload the whole page (the video restarts and the hero cuts in again),
        so there it just glides back to the top instead. From other pages it is a normal link and cross-fades. */
  const brand = document.querySelector('.brand');
  if (brand && document.querySelector('.hero')) brand.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;   // new tab and friends keep working
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  });

  /* A heading marked data-type types itself out once it has scrolled well into view (it must be in the upper three quarters of the screen),
        ahead of a cursor that blinks while it waits and stays solid while typing. The rhythm is uneven like a person typing: a random
        gap between keys, a longer one after each space, now and then a short hesitation. The full text stays in place, hidden, so the
        layout never shifts, and a screen reader reads the heading as usual. */
  if (!calm) document.querySelectorAll('[data-type]').forEach((heading) => {
    const text = heading.textContent.trim();
    const part = (name) => Object.assign(document.createElement('span'), { className: name, ariaHidden: 'true' });
    const typed = part('typed'), cursor = part('cur'), rest = part('rest');
    rest.textContent = text;
    heading.setAttribute('aria-label', text);
    heading.replaceChildren(typed, cursor, rest);
    const type = (n) => {
      typed.textContent = text.slice(0, n);
      rest.textContent = text.slice(n);
      if (n < text.length) setTimeout(type, 45 + Math.random() * 55 + (text[n - 1] === ' ' ? 60 : 0) + (Math.random() < 0.1 ? 110 : 0), n + 1);
      else cursor.classList.remove('busy');
    };
    new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      cursor.classList.add('busy');
      setTimeout(type, 250, 1);
    }, { rootMargin: '0px 0px -25% 0px', threshold: 1 }).observe(heading);
  });
})();
