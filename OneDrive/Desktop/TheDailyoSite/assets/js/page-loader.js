(function () {
  const key = window.PAGE_KEY;
  const el = (tag, attrs = {}, html = "") => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    if (html) node.innerHTML = html;
    return node;
  };

  function setHead(data) {
    if (data.title) document.title = data.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && data.description) metaDesc.setAttribute("content", data.description);

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical && data.canonical) canonical.setAttribute("href", data.canonical);

    const robots = document.querySelector('meta[name="robots"]');
    if (robots && data.robots) robots.setAttribute("content", data.robots);
  }

  function renderHeader(data) {
    const page = el("div", { class: "page" });

    const header = el("header", { class: "site-header" });
    header.appendChild(el("div", { class: "brand-kicker" }, "TheDailyo.com"));
    header.appendChild(el("h1", { class: "site-title" }, data.h1 || "Calculator"));
    if (data.subtitle) header.appendChild(el("p", { class: "site-subtitle" }, data.subtitle));
    header.appendChild(el("div", { class: "header-gradient-line" }));

    // nav pills
    const nav = el("nav", { class: "nav-pills", "aria-label": "Primary navigation" });
    (data.nav || []).forEach(item => {
      nav.appendChild(el("a", { class: "nav-pill", href: item.href }, item.label));
    });
    header.appendChild(nav);

    // breadcrumbs
    if (Array.isArray(data.breadcrumbs) && data.breadcrumbs.length) {
      const bc = el("div", { class: "breadcrumbs" });
      bc.innerHTML = data.breadcrumbs
        .map((b, i) => i === data.breadcrumbs.length - 1
          ? `${b.label}`
          : `<a href="${b.href}">${b.label}</a>`)
        .join(" › ");
      header.appendChild(bc);
    }

    page.appendChild(header);
    return page;
  }

  function renderMain(data) {
    const main = el("main", { id: "main" });

    // Section intro
    main.appendChild(el("h2", { class: "section-title" }, "Calculator"));
    main.appendChild(el("p", { class: "section-subtitle" },
      "Assumes you stop adding new charges and make consistent monthly payments. Add an “extra payment” to see how quickly the timeline improves."
    ));

    // Two column shell (your existing look)
    const twoCol = el("div", { class: "two-col", "aria-label": "Calculator and explanation" });

    // Left: calculator panel (UI gets mounted here)
    const left = el("section", { class: "panel", "aria-label": "Calculator" });
    left.appendChild(el("h2", {}, "Inputs"));
    left.appendChild(el("div", { id: "calc-mount" }));
    twoCol.appendChild(left);

    // Right: explanation panel
    const right = el("aside", { class: "panel", "aria-label": "Explanation" });
    right.appendChild(el("h2", {}, "How it works"));
    if (data.howItWorksHtml) right.appendChild(el("div", { html: data.howItWorksHtml }));

    // FAQ inside aside
    (data.faq || []).forEach(f => {
      const d = el("details", { class: "faq" });
      d.appendChild(el("summary", {}, f.q));
      d.appendChild(el("p", {}, f.a));
      right.appendChild(d);
    });

    twoCol.appendChild(right);
    main.appendChild(twoCol);

    // Related tools
    main.appendChild(el("h2", { class: "section-title" }, "Related tools"));
    main.appendChild(el("p", { class: "section-subtitle" }, "Use these next for loans and a full payment breakdown."));

    const cols = el("div", { class: "columns" });
    (data.related || []).forEach(r => {
      const a = el("a", { class: "card", href: r.href });
      a.appendChild(el("div", { class: "card-title" }, r.title));
      a.appendChild(el("div", { class: "card-desc" }, r.desc));
      a.appendChild(el("div", { class: "card-meta" }, r.meta || "→"));
      cols.appendChild(a);
    });
    main.appendChild(cols);

    // Footer FAQ section (optional)
    main.appendChild(el("h2", { class: "section-title" }, "FAQ"));
    main.appendChild(el("p", { class: "section-subtitle" }, "Quick answers about payoff math."));
    (data.faq || []).slice(0, 2).forEach(f => {
      const d = el("details", { class: "faq" });
      d.appendChild(el("summary", {}, f.q));
      d.appendChild(el("p", {}, f.a));
      main.appendChild(d);
    });

    return main;
  }

  function renderFooter() {
    const footer = el("footer", { class: "site-footer" });
    footer.appendChild(el("div", {}, "© 2026 TheDailyo — All Rights Reserved."));
    const links = el("div", { class: "site-footer-links", style: "margin-top:6px;" });
    links.innerHTML =
      `<a href="/privacy.html">Privacy Policy</a> ·
       <a href="/terms.html">Terms</a> ·
       <a href="/disclaimer.html">Disclaimer</a> ·
       <a href="/contact.html">Contact</a> ·
       <a href="/about.html">About</a>`;
    footer.appendChild(links);
    return footer;
  }

  async function loadJson() {
    if (!key) throw new Error("Missing window.PAGE_KEY");

    const res = await fetch(`/data/pages/${key}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`JSON not found: /data/pages/${key}.json`);
    return await res.json();
  }

  // ---- calculator router (add more types over time)
// ---- calculator router (add more types over time)
function runCalculator(data) {
  const mount = document.getElementById("calc-mount");
  if (!mount) return;

  if (data.calculatorType === "credit_card_payoff_v1") {
    const s = document.createElement("script");
    s.src = "/assets/js/calculators/credit-card-payoff-v1.js?v=1";
    s.onload = () => window.initCreditCardPayoffV1("calc-mount", data.calculatorConfig || {});
    document.body.appendChild(s);
    return;
  }

  if (data.calculatorType === "debt_avalanche_v1" || data.calculatorType === "debt_snowball_v1") {
    const s = document.createElement("script");
    s.src = "/assets/js/calculators/debt-payoff-v1.js?v=1";
    s.onload = () => {
      if (!window.initDebtPayoffV1) {
        mount.innerHTML = `<p>Debt payoff engine failed to load.</p>`;
        return;
      }
      window.initDebtPayoffV1("calc-mount", {
        method: data.calculatorType === "debt_avalanche_v1" ? "avalanche" : "snowball",
        ...(data.calculatorConfig || {})
      });
    };
    document.body.appendChild(s);
    return;
  }

  mount.innerHTML = `<p>Unknown calculatorType: <strong>${data.calculatorType || "(missing)"}</strong></p>`;
}


  async function main() {
    const data = await loadJson();
    setHead(data);

    // Build full page DOM
    const skip = el("a", { class: "skip-link", href: "#main" }, "Skip to content");
    document.body.appendChild(skip);

    const page = renderHeader(data);
    page.appendChild(renderMain(data));
    page.appendChild(renderFooter());
    document.body.appendChild(page);

    // Calculator mounts into #calc-mount
    runCalculator(data);
  }

  main().catch(err => {
    document.body.innerHTML = `<pre style="padding:16px">Loader error: ${String(err.message || err)}</pre>`;
  });
})();
