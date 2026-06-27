(function () {
  const $ = (id) => document.getElementById(id);
  const TAX = window.TDY_TAX;

  function calc() {
    const filing = $("filing").value;
    const ssYear = $("ssYear").value;
    const stateRate = TAX.clamp(TAX.n($("stateRate").value) / 100, 0, 0.30);

    // --- W2 ---
    const w2Gross = Math.max(0, TAX.n($("w2Gross").value));
    const w2Pretax = Math.max(0, TAX.n($("w2Pretax").value));
    const w2Std = TAX.standardDeduction2025[filing] ?? TAX.standardDeduction2025.single;
    const w2Taxable = Math.max(0, w2Gross - w2Pretax - w2Std);
    const w2Fed = TAX.computeFederalIncomeTax2025(w2Taxable, filing);
    const w2Fica = TAX.computeEmployeeFICA(w2Gross - w2Pretax, filing, ssYear).total;
    const w2State = (w2Gross - w2Pretax) * stateRate;
    const w2Net = Math.max(0, w2Gross - w2Pretax - w2Fed - w2Fica - w2State);

    // --- 1099 / contractor ---
    const cGross = Math.max(0, TAX.n($("cGross").value));
    const cExp = Math.max(0, TAX.n($("cExp").value));
    const cProfit = Math.max(0, cGross - cExp);

    const se = TAX.computeSelfEmploymentTax(cProfit, ssYear);

    // Taxable income estimate: profit - half SE tax - standard deduction
    const cStd = TAX.standardDeduction2025[filing] ?? TAX.standardDeduction2025.single;
    const cTaxable = Math.max(0, cProfit - se.halfDeduction - cStd);
    const cFed = TAX.computeFederalIncomeTax2025(cTaxable, filing);
    const cState = cProfit * stateRate;

    const cNet = Math.max(0, cGross - cExp - se.total - cFed - cState);

    const diff = cNet - w2Net;

    $("out").classList.remove("muted");
    $("out").innerHTML = `
      <div class="kpi">
        <div><strong>W-2 net (est.):</strong> ${TAX.money(w2Net)}</div>
        <div><strong>1099 net (est.):</strong> ${TAX.money(cNet)}</div>
        <div><strong>Difference (1099 − W-2):</strong> ${TAX.money(diff)}</div>
      </div>
      <hr>
      <h3>W-2 breakdown</h3>
      <ul class="list">
        <li>Federal income tax: ${TAX.money(w2Fed)}</li>
        <li>Employee FICA: ${TAX.money(w2Fica)}</li>
        <li>State tax (est.): ${TAX.money(w2State)}</li>
      </ul>

      <h3>1099 breakdown</h3>
      <ul class="list">
        <li>Net profit: ${TAX.money(cProfit)}</li>
        <li>Self-employment tax: ${TAX.money(se.total)} (half deductible: ${TAX.money(se.halfDeduction)})</li>
        <li>Federal income tax: ${TAX.money(cFed)}</li>
        <li>State tax (est.): ${TAX.money(cState)}</li>
      </ul>

      <p class="muted">Estimate only. Real outcomes depend on credits, deductions (QBI), retirement contributions, benefits value, and state rules.</p>
    `;
  }

  function reset() {
    ["w2Gross","w2Pretax","cGross","cExp","stateRate"].forEach(id => $(id).value = "");
    $("filing").value = "single";
    $("ssYear").value = "2025";
    $("out").classList.add("muted");
    $("out").textContent = "Enter your numbers and click Calculate.";
  }

  $("calcBtn").addEventListener("click", calc);
  $("resetBtn").addEventListener("click", reset);
})();
