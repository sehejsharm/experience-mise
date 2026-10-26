(function () {
  "use strict";
  var data = window.MISE_JOURNEY || [];
  var stage = document.getElementById("journeyStage");
  var wrap = document.getElementById("frameWrap");
  var roleEl = document.getElementById("jRole");
  var countEl = document.getElementById("jCount");
  var capEl = document.getElementById("jCaption");
  var dotsEl = document.getElementById("jDots");
  var prev = document.getElementById("jPrev");
  var next = document.getElementById("jNext");
  var index = -1;
  var current = null;

  function placeholder(text) {
    var d = document.createElement("div");
    d.className = "placeholder";
    d.innerHTML = "<div><strong>Coming soon</strong><span></span></div>";
    d.querySelector("span").textContent = text;
    return d;
  }

  function buildFrame(item, i) {
    var frame = document.createElement("div");
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
    img.onerror = function () {
      shot.replaceChild(placeholder("Screenshot pending."), img);
      if (hs) hs.remove();
    };
    shot.appendChild(img);

    var hs = null;
    if (item.hotspot) {
      hs = document.createElement("button");
      hs.className = "hotspot";
      hs.type = "button";
      hs.style.left = item.hotspot.x + "%";
      hs.style.top = item.hotspot.y + "%";
      hs.setAttribute("aria-label", i < data.length - 1 ? "Next step" : "Back to the start");
      hs.addEventListener("click", activate);
      shot.appendChild(hs);
    }
    return frame;
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
      setTimeout(function () { old.remove(); }, 460);
    }
    wrap.appendChild(frame);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { frame.classList.remove("enter-" + dir); });
    });
    current = frame;
    index = i;

    roleEl.textContent = item.role;
    roleEl.setAttribute("data-role", item.role);
    countEl.textContent = (i + 1) + " / " + data.length;
    capEl.textContent = item.caption;
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
    d.className = "dot" + (item.src ? "" : " pending");
    d.type = "button";
    d.setAttribute("role", "tab");
    d.setAttribute("aria-label", "Screen " + (i + 1) + ", " + item.role + (item.src ? "" : " (coming soon)"));
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

  // Swipe on touch devices
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
    img.onerror = function () {
      slot.innerHTML = "";
      var p = placeholder("Image pending.");
      p.querySelector("strong").textContent = "Image";
      slot.appendChild(p);
    };
    slot.appendChild(img);
  });

  var contact = document.getElementById("contactBtn");
  if (window.MISE_CONTACT_HREF) contact.href = window.MISE_CONTACT_HREF;

  // Scroll reveal
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }
})();
