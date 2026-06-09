(function () {
  "use strict";

  const root = document.documentElement;
  if (root.dataset.cheatsheetUnified === "true") return;
  root.dataset.cheatsheetUnified = "true";
  root.classList.add("unified-cheatsheet");

  const imageById = (id) => "https://images.ygoprodeck.com/images/cards/" + String(id).replace(/\D/g, "") + ".jpg";
  const THEME_STORAGE_KEY = "ygo-cheatsheet-theme-v2";
  const CARD_ALIAS_STOPWORDS = new Set([
    "a", "an", "the", "and", "or", "of", "no", "to", "in", "on", "by", "for", "with", "from",
    "card", "cards", "deck", "extra", "hand", "field", "grave", "graveyard", "phase", "turn",
    "summon", "special", "normal", "monster", "monsters", "spell", "spells", "trap", "traps",
    "fusion", "ritual", "synchro", "xyz", "link", "dragon", "warrior", "beast", "world",
    "sky", "striker", "ace", "mitsurugi", "shaddoll", "branded", "despia", "witchcrafter",
    "traptrix", "toon", "crystal", "plunder", "patroll", "power", "patron", "primite",
    "kewl", "tune", "maliss", "doomz", "dracotail", "eldlich", "horus", "blue", "eyes"
  ]);
  const CARD_ALIAS_SHORT_ALLOW = new Set([
    "raye", "roze", "saji", "sera", "zero", "winda", "quem", "alba", "bls", "cue", "mix",
    "reco", "jord", "lys", "pan", "lode", "sage", "roar", "belle", "ash", "maxx"
  ]);
  const text = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const shortText = (value, limit) => {
    const clean = text(value);
    return clean.length > limit ? clean.slice(0, limit - 1).trimEnd() + "..." : clean;
  };
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[char]));

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* ignore private-mode storage errors */ }
  }

  function preferredTheme() {
    const stored = safeStorageGet(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return "light";
  }

  function themeIcon(theme) {
    if (theme === "dark") {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 7.5A9 9 0 1 1 12 3Z"></path></svg>';
  }

  function applyTheme(theme) {
    root.dataset.cheatsheetTheme = theme;
    const button = document.querySelector(".unified-theme-toggle");
    if (button) {
      const label = theme === "dark" ? "Light mode" : "Dark mode";
      button.innerHTML = themeIcon(theme) + '<span>' + label + '</span>';
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  function ensureThemeToggle() {
    if (document.querySelector(".unified-theme-toggle")) return;
    const button = document.createElement("button");
    button.className = "unified-theme-toggle";
    button.type = "button";
    button.addEventListener("click", () => {
      const next = root.dataset.cheatsheetTheme === "dark" ? "light" : "dark";
      safeStorageSet(THEME_STORAGE_KEY, next);
      applyTheme(next);
    });
    document.body.appendChild(button);
    applyTheme(preferredTheme());
  }

  function elementName(el) {
    if (!el) return "";
    const ds = el.dataset || {};
    const img = el.querySelector && el.querySelector("img[alt]:not([alt=''])");
    return text(ds.cardName || ds.name || el.getAttribute("aria-label") || el.getAttribute("title") || (img && img.alt) || el.textContent)
      .replace(/^Preview\s+/i, "");
  }

  function elementImage(el) {
    if (!el) return "";
    const ds = el.dataset || {};
    if (ds.cardImg) return ds.cardImg;
    if (ds.cardId) return imageById(ds.cardId);
    const img = el.querySelector && (el.querySelector("img[src*='images/cards/']") || el.querySelector("img[src]"));
    if (img) return img.currentSrc || img.src;
    return "";
  }

  function getCardCatalog() {
    const map = new Map();
    const add = (name, image) => {
      const cleanName = text(name);
      const cleanImage = text(image);
      if (cleanName.length < 4 || !cleanImage) return;
      const key = cleanName.toLowerCase();
      if (!map.has(key)) map.set(key, { name: cleanName, image: cleanImage });
    };

    document.querySelectorAll(".card-mini, .card-chip, .card-token, [data-card-name], [data-card-img], .unified-cloud-card").forEach((el) => {
      add(elementName(el), elementImage(el));
    });

    document.querySelectorAll("img[alt][src*='images/cards/']").forEach((img) => {
      add(img.alt, img.currentSrc || img.src);
    });

    return Array.from(map.values()).sort((a, b) => b.name.length - a.name.length);
  }

  function cleanAlias(alias) {
    return text(alias)
      .replace(/[“”]/g, "\"")
      .replace(/[’]/g, "'")
      .replace(/^[\s"'`]+|[\s"'`!?.:;]+$/g, "")
      .replace(/\s+/g, " ");
  }

  function aliasVariants(alias) {
    const clean = cleanAlias(alias);
    if (!clean) return [];
    const stripped = cleanAlias(clean.replace(/[!"'`]/g, ""));
    return Array.from(new Set([clean, stripped].filter(Boolean)));
  }

  function shouldUseAlias(alias, force) {
    const clean = cleanAlias(alias);
    if (!clean || !/[A-Za-z]/.test(clean)) return false;
    const lower = clean.toLowerCase();
    if (force) return clean.length >= 4;
    if (CARD_ALIAS_STOPWORDS.has(lower)) return false;
    if (CARD_ALIAS_SHORT_ALLOW.has(lower)) return true;
    if (clean.includes(" ")) {
      return clean.length >= 7 && clean.split(/\s+/).some((part) => {
        const word = part.toLowerCase().replace(/[^a-z0-9-]/g, "");
        return word.length >= 4 && !CARD_ALIAS_STOPWORDS.has(word);
      });
    }
    return clean.length >= 5;
  }

  function addAlias(aliasMap, conflicts, alias, card, force) {
    aliasVariants(alias).forEach((candidate) => {
      if (!shouldUseAlias(candidate, force)) return;
      const key = candidate.toLowerCase();
      const existing = aliasMap.get(key);
      if (existing && existing.name !== card.name) {
        conflicts.add(key);
        return;
      }
      if (!conflicts.has(key)) aliasMap.set(key, card);
    });
  }

  function aliasesForCardName(name) {
    const aliases = [];
    const base = cleanAlias(name);
    const separatorParts = base.split(/\s+(?:-|–|—|=)\s+|,\s*/).map(cleanAlias).filter(Boolean);
    separatorParts.forEach((part, index) => {
      if (index > 0 || separatorParts.length === 1) aliases.push(part);
    });

    const ameMatch = base.match(/^Ame no (.+?) no Mitsurugi$/i);
    if (ameMatch) aliases.push(ameMatch[1]);

    const noMitsurugiMatch = base.match(/^(.+?) no Mitsurugi$/i);
    if (noMitsurugiMatch) aliases.push(noMitsurugiMatch[1].replace(/^Ame no\s+/i, ""));

    const words = base.match(/[A-Za-z0-9][A-Za-z0-9'!-]*/g) || [];
    words.forEach((word) => {
      const cleanWord = cleanAlias(word);
      if (cleanWord.length >= 5) aliases.push(cleanWord);
    });

    const lastWord = cleanAlias(words[words.length - 1] || "");
    if (lastWord.length >= 4) aliases.push(lastWord);

    return Array.from(new Set(aliases.map(cleanAlias).filter(Boolean)));
  }

  function buildCardAliasMap(catalog) {
    const aliasMap = new Map();
    const conflicts = new Set();
    catalog.forEach((card) => {
      addAlias(aliasMap, conflicts, card.name, card, true);
      aliasesForCardName(card.name).forEach((alias) => addAlias(aliasMap, conflicts, alias, card, false));
    });
    conflicts.forEach((key) => aliasMap.delete(key));
    return aliasMap;
  }

  function closestCardTarget(target) {
    return target && target.closest && target.closest(".card-mini, .card-chip, .card-token, .unified-cloud-card, .card-mention");
  }

  function infoFromTarget(el) {
    if (!el) return null;
    const ds = el.dataset || {};
    const name = text(ds.cardName || elementName(el));
    const image = text(ds.cardImg || elementImage(el));
    if (!name || !image) return null;
    return { name, image };
  }

  function bindCardPreview() {
    if (document.querySelector(".unified-card-preview")) return;
    const preview = document.createElement("div");
    preview.className = "unified-card-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<img alt=""><span></span>';
    document.body.appendChild(preview);
    const img = preview.querySelector("img");
    const label = preview.querySelector("span");

    function position(event) {
      if (!preview.classList.contains("show")) return;
      const margin = 18;
      const width = preview.offsetWidth || 248;
      const height = preview.offsetHeight || 360;
      let x = event.clientX + margin;
      let y = event.clientY + margin;
      if (x + width > window.innerWidth - 8) x = event.clientX - width - margin;
      if (y + height > window.innerHeight - 8) y = window.innerHeight - height - 8;
      preview.style.left = Math.max(8, x) + "px";
      preview.style.top = Math.max(8, y) + "px";
    }

    function show(target, event) {
      const info = infoFromTarget(target);
      if (!info) return;
      img.src = info.image;
      img.alt = info.name;
      label.textContent = info.name;
      preview.classList.add("show");
      preview.setAttribute("aria-hidden", "false");
      position(event || { clientX: window.innerWidth / 2, clientY: 90 });
    }

    function hide() {
      preview.classList.remove("show");
      preview.setAttribute("aria-hidden", "true");
    }

    document.addEventListener("mouseover", (event) => {
      const target = closestCardTarget(event.target);
      if (target && window.matchMedia("(hover: hover)").matches) show(target, event);
    });

    document.addEventListener("mousemove", position);

    document.addEventListener("mouseout", (event) => {
      const target = closestCardTarget(event.target);
      if (target && !target.contains(event.relatedTarget)) hide();
    });

    document.addEventListener("focusin", (event) => {
      const target = closestCardTarget(event.target);
      if (target) show(target, { clientX: window.innerWidth / 2, clientY: 100 });
    });

    document.addEventListener("focusout", (event) => {
      if (closestCardTarget(event.target)) hide();
    });

    document.addEventListener("click", (event) => {
      const target = closestCardTarget(event.target);
      if (!target || window.matchMedia("(hover: hover)").matches) return;
      const info = infoFromTarget(target);
      if (!info) return;
      if (preview.classList.contains("show") && label.textContent === info.name) {
        hide();
      } else {
        show(target, event);
      }
    });
  }

  function cardNamesFrom(container) {
    const names = [];
    const seen = new Set();
    container.querySelectorAll(".card-mini, .card-chip, .card-token, [data-card-name], .unified-cloud-card").forEach((el) => {
      const name = elementName(el);
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        names.push(name);
      }
    });
    return names.slice(0, 8);
  }

  function firstCardPills(names) {
    if (!names.length) return '<span class="unified-detail-text">Context-dependent</span>';
    return '<div class="unified-card-pill-list">' + names.map((name) => '<span class="unified-card-pill">' + esc(name) + "</span>").join("") + "</div>";
  }

  function rowDescription(el) {
    const listItems = Array.from(el.querySelectorAll("li")).map((li) => text(li.textContent)).filter(Boolean);
    if (listItems.length) return shortText(listItems.join(" "), 360);

    const paragraphs = Array.from(el.querySelectorAll("p, .node-text, .step-note, .dense"))
      .map((p) => text(p.textContent))
      .filter(Boolean);
    if (paragraphs.length) return shortText(paragraphs.join(" "), 360);

    return shortText(el.textContent, 360);
  }

  function rowTitle(el, fallback) {
    const titleEl = el.querySelector("h3, h4, .node-title, .step-title, .route-label strong, b, strong");
    return shortText(titleEl ? titleEl.textContent : fallback, 90);
  }

  function rowMeta(el) {
    const metaEl = el.querySelector(".tag, .node-type, .field-label, .route-meta, small, .path-label");
    return shortText(metaEl ? metaEl.textContent : "Route", 64);
  }

  function findSectionsByTopic(pattern) {
    return Array.from(document.querySelectorAll("section, .section")).filter((section) => {
      const idClass = text((section.id || "") + " " + (section.className || ""));
      const heading = text((section.querySelector("h2, h3") || {}).textContent);
      return pattern.test(idClass + " " + heading);
    });
  }

  function findComboSection() {
    const sections = findSectionsByTopic(/\b(core\s+combos|combo|interactions|route\s+graph)\b/i);
    return sections.find((section) => /core\s+combos|interactions/i.test(text(section.querySelector("h2") && section.querySelector("h2").textContent))) ||
      sections.find((section) => /combos?/i.test(section.id || "")) ||
      sections[0] || null;
  }

  function insertAfterLead(section, node) {
    const direct = Array.from(section.children);
    const anchor = direct.find((el) => el.matches(".section-title, .section-head, header, .header, .title-left")) ||
      direct.find((el) => el.querySelector && el.querySelector("h2"));
    if (anchor) {
      anchor.insertAdjacentElement("afterend", node);
    } else {
      section.insertBefore(node, section.firstChild);
    }
  }

  function comboSourceRows(section) {
    const selectors = [
      ".combo-card",
      ".flow-step",
      ".graph-node",
      ".graph .node",
      ".graph-grid .node",
      ".map-node",
      ".route-card",
      ".branch-card",
      ".branch"
    ];
    const rows = [];
    for (const selector of selectors) {
      section.querySelectorAll(selector).forEach((el) => {
        if (el.closest(".unified-combo-table-wrap")) return;
        const title = rowTitle(el, "Route " + (rows.length + 1));
        const description = rowDescription(el);
        if (!title || !description || title === description) return;
        rows.push({
          meta: rowMeta(el),
          title,
          cards: cardNamesFrom(el),
          description
        });
      });
      if (rows.length >= 4) break;
    }
    return rows.slice(0, 10);
  }

  function ensureComboTimeline() {
    const section = findComboSection();
    if (!section || section.querySelector(".unified-combo-table-wrap")) return;
    const heading = section.querySelector("h2");
    if (heading) heading.textContent = "Core Combos And Interactions";

    const rows = comboSourceRows(section);
    if (rows.length < 2) return;

    const wrap = document.createElement("div");
    wrap.className = "unified-combo-table-wrap";
    wrap.innerHTML = `
      <table class="unified-combo-table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Route</th>
            <th>Key cards</th>
            <th>Detailed description</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td><span class="unified-step-badge">${index + 1}</span></td>
              <td>
                <span class="unified-route-title">${esc(row.title)}</span>
                <span class="unified-route-meta">${esc(row.meta)}</span>
              </td>
              <td>${firstCardPills(row.cards)}</td>
              <td><span class="unified-detail-text">${esc(row.description)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    insertAfterLead(section, wrap);
  }

  function findSideSection() {
    return document.getElementById("side") ||
      document.getElementById("side-counters") ||
      findSectionsByTopic(/\b(side|counters?|matchup)\b/i)[0] ||
      null;
  }

  function sideSourceRows(section) {
    if (!section) return [];
    const candidates = Array.from(section.querySelectorAll(".matchup-card, .match-card, .note-card, .tip-card, .panel, article, .branch, .side-card"))
      .filter((el) => !el.closest(".unified-side-table-wrap") && !el.closest("table"));
    const rows = candidates.map((el, index) => ({
      problem: rowTitle(el, "Matchup " + (index + 1)),
      options: cardNamesFrom(el),
      plan: rowDescription(el)
    })).filter((row) => row.problem && row.plan && row.problem !== row.plan);
    return rows.slice(0, 8);
  }

  function ensureSideTable() {
    const section = findSideSection();
    if (!section) return;
    const heading = section.querySelector("h2");
    if (heading) heading.textContent = "Side Deck Options And Counters";
    if (section.querySelector(".side-table, .unified-side-table-wrap")) return;

    const rows = sideSourceRows(section);
    if (rows.length < 2) return;

    const wrap = document.createElement("div");
    wrap.className = "unified-side-table-wrap";
    wrap.innerHTML = `
      <table class="unified-side-table">
        <thead>
          <tr>
            <th>Matchup / problem</th>
            <th>Side options</th>
            <th>How to use them</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>${esc(row.problem)}</td>
              <td>${firstCardPills(row.options)}</td>
              <td><span class="unified-detail-text">${esc(row.plan)}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    insertAfterLead(section, wrap);
  }

  function ensureCardCloud() {
    const hero = document.querySelector(".hero, header.hero, section.hero");
    if (!hero || hero.querySelector(".unified-card-cloud")) return;
    hero.classList.add("has-unified-card-cloud");
    if (hero.querySelector(".showcase, .hero-showcase, .showcase-wrap, .hero-side .card-chip, .hero-side .card-mini, .hero-side .card-token")) return;

    const cards = getCardCatalog().slice(0, 10);
    if (cards.length < 4) return;

    const aside = document.createElement("aside");
    aside.className = "unified-card-cloud";
    aside.setAttribute("aria-label", "Featured cards");
    aside.innerHTML = '<div class="unified-card-cloud-grid">' + cards.map((card) => `
      <button class="unified-cloud-card" type="button" data-card-name="${esc(card.name)}" data-card-img="${esc(card.image)}" aria-label="Preview ${esc(card.name)}">
        <img src="${esc(card.image)}" alt="${esc(card.name)}" loading="lazy">
      </button>
    `).join("") + "</div>";
    hero.appendChild(aside);
  }

  function referenceCandidates() {
    const all = Array.from(document.querySelectorAll("section, aside, div")).filter((el) => {
      if (el.matches("nav, .quick-nav, .nav-band, .tabs, .tab-bar")) return false;
      const idClass = text((el.id || "") + " " + (el.className || ""));
      const heading = text((el.querySelector(":scope > h2, :scope > .section-title h2, :scope > .section-head h2, :scope > header h2") || {}).textContent);
      return /\b(refs?|references?|sources|knowledge\s+tabs)\b/i.test(idClass + " " + heading);
    });

    return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
  }

  function revealReferences(block) {
    block.hidden = false;
    block.removeAttribute("hidden");
    block.setAttribute("aria-hidden", "false");
    block.classList.add("unified-references-bottom");
    block.querySelectorAll("[hidden]").forEach((el) => {
      if (/ref|source/i.test((el.id || "") + " " + (el.className || ""))) {
        el.hidden = false;
        el.removeAttribute("hidden");
      }
    });
    const heading = block.querySelector("h2");
    if (heading && !/references/i.test(heading.textContent)) heading.textContent = "References";
  }

  function moveReferencesToBottom() {
    const main = document.querySelector("main") || document.querySelector(".page") || document.querySelector(".shell") || document.body;
    const blocks = referenceCandidates();
    blocks.forEach((block) => {
      revealReferences(block);
      if (block.parentElement !== main || block !== main.lastElementChild) {
        main.appendChild(block);
      }
    });
  }

  function bindReferenceButtons() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button, a");
      if (!button) return;
      const label = text(button.textContent + " " + (button.id || "") + " " + (button.getAttribute("aria-controls") || ""));
      if (!/refs?|references?|sources/i.test(label)) return;
      window.setTimeout(() => {
        moveReferencesToBottom();
        const target = document.querySelector(".unified-references-bottom");
        if (target && button.tagName === "BUTTON") target.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    });
  }

  function highlightCardMentions() {
    const catalog = getCardCatalog();
    if (!catalog.length) return;
    const aliasMap = buildCardAliasMap(catalog);
    const aliases = Array.from(aliasMap.keys()).sort((a, b) => b.length - a.length).slice(0, 220);
    if (!aliases.length) return;
    const pattern = new RegExp("(^|[^A-Za-z0-9])(" + aliases.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(?=$|[^A-Za-z0-9])", "gi");
    const skipTags = new Set(["SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "A", "BUTTON", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);
    const skipClass = /(^|\s)(card-mini|card-chip|card-token|card-mention|unified-card-preview|unified-card-cloud|unified-combo-table|unified-side-table)(\s|$)/;
    let count = 0;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (count > 500) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || skipTags.has(parent.tagName) || skipClass.test(parent.className || "")) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".card-mini, .card-chip, .card-token, .card-mention, .unified-card-preview, .unified-card-cloud, .unified-combo-table, .unified-side-table")) return NodeFilter.FILTER_REJECT;
        const value = node.nodeValue;
        if (!value || value.length > 1800 || !pattern.test(value)) {
          pattern.lastIndex = 0;
          return NodeFilter.FILTER_REJECT;
        }
        pattern.lastIndex = 0;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      const value = node.nodeValue;
      let lastIndex = 0;
      value.replace(pattern, (whole, prefix, alias, offset) => {
        const card = aliasMap.get(alias.toLowerCase());
        if (!card) return whole;
        if (offset > lastIndex) frag.appendChild(document.createTextNode(value.slice(lastIndex, offset)));
        if (prefix) frag.appendChild(document.createTextNode(prefix));
        const span = document.createElement("span");
        span.className = "card-mention";
        span.dataset.cardName = card.name;
        span.dataset.cardImg = card.image;
        span.textContent = alias;
        frag.appendChild(span);
        lastIndex = offset + whole.length;
        count += 1;
        return whole;
      });
      if (lastIndex < value.length) frag.appendChild(document.createTextNode(value.slice(lastIndex)));
      if (lastIndex > 0) node.parentNode.replaceChild(frag, node);
    });
  }

  function bindDynamicHighlightRefresh() {
    document.addEventListener("click", (event) => {
      if (!event.target.closest("button, [role='tab'], .route-button, .tab-button, .map-node")) return;
      window.setTimeout(highlightCardMentions, 0);
    });
  }

  function init() {
    ensureThemeToggle();
    bindCardPreview();
    ensureComboTimeline();
    ensureSideTable();
    ensureCardCloud();
    moveReferencesToBottom();
    bindReferenceButtons();
    bindDynamicHighlightRefresh();
    highlightCardMentions();

    window.setTimeout(() => {
      ensureComboTimeline();
      ensureSideTable();
      ensureCardCloud();
      moveReferencesToBottom();
      highlightCardMentions();
    }, 150);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
