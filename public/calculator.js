(function () {
  "use strict";
  var form = document.getElementById("calcForm");
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };

  // Cornell (Anderson): +1 point on a 5-point review scale ≈ +11.2% rate at the same occupancy.
  var RATE_PER_STAR = 0.112;
  // Cornell (Hinkin & Tracey): a resignation costs ≈ 30% of annual pay.
  var TURNOVER_COST_SHARE = 0.30;

  var PRESETS = {
    conservative: { lift: 0.1, ret: 10, prod: 7.4 },
    strong: { lift: 0.2, ret: 33, prod: 20 }
  };

  function num(name) {
    var v = parseFloat(form.elements[name].value);
    return isFinite(v) && v > 0 ? v : 0;
  }

  function inr(n) {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(n >= 1e8 ? 1 : 2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + " L";
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  function update() {
    var rooms = num("rooms"), adr = num("adr"), occ = Math.min(num("occ"), 100) / 100,
        props = Math.max(1, Math.round(num("props"))), spr = num("spr"), pay = num("pay"),
        attr = num("attr") / 100, hk = Math.min(num("hk"), 100) / 100,
        lift = num("lift"), ret = num("ret") / 100, prod = num("prod") / 100;

    var roomsRevenue = rooms * 365 * occ * adr;
    var staff = rooms * spr;
    var annualPay = pay * 12;

    var price = roomsRevenue * RATE_PER_STAR * lift;
    var retention = staff * attr * ret * annualPay * TURNOVER_COST_SHARE;
    var hours = staff * hk * annualPay * prod;
    var perHotel = price + retention + hours;
    var total = perHotel * props;

    $("calcTotal").textContent = inr(total);
    $("calcPct").textContent = roomsRevenue > 0
      ? (perHotel / roomsRevenue * 100).toFixed(1) + "% of rooms revenue" + (props > 1 ? ", across " + props + " hotels" : "")
      : "";
    var parts = [[price, "Price"], [retention, "Ret"], [hours, "Prod"]];
    var max = Math.max(price, retention, hours, 1);
    parts.forEach(function (p) {
      $("bar" + p[1]).style.width = (p[0] / max * 100) + "%";
      $("val" + p[1]).textContent = inr(p[0] * props);
    });
    $("calcBase").textContent = "Based on " + inr(roomsRevenue) + " rooms revenue, " +
      Math.round(staff) + " staff and about " + Math.round(staff * attr) + " resignations a year, per hotel.";

    form.querySelector('[data-for="lift"]').textContent = "+" + lift.toFixed(2).replace(/0$/, "") + "★";
    form.querySelector('[data-for="ret"]').textContent = Math.round(ret * 100) + "%";
    form.querySelector('[data-for="prod"]').textContent = (prod * 100).toFixed(1).replace(/\.0$/, "") + "%";

    var active = null;
    Object.keys(PRESETS).forEach(function (k) {
      var p = PRESETS[k];
      if (Math.abs(p.lift - lift) < 1e-9 && Math.abs(p.ret - ret * 100) < 1e-9 && Math.abs(p.prod - prod * 100) < 1e-9) active = k;
    });
    form.querySelectorAll("[data-preset]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.dataset.preset === active ? "true" : "false");
    });
  }

  form.addEventListener("input", update);
  form.querySelectorAll("[data-preset]").forEach(function (b) {
    b.addEventListener("click", function () {
      var p = PRESETS[b.dataset.preset];
      form.elements.lift.value = p.lift;
      form.elements.ret.value = p.ret;
      form.elements.prod.value = p.prod;
      update();
    });
  });
  update();
})();
