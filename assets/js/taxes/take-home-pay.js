(function () {
  const $ = (id) => document.getElementById(id);
  const TAX = window.TDY_TAX;

  function render(r) {
    const freq = 26; // show common pay periods too
    const biWeekly = r.netAnnual / freq;
    const monthly = r.netAnnual / 12;

    return `
      <div class="kpi">
        <div><strong>Net (annual):</strong> ${TAX.money(r.netAnnual)}</div>
        <div><strong>Net (monthly):</strong> ${TAX.money(monthly)}</div>
        <div><strong>Net (bi-weekly):</strong> ${TAX.money(biWeekly)}</div>
      </div>
      <hr>
      <ul class="list">
        <li><strong>Federal taxable income:</strong> ${TAX.money(r.taxableIncome)} (after ${TAX.money(r.std)} standard deduction)</li>
        <li><strong>Federal income tax:</strong> ${TAX.money(r.fedIncomeTax)}</li>
        <li><strong>FICA (SS/Med):</strong> ${TAX.money(r.fica.total)} (SS base ${TAX.money(r.fica.ssBase)})</li>
        <li><strong>State tax:</strong> ${TAX.money(r.stateTax)}</li>
        <li><strong>Local tax:</strong> ${TAX.money(r.localTax)}</li>
        <li><strong>Effective total tax rate (est.):</strong> ${TAX.pct(r.effectiveTotalTaxRate)}</li>
      </ul>
      <p class="muted">Notes: This is an estimate and won’t match every paycheck (benefits and pretax treatment varies by plan).</p>
    `;
  }

  function calc() {
    const r = TAX.computeTakeHome({
      gross: $("gross").value,
      filingStatus: $("filing").value,
      wageBaseYear: $("ssYear").value,
      pretaxDeductions: $("pretax").value,
      stateRate: $("stateRate").value,
      localRate: $("localRate").value,
      otherPostTaxDeductions: $("postTax").value,
    });
    $("out").classList.remove("muted");
    $("out").innerHTML = render(r);
  }

  function reset() {
    ["gross","pretax","stateRate","localRate","postTax"].forEach(id => $(id).value = "");
    $("filing").value = "single";
    $("ssYear").value = "2025";
    $("out").classList.add("muted");
    $("out").textContent = "Enter your numbers and click Calculate.";
  }

  $("calcBtn").addEventListener("click", calc);
  $("resetBtn").addEventListener("click", reset);
})();
