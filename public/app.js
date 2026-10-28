(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touchFirst = window.matchMedia("(hover: none)").matches;
  var data = window.MISE_JOURNEY || [];
  var $ = function (id) { return document.getElementById(id); };
  var header = document.querySelector(".top");
  var contactHref = window.MISE_CONTACT_HREF || "mailto:hello@misehotel.com";

  // Hero headline: split into words for a staggered entrance
  document.querySelectorAll(".split").forEach(function (el) {
    var html = el.innerHTML.split(/(<em>.*?<\/em>|\s+)/).filter(Boolean).map(function (part, i) {
      if (/^\s+$/.test(part)) return " ";
      return '<span class="w" style="animation-delay:' + (0.1 + i * 0.06) + 's">' + part + "</span>";
    });
    el.innerHTML = html.join("");
  });

  function placeholder(text) {
    var d = document.createElement("div");
    d.className = "placeholder";
    d.innerHTML = "<div><strong>Coming soon</strong><span></span></div>";
    d.querySelector("span").textContent = text;
    return d;
  }

  function headerHeight() { return header ? header.getBoundingClientRect().height : 0; }
  // Layout position, ignoring transforms (scroll-reveal offsets would otherwise skew it).
  function pageTop(el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
  function focusQuietly(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }
  function swap(el) {
    if (!el) return;
    el.classList.remove("swap");
    void el.offsetWidth;
    el.classList.add("swap");
  }

  /* ================================================================
   * Product tour
   * Manifest-driven (journey-data.js). Every frame is built once and
   * stacked in a single grid cell, so the stage keeps one height for
   * every step: nothing below it jumps, and the controls stay put.
   * A step is only shown once its screenshot is loaded and decoded.
   * ================================================================ */
  var tour = initTour();

  function initTour() {
    var stage = $("journeyStage"), wrap = $("frameWrap");
    var noop = { play: function () {}, focus: function () {} };
    if (!stage || !wrap || !data.length) return noop;

    var visual = stage.querySelector(".stage-visual") || wrap;
    var side = stage.querySelector(".stage-side");
    var roleEl = $("jRole"), dotsEl = $("jDots"), prev = $("jPrev"), next = $("jNext"),
        playBtn = $("jPlay"), rail = $("roleRail");
    var LAST = data.length - 1, CIRC = 2 * Math.PI * 52, ZOOM_AFTER = 1100;
    var roleNotes = window.MISE_ROLES || {};

    // Chapters: consecutive steps that share a role (Author → Staff → Manager).
    var chapters = [], chapterOf = [];
    data.forEach(function (it, i) {
      var c = chapters[chapters.length - 1];
      if (!c || c.role !== it.role) { c = { role: it.role, start: i, end: i }; chapters.push(c); }
      c.end = i;
      chapterOf[i] = chapters.length - 1;
    });
    var roleCount = chapters.map(function (c) { return c.role; })
      .filter(function (r, k, a) { return a.indexOf(r) === k; }).length;

    // Pacing: long enough to take in the step, short enough to keep moving.
    function words(s) { return String(s || "").split(/\s+/).filter(Boolean).length; }
    var durations = data.map(function (it) {
      if (it.duration) return it.duration;
      var w = words(it.title) + words(it.caption) + words((it.points || []).join(" "));
      return Math.max(7000, Math.min(10000, 3200 + w * 150));
    });

    var index = -1, target = -1, token = 0;
    var playing = !reduce, ended = false, inView = false;
    var elapsed = 0, seen = 0, zoomed = false;
    var holdUntil = 0, touchHold = false, quiet = false;

    /* ---------- Frames ---------- */
    function buildFrame(item, i) {
      var frame = document.createElement("div");
      frame.className = "frame leave";
      frame.setAttribute("role", "group");
      frame.setAttribute("aria-roledescription", "slide");
      frame.setAttribute("aria-label", (i + 1) + " of " + data.length + ": " + (item.title || item.role));

      var shot = document.createElement("div");
      shot.className = "shot";
      if (item.viewport === "mobile") {
        frame.className += " phone";
        var screen = document.createElement("div");
        screen.className = "screen";
        screen.innerHTML = '<span class="notch" aria-hidden="true"></span>';
        screen.appendChild(shot);
        frame.appendChild(screen);
      } else {
        frame.className += " browser";
        frame.innerHTML = '<div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><b></b></div>';
        frame.appendChild(shot);
      }

      if (!item.src) {
        shot.appendChild(placeholder(item.role + " screen on the way."));
        frame._ready = Promise.resolve();
        return frame;
      }

      // Camera: the screenshot zooms toward the action; the hotspot point stays fixed.
      // The plane carries the image and its markers; on small screens it is
      // positioned so the shot window is framed around the hotspot.
      var plane = document.createElement("div");
      plane.className = "plane";
      var cam = document.createElement("div");
      cam.className = "cam";
      var img = document.createElement("img");
      img.alt = item.role + " view: " + item.caption;
      img.decoding = "async";
      if (i > 0 && "fetchPriority" in img) img.fetchPriority = "low";
      cam.appendChild(img);
      plane.appendChild(cam);
      shot.appendChild(plane);
      frame._shot = shot; frame._plane = plane; frame._img = img;
      // Preload + decode before the step is ever shown, so a frame is never empty.
      frame._ready = new Promise(function (resolve) {
        img.onload = function () {
          (img.decode ? img.decode() : Promise.resolve()).then(resolve, resolve);
        };
        img.onerror = function () {
          shot.innerHTML = "";
          shot.appendChild(placeholder("Screenshot pending."));
          frame._plane = frame._img = frame._tip = null;
          resolve();
        };
      });
      img.src = item.src;

      if (item.hotspot) {
        var x = item.hotspot.x, y = item.hotspot.y;
        cam.style.transformOrigin = x + "% " + y + "%";

        var ring = document.createElement("div");
        ring.className = "focus-ring";
        ring.style.left = x + "%"; ring.style.top = y + "%";
        plane.appendChild(ring);

        var hs = document.createElement("button");
        hs.className = "hotspot";
        hs.type = "button";
        hs.innerHTML = "<span></span>";
        hs.style.left = x + "%"; hs.style.top = y + "%";
        hs.setAttribute("aria-label", (item.callout || "Next step") + (i < LAST ? ". Go to the next step" : ". Finish the tour"));
        hs.addEventListener("click", function (e) { advance(e.detail === 0); });
        plane.appendChild(hs);

        if (item.callout) {
          var tip = document.createElement("div");
          tip.className = "callout " + (x > 55 ? "to-left" : "to-right") + " " + (y > 45 ? "up" : "down");
          tip.style.left = x + "%"; tip.style.top = y + "%";
          tip.setAttribute("aria-hidden", "true");
          tip.innerHTML = "<i></i><span></span><b>→</b>";
          tip.querySelector("span").textContent = item.callout;
          plane.appendChild(tip);
          frame._tip = tip;
        }
      }
      return frame;
    }

    // Small screens: show a window of the screenshot centred on the hotspot
    // (about twice as legible, and every frame ends up close to the same height).
    var framedMQ = window.matchMedia("(max-width: 700px)");
    function layoutFrame(i) {
      var f = frames[i], plane = f._plane, img = f._img, item = data[i];
      if (!plane) return;
      if (!framedMQ.matches || !img || !img.naturalWidth) { plane.removeAttribute("style"); return; }
      var shot = f._shot, padT = parseFloat(getComputedStyle(shot).paddingTop) || 0;
      var W = shot.clientWidth, H = shot.clientHeight - padT, r = img.naturalHeight / img.naturalWidth;
      if (!W || !H) return;
      var pw = W, ph = W * r;
      if (ph < H) { ph = H; pw = H / r; }
      var hx = item.hotspot ? item.hotspot.x / 100 : 0.5, hy = item.hotspot ? item.hotspot.y / 100 : 0.5;
      var left = Math.min(0, Math.max(W - pw, W / 2 - hx * pw));
      var top = Math.min(0, Math.max(H - ph, H / 2 - hy * ph));
      plane.style.cssText = "position:absolute;left:" + left.toFixed(1) + "px;top:" + (padT + top).toFixed(1) +
        "px;width:" + pw.toFixed(1) + "px;height:" + ph.toFixed(1) + "px" +
        // keep the phone's status-bar strip clear: nothing scrolls up under the notch
        (padT && top < 0 ? ";clip-path:inset(" + (-top).toFixed(1) + "px 0 0 0)" : "");
    }
    // Keep the callout inside the screenshot: try its preferred side, then the other, then centred.
    function fitCallout(i) {
      var f = frames[i], tip = f._tip, it = data[i];
      if (!tip || !it.hotspot || f.classList.contains("leave")) return;
      var x = it.hotspot.x, y = it.hotspot.y, box = f._shot.getBoundingClientRect(), pick = null;
      var hs = x > 55 ? ["to-left", "to-right", "mid"] : ["to-right", "to-left", "mid"];
      var vs = y > 45 ? ["up", "down"] : ["down", "up"];
      tip.style.transition = "none";
      for (var a = 0; a < hs.length && !pick; a++) {
        for (var b = 0; b < vs.length && !pick; b++) {
          tip.className = "callout " + hs[a] + " " + vs[b];
          var r = tip.getBoundingClientRect();
          if (r.left >= box.left + 4 && r.right <= box.right - 4 && r.top >= box.top + 4 && r.bottom <= box.bottom - 4) pick = tip.className;
        }
      }
      tip.className = pick || "callout " + hs[0] + " " + vs[0];
      void tip.offsetWidth;
      tip.style.transition = "";
    }

    var frames = data.map(buildFrame);
    frames.forEach(function (f) { wrap.appendChild(f); });

    function enter(f, dir) {
      clearTimeout(f._t);
      f.style.transition = "none";
      f.classList.remove("zoomed", "leave");
      f.classList.add("enter-" + dir, "is-current");
      void f.offsetWidth;
      f.style.transition = "";
      requestAnimationFrame(function () { f.classList.remove("enter-" + dir); });
    }
    function leave(f) {
      f.classList.remove("is-current");
      f.classList.add("leave");
      clearTimeout(f._t);
      f._t = setTimeout(function () { f.classList.remove("zoomed"); }, 800);
    }

    /* ---------- Side panel: step text, "up next", end of tour ---------- */
    if (side) side.setAttribute("aria-live", "off"); // announcements go through `live` instead
    var live = document.createElement("p");
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    stage.appendChild(live);

    var nextCard = document.createElement("button");
    nextCard.type = "button";
    nextCard.className = "tour-next";
    nextCard.innerHTML = '<span class="tour-next-k"></span><span class="tour-next-t"></span><span class="tour-next-go" aria-hidden="true">→</span>';

    var endCard = document.createElement("div");
    endCard.className = "tour-end";
    endCard.hidden = true;
    endCard.setAttribute("role", "group");
    endCard.setAttribute("aria-label", "End of tour");
    endCard.innerHTML =
      '<p class="tour-end-t"><span class="tour-end-k">End of tour</span> One standard, from paper to proof.</p>' +
      '<div class="tour-end-actions">' +
        '<a class="btn btn-primary" href="#evidence">See the evidence <span aria-hidden="true">↓</span></a>' +
        '<a class="btn btn-ghost" href="">Talk to us</a>' +
        '<button type="button" class="tour-replay" aria-label="Replay the tour from the start"><span aria-hidden="true">↺</span> Replay</button>' +
      "</div>";
    endCard.querySelector(".btn-ghost").href = contactHref;
    var endPrimary = endCard.querySelector("a");
    // Pinned to the bottom of the (fixed-height) panel, so it never moves between steps.
    var foot = document.createElement("div");
    foot.className = "tour-foot";
    foot.appendChild(nextCard);
    foot.appendChild(endCard);
    if (side) side.appendChild(foot);

    function panelRefs(root) {
      var q = function (sel) { return root.querySelector(sel); };
      return { role: q("#jRole"), num: q("#jNum"), total: q("#jTotal"), title: q("#jTitle"), cap: q("#jCaption"),
               tiles: q("#jTiles"), ring: q("#ringFg"), next: q(".tour-next"), end: q(".tour-end") };
    }
    function fillPanel(r, i) {
      var it = data[i];
      if (r.role) { r.role.textContent = it.role; r.role.setAttribute("data-role", it.role); }
      if (r.num) r.num.textContent = i + 1;
      if (r.total) r.total.textContent = "/ " + data.length;
      if (r.title) r.title.textContent = it.title || "";
      if (r.cap) r.cap.textContent = it.caption || "";
      if (r.ring) r.ring.style.strokeDashoffset = CIRC * (1 - (i + 1) / data.length);
      if (r.tiles) {
        r.tiles.innerHTML = "";
        (it.points || []).forEach(function (p, k) {
          var li = document.createElement("li");
          li.style.animationDelay = (0.25 + k * 0.12) + "s";
          li.innerHTML = '<i aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8.5l3 3 7-7"/></svg></i>';
          li.appendChild(document.createTextNode(p));
          r.tiles.appendChild(li);
        });
      }
      if (r.next && r.end) {
        var atEnd = i === LAST;
        r.next.hidden = atEnd;
        r.end.hidden = !atEnd;
        if (!atEnd) {
          var n = data[i + 1], newChapter = chapterOf[i + 1] !== chapterOf[i], label = n.title || n.short || "";
          r.next.querySelector(".tour-next-k").textContent = newChapter ? "Next chapter · " + n.role : "Up next";
          r.next.querySelector(".tour-next-t").textContent = label;
          r.next.setAttribute("aria-label", (newChapter ? "Next chapter, " + n.role + ": " : "Next step: ") + label);
        }
      }
    }
    var panel = side ? panelRefs(side) : panelRefs(stage);

    // Reserve the tallest step's text height so the stage never changes size.
    function lockSide() {
      if (!side) return;
      var clone = side.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;min-height:0;height:auto;width:" +
        side.getBoundingClientRect().width + "px";
      stage.appendChild(clone);
      var r = panelRefs(clone), max = 0;
      for (var i = 0; i < data.length; i++) { fillPanel(r, i); max = Math.max(max, clone.offsetHeight); }
      stage.removeChild(clone);
      side.style.minHeight = Math.ceil(max) + "px";
    }

    /* ---------- Orientation: what to expect, chapters, timeline ---------- */
    var titleEl = $("journey-title");
    if (titleEl) {
      var total = durations.reduce(function (a, b) { return a + b; }, 0);
      var meta = document.createElement("p");
      meta.className = "tour-meta";
      meta.id = "jMeta";
      meta.textContent = data.length + " steps · " + roleCount + (roleCount === 1 ? " role" : " roles") + " · " +
        (total < 90000 ? "about a minute" : "about " + Math.round(total / 60000) + " minutes");
      var hint = document.createElement("span");
      hint.className = "tour-hint";
      hint.textContent = reduce
        ? (touchFirst ? "Tap the pulsing dot to step through." : "Click the pulsing dot to step through.")
        : (touchFirst ? "Plays on its own. Tap the pulsing dot or swipe to go at your own pace."
                      : "Plays on its own. Click the pulsing dot to go at your own pace.");
      meta.appendChild(document.createTextNode(" "));
      meta.appendChild(hint);
      titleEl.insertAdjacentElement("afterend", meta);
    }

    var railItems = [];
    if (rail) {
      rail.removeAttribute("aria-hidden");
      rail.setAttribute("role", "group");
      rail.setAttribute("aria-label", "Tour chapters");
      rail.innerHTML = "";
      chapters.forEach(function (c, k) {
        var conn = null;
        if (k) { conn = document.createElement("i"); conn.setAttribute("aria-hidden", "true"); rail.appendChild(conn); }
        var b = document.createElement("button");
        b.type = "button";
        b.className = "rail-btn";
        var pill = document.createElement("span");
        pill.setAttribute("data-role", c.role);
        pill.textContent = c.role;
        b.appendChild(pill);
        var note = roleNotes[c.role];
        if (note) { var s = document.createElement("small"); s.textContent = note; b.appendChild(s); }
        var n = c.end - c.start + 1;
        b.setAttribute("aria-label", "Chapter " + (k + 1) + " of " + chapters.length + ": " + c.role +
          (note ? ", " + note.toLowerCase() : "") + ". " + n + (n === 1 ? " step" : " steps"));
        b.addEventListener("click", function () { pauseForUser(); go(c.start, { announce: true }); });
        rail.appendChild(b);
        railItems.push({ btn: b, pill: pill, conn: conn });
      });
    }

    data.forEach(function (item, i) {
      var li = document.createElement("li");
      li.setAttribute("data-role", item.role);
      if (i > 0 && chapterOf[i] !== chapterOf[i - 1]) li.classList.add("ch-start");
      if (!item.src) li.setAttribute("data-pending", "1");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Step " + (i + 1) + " of " + data.length + ": " + (item.short || item.title) + ", " + item.role);
      btn.innerHTML = '<span class="seg"><i></i></span><span class="lbl"><em>' + String(i + 1).padStart(2, "0") + "</em></span>";
      btn.querySelector(".lbl").appendChild(document.createTextNode(item.short || ""));
      btn.addEventListener("click", function () { pauseForUser(); go(i, { announce: true }); });
      li.appendChild(btn);
      dotsEl.appendChild(li);
    });
    var segs = Array.prototype.map.call(dotsEl.children, function (li) { return li.querySelector(".seg i"); });
    function setSeg(k, p) { if (segs[k]) segs[k].style.transform = "scaleX(" + p + ")"; }

    /* ---------- State + controls ---------- */
    var playMode = "";
    function syncPlay() {
      var mode = playing ? "pause" : (index === LAST ? "replay" : "play");
      stage.classList.toggle("is-playing", playing);
      stage.classList.toggle("is-ended", ended);
      if (mode === playMode) return;
      playMode = mode;
      playBtn.removeAttribute("aria-pressed");
      playBtn.setAttribute("data-mode", mode);
      playBtn.setAttribute("aria-label", { pause: "Pause the tour", play: "Play the tour", replay: "Replay the tour from the start" }[mode]);
      playBtn.title = { pause: "Pause", play: "Play", replay: "Replay" }[mode];
      playBtn.innerHTML = mode === "pause" ? '<span class="i-pause"></span>'
        : mode === "play" ? '<span class="i-play"></span>'
        : '<svg class="i-replay" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4.2h4.2"/></svg>';
    }
    function currentFill() { return playing || elapsed > 0 ? Math.min(elapsed / durations[index], 1) : 1; }
    function setPlaying(v) {
      playing = v;
      if (v) ended = false;
      if (index >= 0) setSeg(index, currentFill());
      syncPlay();
    }
    function pauseForUser() { if (playing) setPlaying(false); }
    function finish() {
      playing = false;
      ended = true;
      setSeg(LAST, 1);
      syncPlay();
    }

    function syncControls() {
      prev.disabled = index <= 0;
      next.disabled = index >= LAST;
      Array.prototype.forEach.call(dotsEl.children, function (li, k) {
        li.classList.toggle("now", k === index);
        li.classList.toggle("past", k < index);
        li.classList.remove("is-pending");
        var b = li.querySelector("button");
        if (k === index) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
        setSeg(k, k < index ? 1 : k === index ? currentFill() : 0);
      });
      var at = chapterOf[index];
      railItems.forEach(function (r, k) {
        r.pill.className = k === at ? "on" : (k < at ? "done" : "");
        if (k === at) r.btn.setAttribute("aria-current", "step"); else r.btn.removeAttribute("aria-current");
        if (r.conn) r.conn.classList.toggle("done", k <= at);
      });
      syncPlay();
    }

    function setLoading(v) {
      stage.classList.toggle("is-loading", v);
      if (v) stage.setAttribute("aria-busy", "true"); else stage.removeAttribute("aria-busy");
    }
    function markPending(i) {
      Array.prototype.forEach.call(dotsEl.children, function (li, k) { li.classList.toggle("is-pending", k === i); });
    }

    function announce(i) {
      var it = data[i];
      live.textContent = "Step " + (i + 1) + " of " + data.length + ", " + it.role + ". " + (it.title || "") + " " +
        (it.caption || "") + (i === LAST ? " End of tour." : "");
    }

    // Keep keyboard focus somewhere sensible when the element it was on goes away.
    function restoreFocus(was, wasInFrame) {
      var to = null;
      if (wasInFrame) to = frames[index].querySelector(".hotspot") || stage;
      else if (was === nextCard && nextCard.hidden) to = endPrimary;
      else if (endCard.contains(was) && endCard.hidden) to = stage;
      else if (was && was.disabled) to = was === prev ? next : endPrimary;
      if (to) focusQuietly(to);
    }

    function show(i, opts) {
      var from = index, dir = opts.dir || (from < 0 || i > from ? "right" : "left");
      var was = document.activeElement, hadFocus = stage.contains(was);
      var wasInFrame = from >= 0 && frames[from].contains(was);
      if (from >= 0 && from !== i) leave(frames[from]);
      layoutFrame(i);
      if (from !== i) enter(frames[i], dir);
      fitCallout(i);
      index = i;
      elapsed = 0; seen = 0; zoomed = false;
      if (reduce) { frames[i].classList.add("zoomed"); zoomed = true; }
      if (i < LAST) ended = false;
      fillPanel(panel, i);
      [panel.role, panel.title, panel.cap, panel.next].forEach(swap);
      if (roleEl) {
        // A new chapter gets a more noticeable entrance on the role pill.
        roleEl.classList.remove("chapter-in");
        if (from >= 0 && chapterOf[from] !== chapterOf[i]) { void roleEl.offsetWidth; roleEl.classList.add("chapter-in"); }
      }
      syncControls();
      if (opts.announce) announce(i);
      if (hadFocus) restoreFocus(was, wasInFrame);
    }

    function go(i, opts) {
      opts = opts || {};
      if (i < 0 || i > LAST) return;
      var my = ++token;
      if (i === index) { target = -1; setLoading(false); markPending(-1); return; }
      target = i;
      markPending(i);
      var wait = setTimeout(function () { if (my === token) setLoading(true); }, 80);
      frames[i]._ready.then(function () {
        clearTimeout(wait);
        if (my !== token) return;
        target = -1;
        setLoading(false);
        show(i, opts);
      });
    }

    function flashEnd(moveFocus) {
      endCard.classList.remove("flash");
      void endCard.offsetWidth;
      endCard.classList.add("flash");
      if (moveFocus) focusQuietly(endPrimary);
    }
    function userStep(delta) {
      var base = target >= 0 ? target : index, i = base + delta;
      if (i > LAST) { pauseForUser(); flashEnd(false); return; }
      if (i < 0) return;
      pauseForUser();
      go(i, { announce: true });
    }
    function advance(fromKeyboard) {
      if (index < LAST) userStep(1);
      else { pauseForUser(); flashEnd(fromKeyboard); }
    }
    function replay() {
      ended = false;
      go(0, { dir: "left", announce: true });
      setPlaying(true);
    }

    prev.addEventListener("click", function () { userStep(-1); });
    next.addEventListener("click", function () { userStep(1); });
    nextCard.addEventListener("click", function () { userStep(1); });
    endCard.querySelector(".tour-replay").addEventListener("click", replay);
    playBtn.addEventListener("click", function () {
      if (playing) setPlaying(false);
      else if (index === LAST) replay();
      else setPlaying(true);
    });

    stage.addEventListener("keydown", function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var k = e.key;
      if (k === "ArrowRight") { e.preventDefault(); userStep(1); }
      else if (k === "ArrowLeft") { e.preventDefault(); userStep(-1); }
      else if (k === "Home") { e.preventDefault(); pauseForUser(); go(0, { announce: true }); }
      else if (k === "End") { e.preventDefault(); pauseForUser(); go(LAST, { announce: true }); }
      else if ((k === "Enter" || k === " ") && e.target === stage) { e.preventDefault(); advance(true); }
    });

    // Keyboard focus arriving in the tour stops autoplay (the play button restarts it).
    stage.addEventListener("focusin", function (e) {
      if (quiet || (e.relatedTarget && stage.contains(e.relatedTarget))) return;
      var keyboard = false;
      try { keyboard = e.target.matches(":focus-visible"); } catch (err) { keyboard = false; }
      if (keyboard) pauseForUser();
    });

    // A pointer that is actively moving over the tour holds autoplay, so the
    // step never changes under someone's cursor. A resting pointer doesn't.
    stage.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse" && (e.movementX || e.movementY)) holdUntil = performance.now() + 2000;
    });
    stage.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") holdUntil = 0; });

    // Touch: press-and-hold pauses (like stories); a horizontal swipe changes step.
    var sx = null, sy = null;
    wrap.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      sx = e.clientX; sy = e.clientY; touchHold = true;
    });
    function endTouch(e, cancelled) {
      if (e.pointerType === "mouse") return;
      touchHold = false;
      if (cancelled || sx === null) { sx = null; return; }
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) userStep(dx < 0 ? 1 : -1);
    }
    wrap.addEventListener("pointerup", function (e) { endTouch(e, false); });
    wrap.addEventListener("pointercancel", function (e) { endTouch(e, true); });

    // Autoplay and the camera move only run while the screenshot is on screen.
    if ("IntersectionObserver" in window) {
      var th = []; for (var t = 0; t <= 20; t++) th.push(t / 20);
      new IntersectionObserver(function (entries) {
        var en = entries[entries.length - 1];
        var rootH = en.rootBounds ? en.rootBounds.height : window.innerHeight;
        var need = Math.min(en.boundingClientRect.height, rootH) * 0.55;
        inView = en.isIntersecting && en.intersectionRect.height >= need;
      }, { threshold: th, rootMargin: "-" + Math.round(headerHeight()) + "px 0px 0px 0px" }).observe(visual);
    } else { inView = true; }

    var last = null, heldClass = false;
    function tick(t) {
      var dt = last === null ? 0 : Math.min(t - last, 100);
      last = t;
      if (index >= 0 && inView && !document.hidden) {
        seen += dt;
        if (!zoomed && seen >= ZOOM_AFTER) { zoomed = true; frames[index].classList.add("zoomed"); }
        var held = touchHold || t < holdUntil;
        if (held !== heldClass) { heldClass = held; stage.classList.toggle("is-held", held); }
        if (playing && !held && target < 0) {
          elapsed += dt;
          var d = durations[index];
          setSeg(index, Math.min(elapsed / d, 1));
          if (elapsed >= d) {
            if (index < LAST) go(index + 1, { dir: "right" });
            else finish();
          }
        }
      }
      requestAnimationFrame(tick);
    }

    syncPlay();
    go(0, { dir: "right" });
    requestAnimationFrame(tick);

    function relayout() {
      frames.forEach(function (f, k) { layoutFrame(k); });
      if (index >= 0) fitCallout(index);
      lockSide();
    }
    lockSide();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
    var rz = null, lastW = window.innerWidth;
    addEventListener("resize", function () {
      if (window.innerWidth === lastW) return; // ignore mobile URL-bar height changes
      lastW = window.innerWidth;
      clearTimeout(rz);
      rz = setTimeout(relayout, 150);
    });

    return {
      // "See it run": start (or restart) the tour, unless motion is reduced.
      play: function () {
        if (ended || index === LAST) replay();
        else if (!reduce) setPlaying(true);
      },
      focus: function () { quiet = true; focusQuietly(stage); quiet = false; }
    };
  }

  /* ================================================================
   * In-page navigation: header offset, tour framing, active section
   * ================================================================ */
  function scrollTarget(el) {
    if (el.id === "hero") return 0;
    var h = headerHeight(), avail = window.innerHeight - h;
    if (el.id === "journey") {
      // Frame as much of the tour as fits, centred under the header: the whole
      // section, else chapters + stage, else the stage. Too tall for that? Lead with
      // the chapters if the play controls still fit below them, else with the stage.
      var stageEl = $("journeyStage"), railEl = $("roleRail"), ctrl = document.querySelector(".journey-controls");
      if (stageEl) {
        var bottom = pageTop(stageEl) + stageEl.offsetHeight;
        var picks = [el.firstElementChild, railEl, stageEl].filter(Boolean);
        for (var k = 0; k < picks.length; k++) {
          var top = pageTop(picks[k]), span = bottom - top;
          if (span <= avail - (picks[k] === stageEl ? 0 : 32)) return top - h - (avail - span) / 2;
        }
        if (railEl && ctrl && pageTop(ctrl) + ctrl.offsetHeight - pageTop(railEl) <= avail - 24) return pageTop(railEl) - h - 12;
        return pageTop(stageEl) - h - 12;
      }
    }
    return pageTop(el.firstElementChild || el) - h - 28;
  }
  function scrollToSection(el, smooth) {
    var y = Math.max(0, Math.round(scrollTarget(el)));
    window.scrollTo({ top: y, behavior: smooth && !reduce ? "smooth" : "auto" });
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var el = id && id !== "main" ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    scrollToSection(el, true);
    if (history.pushState) history.pushState(null, "", "#" + id);
    var keyboard = e.detail === 0;
    if (id === "journey") {
      if (a.closest(".hero-cta")) tour.play();
      if (keyboard) tour.focus();
    } else if (keyboard && id !== "hero") {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      focusQuietly(el);
    }
  });
  if (location.hash.length > 1) {
    var landing = document.getElementById(location.hash.slice(1));
    if (landing && landing.tagName === "SECTION") requestAnimationFrame(function () { scrollToSection(landing, false); });
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var navTargets = navLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
  var navActive = -2;
  function updateNav() {
    var line = headerHeight() + window.innerHeight * 0.35, active = -1;
    navTargets.forEach(function (s, k) { if (s && s.getBoundingClientRect().top <= line) active = k; });
    if (active >= 0 && navTargets[active].getBoundingClientRect().bottom < line) active = -1;
    if (active === navActive) return;
    navActive = active;
    navLinks.forEach(function (a, k) {
      a.classList.toggle("is-active", k === active);
      if (k === active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }

  // Proof images with graceful fallback
  document.querySelectorAll(".img-slot").forEach(function (slot) {
    var img = new Image();
    img.src = slot.dataset.src;
    img.alt = slot.dataset.alt;
    img.loading = "lazy";
    img.onerror = function () { slot.innerHTML = ""; slot.appendChild(placeholder("Image pending.")); };
    slot.appendChild(img);
  });

  if (window.MISE_CONTACT_HREF && $("contactBtn")) $("contactBtn").href = window.MISE_CONTACT_HREF;

  // Count-up numbers
  function countUp(el) {
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || "0", 10);
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // Scroll reveal
  var targets = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll(".count").forEach(countUp);
        io.unobserve(en.target);
      });
    }, { threshold: 0.2 });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("in"); el.querySelectorAll(".count").forEach(countUp); });
  }

  // Scroll progress, active nav link, subtle cloud parallax
  var bar = $("scrollBar"), clouds = document.querySelectorAll(".cloud"), ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var y = scrollY;
    if (bar) bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    if (!reduce) clouds.forEach(function (c, k) { c.style.translate = "0 " + (y * (0.04 + k * 0.03)) * -1 + "px"; });
    updateNav();
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", function () { navActive = -2; updateNav(); });
  onScroll();
})();
