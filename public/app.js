(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var data = window.MISE_JOURNEY || [];
  var $ = function (id) { return document.getElementById(id); };
  var stage = $("journeyStage"), wrap = $("frameWrap");
  var roleEl = $("jRole"), numEl = $("jNum"), totalEl = $("jTotal"), titleEl = $("jTitle"),
      capEl = $("jCaption"), tilesEl = $("jTiles"), dotsEl = $("jDots"), ringFg = $("ringFg"),
      prev = $("jPrev"), next = $("jNext");
  var CIRC = 2 * Math.PI * 52;
  var index = -1, current = null;

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

  function sceneMarkup(name) {
    if (name === "intake") {
      return '<span class="scene-tag">Illustration</span><div class="intake">' +
        '<div class="sources"><div class="src-chip"><i></i>The binder</div><div class="src-chip"><i></i>The group chat</div><div class="src-chip"><i></i>A supervisor\'s memory</div></div>' +
        '<div class="flow-arrow"></div>' +
        '<div class="queue"><div class="queue-head"><img src="logo.svg" alt="">One queue</div>' +
        ["Front office", "Housekeeping", "F&amp;B · Kitchen", "Engineering · Security", "Spa"].map(function (t, k) {
          return '<div class="q-row" style="animation-delay:' + (0.9 + k * 0.18) + 's"><b></b>' + t + "</div>";
        }).join("") + "</div></div>";
    }
    if (name === "record") {
      var rows = [
        ["Evening turndown · Room 412", "18:04", "Photo"],
        ["Line check · Main kitchen", "06:31", "Signed off"],
        ["VIP arrival check · Lobby", "14:52", "Photo"],
        ["Night round · Floor 4", "23:10", "Signed off"]
      ];
      return '<span class="scene-tag">Illustration</span><div class="record">' + rows.map(function (r, k) {
        return '<div class="rec" style="animation-delay:' + (0.3 + k * 0.3) + 's"><div>' + r[0] + " <span>· " + r[1] + '</span></div><em class="' + (r[2] === "Photo" ? "ph" : "") + '">' + r[2] + "</em></div>";
      }).join("") + '</div><div class="stamp">AUDIT-READY</div>';
    }
    return "";
  }

  function buildFrame(item, i) {
    var frame = document.createElement("div");
    if (item.kind === "scene") {
      frame.className = "frame";
      var sc = document.createElement("div");
      sc.className = "scene";
      sc.setAttribute("role", "img");
      sc.setAttribute("aria-label", item.title + " " + item.caption);
      sc.innerHTML = sceneMarkup(item.scene);
      frame.appendChild(sc);
      return frame;
    }

    var shot = document.createElement("div");
    shot.className = "shot";
    if (item.viewport === "mobile") {
      frame.className = "frame phone";
      var screen = document.createElement("div");
      screen.className = "screen";
      screen.innerHTML = '<span class="notch" aria-hidden="true"></span>';
      screen.appendChild(shot);
      frame.appendChild(screen);
    } else {
      frame.className = "frame browser";
      frame.innerHTML = '<div class="browser-bar" aria-hidden="true"><i></i><i></i><i></i><b></b></div>';
      frame.appendChild(shot);
    }

    if (!item.src) {
      shot.appendChild(placeholder(item.role + " screen on the way."));
      return frame;
    }

    var img = new Image();
    img.src = item.src;
    img.alt = item.role + " view: " + item.caption;
    img.decoding = "async";
    shot.appendChild(img);

    var hs = null, spot = null;
    if (item.hotspot) {
      var x = item.hotspot.x + "%", y = item.hotspot.y + "%";
      img.style.setProperty("--ox", x);
      img.style.setProperty("--oy", y);
      spot = document.createElement("div");
      spot.className = "spot";
      spot.style.setProperty("--sx", x);
      spot.style.setProperty("--sy", y);
      shot.appendChild(spot);
      hs = document.createElement("button");
      hs.className = "hotspot";
      hs.type = "button";
      hs.innerHTML = "<span></span>";
      hs.style.left = x;
      hs.style.top = y;
      hs.setAttribute("aria-label", i < data.length - 1 ? "Next step" : "Back to the start");
      hs.addEventListener("click", activate);
      shot.appendChild(hs);
    }
    img.onerror = function () {
      shot.innerHTML = "";
      shot.appendChild(placeholder("Screenshot pending."));
    };
    return frame;
  }

  function swap(el) {
    el.classList.remove("swap");
    void el.offsetWidth;
    el.classList.add("swap");
  }

  function go(i, dir) {
    if (i < 0 || i >= data.length || i === index) return;
    var item = data[i];
    dir = dir || (i > index ? "right" : "left");
    var frame = buildFrame(item, i);
    frame.classList.add("enter-" + dir);
    if (current) {
      var old = current;
      old.classList.add("leave");
      setTimeout(function () { old.remove(); }, 650);
    }
    wrap.appendChild(frame);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { frame.classList.remove("enter-" + dir); });
    });
    current = frame;
    index = i;

    roleEl.textContent = item.role;
    roleEl.setAttribute("data-role", item.role);
    numEl.textContent = i + 1;
    totalEl.textContent = "/ " + data.length;
    titleEl.textContent = item.title || "";
    capEl.textContent = item.caption;
    [roleEl, titleEl, capEl].forEach(swap);
    ringFg.style.strokeDashoffset = CIRC * (1 - (i + 1) / data.length);

    tilesEl.innerHTML = "";
    (item.points || []).forEach(function (p, k) {
      var li = document.createElement("li");
      li.style.animationDelay = (0.25 + k * 0.12) + "s";
      li.innerHTML = "<i>" + (k + 1) + "</i>";
      li.appendChild(document.createTextNode(p));
      tilesEl.appendChild(li);
    });

    var order = ["Author", "Staff", "Manager"], at = order.indexOf(item.role);
    document.querySelectorAll("#roleRail span").forEach(function (s) {
      var k = order.indexOf(s.dataset.role);
      s.className = k === at ? "on" : (k < at ? "done" : "");
    });

    prev.disabled = i === 0;
    next.disabled = i === data.length - 1;
    Array.prototype.forEach.call(dotsEl.children, function (d, k) {
      d.setAttribute("aria-selected", k === i ? "true" : "false");
      d.tabIndex = k === i ? 0 : -1;
    });
  }

  function activate() {
    if (index < data.length - 1) go(index + 1, "right");
    else go(0, "left");
  }

  data.forEach(function (item, i) {
    var d = document.createElement("button");
    var pending = item.kind !== "scene" && !item.src;
    d.className = "dot" + (pending ? " pending" : "");
    d.type = "button";
    d.setAttribute("role", "tab");
    d.setAttribute("aria-label", "Step " + (i + 1) + ", " + item.role + (pending ? " (coming soon)" : ""));
    d.addEventListener("click", function () { go(i); });
    dotsEl.appendChild(d);
  });
  prev.addEventListener("click", function () { go(index - 1, "left"); });
  next.addEventListener("click", function () { go(index + 1, "right"); });

  stage.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1, "right"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1, "left"); }
    else if ((e.key === "Enter" || e.key === " ") && (e.target === stage || e.target.classList.contains("hotspot"))) {
      e.preventDefault(); activate();
    }
  });

  var sx = null;
  wrap.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
  wrap.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    sx = null;
  });

  if (data.length) go(0, "right");

  // Proof images with graceful fallback
  document.querySelectorAll(".img-slot").forEach(function (slot) {
    var img = new Image();
    img.src = slot.dataset.src;
    img.alt = slot.dataset.alt;
    img.loading = "lazy";
    img.onerror = function () { slot.innerHTML = ""; slot.appendChild(placeholder("Image pending.")); };
    slot.appendChild(img);
  });

  if (window.MISE_CONTACT_HREF) $("contactBtn").href = window.MISE_CONTACT_HREF;

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

  // Scroll progress + subtle cloud parallax
  var bar = $("scrollBar"), clouds = document.querySelectorAll(".cloud"), ticking = false;
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    var y = scrollY;
    bar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    if (!reduce) clouds.forEach(function (c, k) { c.style.translate = "0 " + (y * (0.04 + k * 0.03)) * -1 + "px"; });
    ticking = false;
  }
  addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
