(function () {
  const $ = (id) => document.getElementById(id);
  const TAX = window.TDY_TAX;

  function calc() {
    const annualTax = Math.max(0, TAX.n($("annualTax").value));
    const withholding = Math.max(0, TAX.n($("withholding").value));
    const year = Math.max(2000, Math.min(2100, Math.floor(TAX.n($("taxYear").value) || 2025)));

    const remaining = Math.max(0, annualTax - withholding);
    const q = remaining / 4;

    const due = [
      { label: `Q1 (Apr 15, ${year + 1})`, amt: q },
      { label: `Q2 (Jun 15, ${year + 1})`, amt: q },
      { label: `Q3 (Sep 15, ${year + 1})`, amt: q },
      { label: `Q4 (Jan 15, ${year + 2})`, amt: q },
    ];

    $("out").classList.remove("muted");
    $("out").innerHTML = `
      <div class="kpi">
        <div><strong>Estimated payments needed:</strong> ${TAX.money(remaining)}</div>
        <div><strong>Each quarter (25%):</strong> ${TAX.money(q)}</div>
      </div>
      <hr>
      <ul class="list">
        ${due.map(d => `<li><strong>${d.label}:</strong> ${TAX.money(d.amt)}</li>`).join("")}
      </ul>
      <p class="muted">Tip: Many people also use the “safe harbor” rules; consult a tax pro for penalties/edge cases.</p>
    `;
  }

  function reset() {
    $("annualTax").value = "";
    $("withholding").value = "";
    $("taxYear").value = "2025";
    $("out").classList.add("muted");
    $("out").textContent = "Enter your estimates and click Calculate.";
  }

  $("calcBtn").addEventListener("click", calc);
  $("resetBtn").addEventListener("click", reset);

  // default year
  if (!$("taxYear").value) $("taxYear").value = "2025";
})();
