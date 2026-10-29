(function () {
  "use strict";
  /* ================================================================
   * Prototype flows (flows-data.js), one independent player per portal.
   * Modelled on Figma / Adobe XD prototype viewers: click the real
   * button to move on, screens push in, a missed click flashes the
   * clickable areas, and each flow has its own restart and present mode.
   * A screen is only shown once its image is loaded and decoded.
   * ================================================================ */
  var flows = window.MISE_FLOWS || [];
  var root = document.getElementById("flowsRoot");
  var index = document.getElementById("flowIndex");
  if (!root || !flows.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(hover: none)").matches;
  var verb = touch ? "Tap" : "Click";
  var PUSH_MS = 520;
  // Zoom brings the action up close: phones start zoomed in, larger screens start at fit.
  var narrow = window.matchMedia("(max-width: 700px)");
  function zoomLevel() { return narrow.matches ? 3 : 1.8; }

  var ICON = {
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    restart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v4h4"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5"/></svg>',
    hints: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="7" width="16" height="10" rx="2.5"/><path d="M12 3v2M12 19v2M3 12H1M23 12h-2"/></svg>',
    present: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'
  };

  // Load + decode once per image; resolves with the image (or null on error).
  var cache = {};
  function load(src) {
    if (!cache[src]) {
      cache[src] = new Promise(function (resolve) {
        var im = new Image();
        im.decoding = "async";
        im.onload = function () {
          (im.decode ? im.decode() : Promise.resolve()).then(function () { resolve(im); }, function () { resolve(im); });
        };
        im.onerror = function () { resolve(null); };
        im.src = src;
      });
    }
    return cache[src];
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var players = [];
  var presenting = null;

  // Flow index: one chip per flow, in story order.
  if (index) {
    flows.forEach(function (f, i) {
      var a = el("a", "flow-chip");
      a.href = "#flow-" + f.id;
      a.setAttribute("data-portal", f.portal);
      a.innerHTML = '<span class="flow-chip-n">' + pad(i + 1) + '</span><span class="flow-chip-p"></span><span class="flow-chip-t"></span>';
      a.querySelector(".flow-chip-p").textContent = f.portal;
      a.querySelector(".flow-chip-t").textContent = f.title;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        players[i].reveal(true);
      });
      index.appendChild(a);
    });
  }

  flows.forEach(function (flow, fi) { players.push(buildFlow(flow, fi)); });

  // These are built after the page's own scroll-reveal is set up, so they get their own.
  var arts = root.querySelectorAll(".flow");
  if ("IntersectionObserver" in window && !reduce) {
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); } });
    }, { threshold: 0.08 });
    arts.forEach(function (a) { rio.observe(a); });
  } else {
    arts.forEach(function (a) { a.classList.add("in"); });
  }

  // Start loading images when the section comes near, not on first paint.
  function warm() { flows.forEach(function (f) { f.screens.forEach(function (s) { load(s.src); }); }); }
  if ("IntersectionObserver" in window) {
    var wio = new IntersectionObserver(function (en) {
      if (en.some(function (e) { return e.isIntersecting; })) { warm(); wio.disconnect(); }
    }, { rootMargin: "1200px 0px" });
    wio.observe(root);
  } else { warm(); }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && presenting) { presenting.present(false); }
  });

  function buildFlow(flow, fi) {
    var screens = flow.screens || [];
    var LAST = screens.length - 1;
    var mobile = (screens[0] && screens[0].viewport) === "mobile";
    var cur = 0, busy = false, done = false, token = 0, hintsOn = true;
    var next = flows[fi + 1];

    var art = el("article", "flow reveal");
    art.id = "flow-" + flow.id;
    art.setAttribute("data-portal", flow.portal);
    art.setAttribute("aria-labelledby", "flow-t-" + flow.id);

    /* ---- Info column ---- */
    var info = el("div", "flow-info");
    info.innerHTML =
      '<div class="flow-head"><span class="flow-n">' + pad(fi + 1) + '</span><span class="flow-portal"></span></div>' +
      '<h3 class="flow-title" id="flow-t-' + flow.id + '"></h3><p class="flow-sum"></p>' +
      '<ol class="flow-steps" aria-label="Screens in this flow"></ol>' +
      '<div class="flow-end" hidden><p class="flow-end-k">' + ICON.check + '<span>Flow complete</span></p></div>';
    info.querySelector(".flow-portal").textContent = flow.portal + " portal";
    info.querySelector(".flow-title").textContent = flow.title;
    info.querySelector(".flow-sum").textContent = flow.summary || "";
    var stepsEl = info.querySelector(".flow-steps");
    var endEl = info.querySelector(".flow-end");
    var stepBtns = screens.map(function (s, k) {
      var li = el("li");
      var b = el("button", "flow-step");
      b.type = "button";
      b.innerHTML = '<span class="flow-step-n">' + (k + 1) + '</span><span class="flow-step-t"></span>';
      b.querySelector(".flow-step-t").textContent = s.title;
      b.addEventListener("click", function () { go(k); });
      li.appendChild(b);
      stepsEl.appendChild(li);
      return b;
    });
    var endBtns = el("div", "flow-end-actions");
    var nextBtn = el("a", "btn btn-primary flow-next");
    if (next) {
      nextBtn.href = "#flow-" + next.id;
      nextBtn.innerHTML = '<span></span>' + ICON.down;
      nextBtn.querySelector("span").textContent = "Next: " + next.portal + " · " + next.title;
      nextBtn.addEventListener("click", function (e) { e.preventDefault(); players[fi + 1].reveal(true); });
    } else {
      nextBtn.href = "#evidence";
      nextBtn.innerHTML = '<span>See what consistency is worth</span>' + ICON.down;
    }
    var againBtn = el("button", "btn btn-ghost flow-again");
    againBtn.type = "button";
    againBtn.innerHTML = ICON.restart + "<span>Restart flow</span>";
    againBtn.addEventListener("click", function () { restart(true); });
    endBtns.appendChild(nextBtn);
    endBtns.appendChild(againBtn);
    endEl.appendChild(endBtns);

    /* ---- Prototype viewer ---- */
    var proto = el("div", "proto" + (mobile ? " is-mobile" : " is-desktop"));
    proto.tabIndex = 0;
    proto.setAttribute("role", "region");
    proto.setAttribute("aria-roledescription", "prototype");
    proto.setAttribute("aria-label", flow.portal + " prototype: " + flow.title + ". " + verb + " the highlighted control, or use the arrow keys.");

    var bar = el("div", "proto-bar");
    bar.innerHTML =
      '<div class="proto-bar-l"><span class="proto-dot" aria-hidden="true"></span><span class="proto-name"></span></div>' +
      '<label class="proto-pick"><span class="sr-only">Go to screen</span><select></select></label>' +
      '<div class="proto-bar-r">' +
        '<button type="button" class="proto-btn" data-act="zoom" aria-pressed="false" title="Zoom in on the action">' + ICON.zoom + '<span class="sr-only">Zoom in on the action</span></button>' +
        '<button type="button" class="proto-btn" data-act="hints" aria-pressed="true" title="Show clickable areas">' + ICON.hints + '<span class="sr-only">Show clickable areas</span></button>' +
        '<button type="button" class="proto-btn" data-act="restart" title="Restart flow">' + ICON.restart + '<span class="sr-only">Restart flow</span></button>' +
        '<button type="button" class="proto-btn" data-act="prev" title="Previous screen">' + ICON.prev + '<span class="sr-only">Previous screen</span></button>' +
        '<button type="button" class="proto-btn" data-act="next" title="Next screen">' + ICON.next + '<span class="sr-only">Next screen</span></button>' +
        '<button type="button" class="proto-btn" data-act="present" title="Present">' + ICON.present + '<span class="sr-only">Present full screen</span></button>' +
      '</div>';
    bar.querySelector(".proto-name").textContent = flow.portal + " · " + flow.title;
    var pick = bar.querySelector("select");
    screens.forEach(function (s, k) {
      var o = el("option");
      o.value = k;
      o.textContent = (k + 1) + " / " + screens.length + "  ·  " + s.title;
      pick.appendChild(o);
    });
    pick.addEventListener("change", function () { go(+pick.value); });
    var btn = function (a) { return bar.querySelector('[data-act="' + a + '"]'); };

    var canvas = el("div", "proto-canvas");
    var device = el("div", "proto-device " + (mobile ? "phone" : "browser"));
    if (mobile) {
      device.innerHTML = '<div class="proto-status" aria-hidden="true"><span class="proto-time">9:41</span><span class="proto-island"></span><span class="proto-batt"><i></i><i></i><i></i><b></b></span></div>';
    } else {
      device.innerHTML = '<div class="proto-chrome" aria-hidden="true"><i></i><i></i><i></i><b><span></span></b></div>';
      device.querySelector(".proto-chrome span").textContent = "Mise · " + flow.portal + " portal";
    }
    var screen = el("div", "proto-screen");
    device.appendChild(screen);
    canvas.appendChild(device);

    var cap = el("div", "proto-cap");
    cap.innerHTML = '<p class="proto-cap-t" aria-live="polite"></p><p class="proto-hint"></p>';
    var capT = cap.querySelector(".proto-cap-t"), hintEl = cap.querySelector(".proto-hint");

    var exitBtn = el("button", "proto-exit");
    exitBtn.type = "button";
    exitBtn.innerHTML = ICON.close + '<span>Exit</span>';
    exitBtn.addEventListener("click", function () { present(false); });

    proto.appendChild(bar);
    proto.appendChild(canvas);
    proto.appendChild(cap);
    proto.appendChild(exitBtn);

    art.appendChild(info);
    art.appendChild(proto);
    root.appendChild(art);

    /* ---- Slides ---- */
    var slides = screens.map(function (s, k) {
      var slide = el("div", "proto-slide" + (k === 0 ? " is-active" : ""));
      slide.setAttribute("aria-hidden", k === 0 ? "false" : "true");
      var shot = el("div", "proto-shot");
      var img = el("img");
      img.alt = flow.portal + " portal: " + s.title + ". " + s.caption;
      img.decoding = "async";
      img.draggable = false;
      shot.appendChild(img);
      if (s.hotspot) {
        var hs = el("button", "proto-hot");
        hs.type = "button";
        hs.style.left = s.hotspot.x + "%";
        hs.style.top = s.hotspot.y + "%";
        hs.style.width = s.hotspot.w + "%";
        hs.style.height = s.hotspot.h + "%";
        hs.setAttribute("aria-label", (s.action || "Continue") + (k < LAST ? ", go to the next screen" : ", finish this flow"));
        hs.tabIndex = k === 0 ? 0 : -1;
        hs.addEventListener("click", function (e) { e.stopPropagation(); advance(); });
        shot.appendChild(hs);
      }
      slide.appendChild(shot);
      screen.appendChild(slide);
      load(s.src).then(function (im) {
        if (!im) { shot.classList.add("is-missing"); return; }
        img.src = s.src;
        img.width = im.naturalWidth; img.height = im.naturalHeight;
        shot.style.aspectRatio = im.naturalWidth + " / " + im.naturalHeight;
        shot._ar = im.naturalWidth / im.naturalHeight;
        focus();
      });
      return slide;
    });

    // The screen takes the widest image's proportions, so nothing letterboxes.
    Promise.all(screens.map(function (s) { return load(s.src); })).then(function (ims) {
      var best = null;
      ims.forEach(function (im) { if (im && (!best || im.naturalWidth / im.naturalHeight > best.naturalWidth / best.naturalHeight)) best = im; });
      if (best) proto.style.setProperty("--ar", best.naturalWidth / best.naturalHeight);
    });

    // A click that misses every hotspot flashes them, as prototype viewers do.
    screen.addEventListener("click", function (e) {
      if (e.target.closest(".proto-hot")) return;
      flash();
    });

    /* ---- Behaviour ---- */
    // Zoomed in, each screen is scaled around its action and kept inside the frame.
    function focus() {
      var on = proto.classList.contains("is-zoomed");
      var sw = screen.clientWidth, sh = screen.clientHeight, z = zoomLevel();
      slides.forEach(function (sl, k) {
        var shot = sl.firstChild, h = screens[k].hotspot;
        if (!on || !h || !sw || !sh) {
          shot.style.removeProperty("--z"); shot.style.removeProperty("--tx"); shot.style.removeProperty("--ty");
          return;
        }
        var r = sh / (sw / (shot._ar || sw / sh));   // frame height in shot heights
        var fx = (h.x + Math.min(h.w, 80 / z) / 2) / 100;
        var fy = (h.y + Math.min(h.h, 80 * r / z) / 2) / 100;
        var tx = Math.min(0, Math.max(1 - z, 0.5 - z * fx));
        var ty = Math.min(0, Math.max(r - z, 0.5 * r - z * fy));
        shot.style.setProperty("--z", z);
        shot.style.setProperty("--tx", (tx * 100).toFixed(2) + "%");
        shot.style.setProperty("--ty", (ty * 100).toFixed(2) + "%");
      });
    }

    function setZoom(on) {
      proto.classList.toggle("is-zoomed", on);
      btn("zoom").setAttribute("aria-pressed", String(on));
      btn("zoom").setAttribute("title", on ? "Fit the whole screen" : "Zoom in on the action");
      focus();
    }

    function flash() {
      proto.classList.remove("is-flash");
      void proto.offsetWidth;
      proto.classList.add("is-flash");
      clearTimeout(proto._flash);
      proto._flash = setTimeout(function () { proto.classList.remove("is-flash"); }, 900);
    }

    function render() {
      var s = screens[cur];
      capT.innerHTML = '<b></b><span class="proto-step"></span> <span class="proto-cap-c"></span>';
      capT.querySelector("b").textContent = s.title;
      capT.querySelector(".proto-step").textContent = "Screen " + (cur + 1) + " of " + screens.length;
      capT.querySelector(".proto-cap-c").textContent = s.caption;
      if (done) {
        hintEl.innerHTML = "";
        var go2 = el("a", "proto-next");
        go2.href = next ? "#flow-" + next.id : "#evidence";
        go2.innerHTML = ICON.check + "<span></span>" + ICON.down;
        go2.querySelector("span").textContent = next ? "Done. Next: " + next.portal + " · " + next.title : "Done. See what it’s worth";
        if (next) go2.addEventListener("click", function (e) { e.preventDefault(); players[fi + 1].reveal(true); });
        hintEl.appendChild(go2);
        hintEl.classList.add("is-next");
      } else {
        hintEl.classList.remove("is-next");
        hintEl.innerHTML = '<span class="proto-hint-k">' + verb + '</span> <span class="proto-hint-a"></span>' +
          (cur < LAST ? " to continue" : " to finish this flow");
        hintEl.querySelector(".proto-hint-a").textContent = s.action || "the highlighted area";
      }
      pick.value = cur;
      btn("prev").disabled = cur === 0;
      btn("next").disabled = cur === LAST && done;
      stepBtns.forEach(function (b, k) {
        b.classList.toggle("is-current", k === cur);
        b.classList.toggle("is-done", k < cur || (done && k === LAST));
        if (k === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
      });
      // On small screens the step list scrolls sideways; keep the current step in view.
      if (stepsEl.scrollWidth > stepsEl.clientWidth) {
        var dx = stepBtns[cur].getBoundingClientRect().left - stepsEl.getBoundingClientRect().left;
        stepsEl.scrollTo({ left: stepsEl.scrollLeft + dx - 16, behavior: reduce ? "auto" : "smooth" });
      }
      slides.forEach(function (sl, k) {
        var h = sl.querySelector(".proto-hot");
        if (h) h.tabIndex = k === cur ? 0 : -1;
      });
    }

    function go(k, opts) {
      opts = opts || {};
      if (k < 0 || k > LAST || k === cur || busy) return;
      var my = ++token;
      var dir = k > cur ? 1 : -1;
      proto.classList.add("is-loading");
      load(screens[k].src).then(function () {
        if (my !== token) return;
        proto.classList.remove("is-loading");
        var from = slides[cur], to = slides[k];
        cur = k;
        if (done && k < LAST) setDone(false);
        render();
        if (reduce) {
          from.className = "proto-slide";
          to.className = "proto-slide is-active";
        } else {
          busy = true;
          to.className = "proto-slide " + (dir > 0 ? "enter-r" : "enter-l");
          void to.offsetWidth;
          to.className = "proto-slide is-active";
          from.className = "proto-slide " + (dir > 0 ? "leave-l" : "leave-r");
          setTimeout(function () {
            from.className = "proto-slide";
            busy = false;
          }, PUSH_MS);
        }
        from.setAttribute("aria-hidden", "true");
        to.setAttribute("aria-hidden", "false");
        if (opts.focusHot) {
          var h = to.querySelector(".proto-hot");
          if (h) h.focus({ preventScroll: true });
        }
      });
    }

    function setDone(v) {
      done = v;
      art.classList.toggle("is-done", v);
      endEl.hidden = !v;
      if (index && index.children[fi]) index.children[fi].classList.toggle("is-done", v);
    }

    function advance(fromKey) {
      if (busy) return;
      if (cur < LAST) { go(cur + 1, { focusHot: fromKey }); return; }
      if (!done) {
        setDone(true);
        render();
        proto.classList.remove("is-finished");
        void proto.offsetWidth;
        proto.classList.add("is-finished");
      }
    }

    function restart(focus) {
      if (busy) return;
      setDone(false);
      if (cur !== 0) go(0); else render();
      if (focus) proto.focus({ preventScroll: true });
    }

    function present(on) {
      if (on === proto.classList.contains("is-presenting")) return;
      if (on && presenting) presenting.present(false);
      proto.classList.toggle("is-presenting", on);
      document.documentElement.classList.toggle("proto-open", on);
      presenting = on ? api : null;
      btn("present").setAttribute("title", on ? "Exit presentation" : "Present");
      focus();
      if (on) exitBtn.focus({ preventScroll: true }); else proto.focus({ preventScroll: true });
    }

    btn("prev").addEventListener("click", function () { go(cur - 1); });
    btn("next").addEventListener("click", function () { advance(); });
    btn("restart").addEventListener("click", function () { restart(false); });
    btn("present").addEventListener("click", function () { present(!proto.classList.contains("is-presenting")); });
    btn("zoom").addEventListener("click", function () { setZoom(!proto.classList.contains("is-zoomed")); });
    var raf = 0;
    window.addEventListener("resize", function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(focus); });
    btn("hints").addEventListener("click", function () {
      hintsOn = !hintsOn;
      proto.classList.toggle("hints-off", !hintsOn);
      btn("hints").setAttribute("aria-pressed", String(hintsOn));
      if (!hintsOn) flash();
    });

    proto.addEventListener("keydown", function (e) {
      if (e.target.tagName === "SELECT") return;
      var k = e.key;
      if (k === "ArrowRight") { e.preventDefault(); advance(true); }
      else if (k === "ArrowLeft") { e.preventDefault(); go(cur - 1, { focusHot: true }); }
      else if (k === "Home" || k === "r" || k === "R") { e.preventDefault(); restart(false); }
      else if (k === "f" || k === "F") { e.preventDefault(); present(!proto.classList.contains("is-presenting")); }
      else if ((k === "Enter" || k === " ") && e.target === proto) { e.preventDefault(); advance(true); }
    });

    // Swipe on touch screens: left = continue, right = back.
    var sx = null, sy = null;
    screen.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    screen.addEventListener("touchend", function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0) advance(); else go(cur - 1); }
    });

    function reveal(focus) {
      // offsetTop ignores the fade-in transform, so the flow lands exactly under the site bar.
      var y = 0;
      for (var n = art; n; n = n.offsetParent) y += n.offsetTop;
      y -= (document.querySelector(".top") || { offsetHeight: 0 }).offsetHeight + 16;
      window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
      if (focus) proto.focus({ preventScroll: true });
    }

    render();
    setZoom(narrow.matches);
    var api = { present: present, reveal: reveal };
    return api;
  }
})();
