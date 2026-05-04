(async function () {
  const header = document.querySelector("#site-header-slot");
  if (!header) return;

  const res = await fetch("/includes/site-header.html", { cache: "no-store" });
  header.innerHTML = await res.text();

  // Apply dynamic page meta
  if (window.PAGE_META) {
    if (PAGE_META.title)
      document.getElementById("pageTitle").textContent = PAGE_META.title;

    if (PAGE_META.subtitle)
      document.getElementById("pageSubtitle").textContent = PAGE_META.subtitle;

    if (PAGE_META.breadcrumbs) {
      const bc = document.getElementById("breadcrumbs");
      bc.innerHTML = PAGE_META.breadcrumbs
        .map((b, i) =>
          i === PAGE_META.breadcrumbs.length - 1
            ? b.label
            : `<a href="${b.href}">${b.label}</a> <span class="crumb-sep">›</span>`
        )
        .join(" ");
    }
  }
})();