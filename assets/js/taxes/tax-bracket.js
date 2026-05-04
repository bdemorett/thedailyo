(function () {
  const $ = (id) => document.getElementById(id);
  const TAX = window.TDY_TAX;

  function calc() {
    const filing = $("filing").value;
    const gross = Math.max(0, TAX.n($("gross").value));
    const ded = Math.max(0, TAX.n($("ded").value));
    const std = TAX.standardDeduction2025[filing] ?? TAX.standardDeduction2025.single;

    const taxable = Math.max(0, gross - ded - std);
    const tax = TAX.computeFederalIncomeTax2025(taxable, filing);
    const m = TAX.findMarginalRate2025(taxable, filing);

    const effOnGross = gross > 0 ? tax / gross : 0;
    const effOnTaxable = taxable > 0 ? tax / taxable : 0;

    $("out").classList.remove("muted");
    $("out").innerHTML = `
      <div class="kpi">
        <div><strong>Marginal bracket:</strong> ${(m.rate * 100).toFixed(0)}%</div>
        <div><strong>Federal tax (est.):</strong> ${TAX.money(tax)}</div>
      </div>
      <hr>
      <ul class="list">
        <li><strong>Taxable income:</strong> ${TAX.money(taxable)} (after ${TAX.money(std)} standard deduction)</li>
        <li><strong>Bracket range:</strong> ${TAX.money(m.bandStart)} to ${m.bandEnd === Infinity ? "∞" : TAX.money(m.bandEnd)}</li>
        <li><strong>Effective rate (tax ÷ gross):</strong> ${TAX.pct(effOnGross)}</li>
        <li><strong>Effective rate (tax ÷ taxable):</strong> ${TAX.pct(effOnTaxable)}</li>
      </ul>
      <p class="muted">Marginal rate applies only to your next dollar of taxable income.</p>
    `;
  }

  function reset() {
    $("filing").value = "single";
    $("gross").value = "";
    $("ded").value = "";
    $("out").classList.add("muted");
    $("out").textContent = "Enter your numbers and click Calculate.";
  }

  $("calcBtn").addEventListener("click", calc);
  $("resetBtn").addEventListener("click", reset);
})();
