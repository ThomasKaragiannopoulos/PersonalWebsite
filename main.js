const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// matrix-style decode: letters cycle through random glyphs, then lock in left to right
// Latin + digits + Japanese katakana/hiragana + Korean hangul + Chinese characters
const GLYPHS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>" +
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモラリルレロワン" +
  "あいうえおかきくけこさしすせそ" +
  "가나다라마바사아자차카타파하거너더러머버서어저처" +
  "日月火水木金土人口山川田中大小上下本手力天気電光愛夢龍"];
const LATIN = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"];
// decode length: same on every page
const PACE = 0.5;
// original text of every node we touch, so overlapping runs never lock in scrambled glyphs
const FINAL = new WeakMap();
const textNodes = (el) => {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
  return nodes;
};
// out = true dissolves real text into glyphs instead of resolving glyphs into text
const run = (el, { delay = 0, pace = PACE, out = false, glyphs = GLYPHS, onDone } = {}) => {
  if (reduce) return;
  const id = (el._scr = (el._scr || 0) + 1);
  const nodes = textNodes(el);
  const finals = nodes.map((n) => {
    if (!FINAL.has(n)) FINAL.set(n, n.nodeValue);
    return FINAL.get(n);
  });
  const total = finals.reduce((sum, t) => sum + t.length, 0);
  const step = Math.min(70, 1800 / Math.max(total, 1)) * pace;
  let k = 0, maxLock = 0;
  const locks = finals.map((t) => [...t].map(() => {
    const at = delay + k++ * step + Math.random() * 500 * pace;
    maxLock = Math.max(maxLock, at);
    return at;
  }));
  const render = (t) => {
    let done = true;
    nodes.forEach((n, i) => {
      n.nodeValue = [...finals[i]].map((c, j) => {
        if (!/[\p{L}\p{N}]/u.test(c)) return c;
        const passed = t >= locks[i][j];
        if (out ? !passed : passed) return c;
        done = false;
        return glyphs[(Math.random() * glyphs.length) | 0];
      }).join("");
    });
    return out ? t > maxLock + 400 : done;
  };
  render(0);
  const t0 = performance.now();
  let last = 0;
  const frame = (now) => {
    if (el._scr !== id) return; // a newer run on this element took over
    if (now - last >= 45) {
      last = now;
      if (render(now - t0)) return onDone && onDone();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
};

// paragraphs: hold every word at its final width while decoding, so wide glyphs can't re-wrap lines
const freezeWords = (el) => {
  const spans = [];
  textNodes(el).forEach((n) => {
    const frag = document.createDocumentFragment();
    n.nodeValue.split(/(\s+|(?<=-))/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.append(part);
      const sw = document.createElement("span");
      sw.className = "sw";
      sw.textContent = part;
      frag.append(sw);
      spans.push(sw);
    });
    n.replaceWith(frag);
  });
  spans.map((sw) => sw.getBoundingClientRect().width).forEach((wd, i) => (spans[i].style.width = wd + "px"));
  return () => {
    spans.forEach((sw) => sw.replaceWith(sw.textContent));
    el.normalize();
  };
};
const scramble = (el, opts = {}) => {
  if (reduce) return;
  if (!opts.fixed) return run(el, opts);
  document.fonts.ready.then(() => run(el, { ...opts, onDone: freezeWords(el) }));
};

// decode elements as they scroll into view
const onView = (selector, opts) => {
  const els = document.querySelectorAll(selector);
  if (reduce || !els.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) {
      io.unobserve(e.target);
      scramble(e.target, opts);
    }
  }), { threshold: 0.2 });
  els.forEach((el) => io.observe(el));
};

// clock
const clock = document.querySelector(".clock");
if (clock) {
  const tick = () => {
    clock.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Athens" }).format(new Date());
  };
  tick();
  setInterval(tick, 10000);
}

// home: size the headline so ENGINEERED spans the width, then shrink until the hero fits one screen
const headline = document.querySelector(".headline");
if (headline) {
  const hero = document.querySelector(".hero");
  const full = headline.querySelector(".giant__line--full");
  headline.style.visibility = "hidden";
  const fit = () => {
    headline.style.fontSize = "100px";
    let size = (100 * headline.clientWidth) / full.scrollWidth;
    headline.style.fontSize = size + "px";
    while (hero.scrollHeight > hero.clientHeight && size > 24) {
      size *= 0.95;
      headline.style.fontSize = size + "px";
    }
    headline.style.visibility = "visible";
  };
  document.fonts.load("900 100px Archivo").then(() => {
    fit();
    headline.querySelectorAll(".giant__line").forEach((l, n) => scramble(l, { delay: n * 150 }));
    document.querySelectorAll(".hero__intro .mono, .readout dd, .rotator").forEach((el, n) => scramble(el, { delay: 200 + n * 80 }));
    scramble(document.querySelector(".hero__lead"), { delay: 250, fixed: true });
  });
  addEventListener("load", fit);
  addEventListener("resize", fit);

  // live latency: real round trip from this browser to the server, re-measured every 4s
  const latency = document.querySelector(".latency");
  const ping = async () => {
    if (document.hidden) return;
    const t = performance.now();
    try {
      await fetch(location.href, { method: "HEAD", cache: "no-store" });
      latency.textContent = Math.round(performance.now() - t) + "ms";
    } catch {
      latency.textContent = "offline";
    }
  };
  ping();
  setInterval(ping, 4000);

  // rotating service word
  const word = document.querySelector(".rotator__word");
  const words = ["AI Assistants", "Smart Automation", "Personalised Experiences", "Intelligent Search", "Voice Assistants", "Recommendation Systems"];
  let i = 0;
  setInterval(() => {
    i = (i + 1) % words.length;
    word.textContent = words[i];
    scramble(word);
  }, 2400);
}

// custom cursor: follows the mouse, grows over links, hides when the mouse leaves the window
const cursor = document.querySelector(".cursor");
if (cursor) {
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursor.classList.add("is-on");
  });
  document.documentElement.addEventListener("mouseleave", () => cursor.classList.remove("is-on"));
  document.querySelectorAll("a, button").forEach((a) => {
    a.addEventListener("pointerenter", () => cursor.classList.add("is-hover"));
    a.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
  });
}

// contact: decode its hero like home's
if (document.querySelector(".contact-hero")) {
  document.querySelectorAll(".contact-hero .readout dd").forEach((el, n) => scramble(el, { delay: n * 80 }));
  scramble(document.querySelector(".contact-hero .hero__lead"), { delay: 150, fixed: true });
}

// inner pages: decode the title on load, everything else as it scrolls in
// page titles: one line, sized from the letter count so long names fit (set before decoding)
document.querySelectorAll(".page-title").forEach((el) => el.style.setProperty("--len", el.textContent.trim().length));
document.querySelectorAll(".page-title, .crumb a").forEach((el) => scramble(el));
onView(".section-head span, .row__title, .stats b, .stats span, .next__title, .services dt, " +
  ".lane__name, .stops li, .funnel__step b, .funnel__out b, .cycle__core b, .cycle b, .trace__bar span, .ext, " +
  ".router__core b, .router__out b, .rrf__col p, .sleep__model b, .sleep__out > span");
onView(".lede, .statement .w", { fixed: true });

let lenis = null;
if (!reduce) {
  // smooth scroll
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  gsap.registerPlugin(ScrollTrigger);

  // home: buttons and panels fade in while the text decodes
  if (headline) gsap.from(".hero .reveal", { opacity: 0, duration: 0.9, ease: "power2.out", stagger: 0.06, delay: 0.3 });

  // rows
  gsap.utils.toArray(".row").forEach((row) =>
    gsap.from(row, { y: 40, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: row, start: "top 90%" } })
  );
}

// case studies: the TEE query trace steps in when it scrolls into view
const trace = document.querySelector(".flow--trace");
if (trace && !reduce && "IntersectionObserver" in window) {
  trace.classList.add("armed");
  new IntersectionObserver((entries, io) => {
    if (entries[0].isIntersecting) {
      trace.classList.add("is-in");
      io.disconnect();
    }
  }, { threshold: 0.3 }).observe(trace);
}

// nav: links re-decode on hover (Latin only, so the bar doesn't jitter)
document.querySelectorAll(".bar a").forEach((a) =>
  a.addEventListener("pointerenter", () => scramble(a, { pace: 0.35, glyphs: LATIN })));

// page transition out: visible text dissolves into glyphs and the page fades, then we navigate
const LEAVE_MS = 550;
const leaving = [];
const visible = (el) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0;
};
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (a.target === "_blank" || a.hasAttribute("download")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;                                    // mailto, LinkedIn, external
  if (url.pathname === location.pathname && url.hash) {                         // same-page anchor: glide, don't jump
    if (!lenis || !document.querySelector(url.hash)) return;
    e.preventDefault();
    history.pushState(null, "", url.hash);
    lenis.scrollTo(url.hash, { duration: 1.6, offset: -70 });
    return;
  }
  e.preventDefault();
  document.body.classList.add("is-leaving");
  document.querySelectorAll(".page-title, .giant__line, .row__title, .next__title, .section-head span, .stats b, .services dt, .hero__intro .mono, .readout dd, .rotator")
    .forEach((el) => {
      if (!visible(el)) return;
      leaving.push(el);
      scramble(el, { pace: 0.25, out: true });
    });
  if (url.hash && lenis) {
    // open the next page at the top; it glides to the section itself (a #hash in the URL makes the browser jump)
    try { sessionStorage.setItem("glide", url.hash); url.hash = ""; } catch {}
  }
  setTimeout(() => (location.href = url.href), LEAVE_MS);
});
// back/forward cache: restore the page if the browser brings it back mid-transition
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  document.body.classList.remove("is-leaving");
  leaving.splice(0).forEach((el) => {
    el._scr = (el._scr || 0) + 1;
    textNodes(el).forEach((n) => FINAL.has(n) && (n.nodeValue = FINAL.get(n)));
  });
});

// Nomos transit map: the line and the moving dot end at the last stop
const sizeStops = () => document.querySelectorAll(".stops").forEach((st) => {
  const first = st.firstElementChild, last = st.lastElementChild;
  const vertical = last.offsetTop > first.offsetTop + 4;
  st.style.setProperty("--end", (vertical ? last.offsetTop - first.offsetTop : last.offsetLeft - first.offsetLeft) + "px");
  st.style.setProperty("--axis", vertical ? "y" : "x");
});
if (document.querySelector(".stops")) {
  sizeStops();
  addEventListener("resize", sizeStops);
  document.fonts.ready.then(sizeStops);
}

// Oinoway RRF: hovering a document lights it up in every ranking
document.querySelectorAll(".flow--rrf li[data-doc]").forEach((li) => {
  const all = document.querySelectorAll(`.flow--rrf li[data-doc="${li.dataset.doc}"]`);
  li.addEventListener("pointerenter", () => all.forEach((x) => x.classList.add("is-lit")));
  li.addEventListener("pointerleave", () => all.forEach((x) => x.classList.remove("is-lit")));
});

// contact banner: speed up on hover without restarting the loop (changing duration in CSS made it jump)
const marquee = document.querySelector(".marquee");
if (marquee && !reduce) {
  const link = marquee.parentElement;
  const rate = (v) => marquee.getAnimations().forEach((a) => a.updatePlaybackRate(v));
  link.addEventListener("pointerenter", () => rate(3));
  link.addEventListener("pointerleave", () => rate(1));
}

// arriving at a section (e.g. Contact from another page): glide down once the page has faded in
let glide = null;
try { glide = sessionStorage.getItem("glide"); sessionStorage.removeItem("glide"); } catch {}
if (lenis && glide && document.querySelector(glide)) {
  setTimeout(() => {
    history.replaceState(null, "", glide);
    lenis.scrollTo(glide, { duration: 1.6, offset: -70 });
  }, 500);
}
