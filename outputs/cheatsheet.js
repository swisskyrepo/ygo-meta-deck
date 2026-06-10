/* Shared runtime for all deck cheatsheets: theme toggle, card rendering, hover preview.
   Each page defines `const CARDS = { key: { id: <ygoprodeck id>, name: "..." }, ... }`
   before loading this script, and marks cards with data-card="key" on
   .card-chip / .cloud-card / .card-mention elements. */
(function () {
  "use strict";

  var imageUrl = function (id) {
    return "https://images.ygoprodeck.com/images/cards/" + String(id).replace(/\D/g, "") + ".jpg";
  };
  var cards = typeof CARDS === "object" && CARDS !== null ? CARDS : {};
  var THEME_KEY = "ygo-cheatsheet-theme";

  /* ---------- Theme toggle ---------- */
  function storedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function preferredTheme() {
    var stored = storedTheme();
    if (stored === "dark" || stored === "light") return stored;
    return "light";
  }

  function themeIcon(theme) {
    if (theme === "dark") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z"></path></svg>';
  }

  function applyTheme(theme, button) {
    document.documentElement.dataset.theme = theme;
    button.innerHTML = themeIcon(theme) + "<span>" + (theme === "dark" ? "Light mode" : "Dark mode") + "</span>";
    button.setAttribute("aria-pressed", String(theme === "dark"));
  }

  function initTheme() {
    var button = document.createElement("button");
    button.className = "theme-toggle";
    button.type = "button";
    button.addEventListener("click", function () {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      applyTheme(next, button);
    });
    document.body.appendChild(button);
    applyTheme(preferredTheme(), button);
  }

  /* ---------- Card rendering ---------- */
  function cardFor(el) {
    return cards[el.dataset.card] || null;
  }

  function renderChips() {
    document.querySelectorAll(".card-chip[data-card]").forEach(function (el) {
      var card = cardFor(el);
      if (!card) { el.textContent = el.dataset.card; return; }
      el.setAttribute("tabindex", "0");
      el.innerHTML = "";
      var img = document.createElement("img");
      img.src = imageUrl(card.id);
      img.alt = "";
      img.loading = "lazy";
      var label = document.createElement("span");
      label.textContent = card.name;
      el.append(img, label);
    });

    document.querySelectorAll(".cloud-card[data-card]").forEach(function (el) {
      var card = cardFor(el);
      if (!card) return;
      el.setAttribute("tabindex", "0");
      el.innerHTML = "";
      var img = document.createElement("img");
      img.src = imageUrl(card.id);
      img.alt = card.name;
      img.loading = "lazy";
      el.appendChild(img);
    });

    document.querySelectorAll(".card-mention[data-card]").forEach(function (el) {
      var card = cardFor(el);
      if (!card) return;
      el.setAttribute("tabindex", "0");
      if (!el.textContent.trim()) el.textContent = card.name;
    });
  }

  /* ---------- Hover preview ---------- */
  function initPreview() {
    var preview = document.createElement("div");
    preview.className = "card-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<img alt=""><span></span>';
    document.body.appendChild(preview);
    var img = preview.querySelector("img");
    var label = preview.querySelector("span");
    var hoverable = window.matchMedia("(hover: hover)");

    function position(event) {
      if (!preview.classList.contains("show")) return;
      var margin = 18;
      var width = preview.offsetWidth || 248;
      var height = preview.offsetHeight || 380;
      var x = event.clientX + margin;
      var y = event.clientY + margin;
      if (x + width > window.innerWidth - 8) x = event.clientX - width - margin;
      if (y + height > window.innerHeight - 8) y = window.innerHeight - height - 8;
      preview.style.left = Math.max(8, x) + "px";
      preview.style.top = Math.max(8, y) + "px";
    }

    function targetOf(node) {
      return node && node.closest ? node.closest(".card-chip[data-card], .cloud-card[data-card], .card-mention[data-card]") : null;
    }

    function show(target, event) {
      var card = cardFor(target);
      if (!card) return;
      img.src = imageUrl(card.id);
      img.alt = card.name;
      label.textContent = card.name;
      preview.classList.add("show");
      preview.setAttribute("aria-hidden", "false");
      position(event || { clientX: window.innerWidth / 2, clientY: 100 });
    }

    function hide() {
      preview.classList.remove("show");
      preview.setAttribute("aria-hidden", "true");
    }

    document.addEventListener("mouseover", function (event) {
      var target = targetOf(event.target);
      if (target && hoverable.matches) show(target, event);
    });

    document.addEventListener("mousemove", position);

    document.addEventListener("mouseout", function (event) {
      var target = targetOf(event.target);
      if (target && !target.contains(event.relatedTarget)) hide();
    });

    document.addEventListener("focusin", function (event) {
      var target = targetOf(event.target);
      if (target) show(target, { clientX: window.innerWidth / 2, clientY: 100 });
    });

    document.addEventListener("focusout", function (event) {
      if (targetOf(event.target)) hide();
    });

    /* Touch fallback: tap toggles the preview. */
    document.addEventListener("click", function (event) {
      var target = targetOf(event.target);
      if (!target) { if (!hoverable.matches) hide(); return; }
      if (hoverable.matches) return;
      var card = cardFor(target);
      if (card && preview.classList.contains("show") && label.textContent === card.name) {
        hide();
      } else {
        show(target, event);
      }
    });
  }

  function init() {
    initTheme();
    renderChips();
    initPreview();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
