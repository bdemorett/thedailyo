(function () {
  const $ = (id) => document.getElementById(id);
  const TAX = window.TDY_TAX;

  function calc() {
    const filing = $("filing").value;
    const gross = Math.max(0, TAX.n($("gross").value));
    const ded = Math.max(0, TAX.n($("ded").value));

    const stdDefault = TAX.standardDeduction2025[filing] ?? TAX.standardDeduction2025.single;
    const stdOverride = TAX.n($("stdOverride").value);
    const std = stdOverride > 0 ? stdOverride : stdDefault;

    const taxable = Math.max(0, gross - ded - std);
    const tax = TAX.computeFederalIncomeTax2025(taxable, filing);
    const m = TAX.findMarginalRate2025(taxable, filing);
    const eff = gross > 0 ? tax / gross : 0;

    $("out").classList.remove("muted");
    $("out").innerHTML = `
      <div class="kpi">
        <div><strong>Federal income tax (est.):</strong> ${TAX.money(tax)}</div>
      </div>
      <hr>
      <ul class="list">
        <li><strong>Taxable income:</strong> ${TAX.money(taxable)}</li>
        <li><strong>Standard deduction used:</strong> ${TAX.money(std)}</li>
        <li><strong>Marginal bracket:</strong> ${(m.rate * 100).toFixed(0)}% (band ${TAX.money(m.bandStart)} to ${m.bandEnd === Infinity ? "∞" : TAX.money(m.bandEnd)})</li>
        <li><strong>Effective rate (tax ÷ gross):</strong> ${TAX.pct(eff)}</li>
      </ul>
      <p class="muted">Estimate only. Credits, special deductions, AMT, NIIT, and other items can change results.</p>
    `;
  }

  function reset() {
    $("filing").value = "single";
    $("gross").value = "";
    $("ded").value = "";
    $("stdOverride").value = "";
    $("out").classList.add("muted");
    $("out").textContent = "Enter your numbers and click Calculate.";
  }

  $("calcBtn").addEventListener("click", calc);
  $("resetBtn").addEventListener("click", reset);
})();
