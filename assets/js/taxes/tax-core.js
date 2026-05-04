/* TheDailyo Tax Core (TY 2025 focus)
   - Federal brackets: IRS Rev. Proc. 2024-40
   - Standard deduction (TY 2025 under OBBB): IRS Newsroom (Oct 9, 2025)
   - SS wage base: SSA "Contribution and Benefit Base"
*/

(function () {
  const TAX = {};

  // ---------- helpers ----------
  function n(x) {
    const v = Number(String(x ?? "").replace(/,/g, "").trim());
    return Number.isFinite(v) ? v : 0;
  }
  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }
  function money(v) {
    const x = Number(v) || 0;
    return x.toLocaleString(undefined, { style: "currency", currency: "USD" });
  }
  function pct(v) {
    const x = Number(v) || 0;
    return (x * 100).toFixed(2) + "%";
  }

  // ---------- constants ----------
  // Standard deduction: TY 2025 Under OBBB (IRS newsroom)
  // Single + MFS: 15,750; MFJ: 31,500; HOH: 23,625
  TAX.standardDeduction2025 = {
    single: 15750,
    mfs: 15750,
    mfj: 31500,
    hoh: 23625,
  };

  // Federal brackets (TY 2025) – thresholds and rates, per IRS Rev. Proc. 2024-40
  // Brackets are arrays of [cap, rate] with final cap = Infinity.
  TAX.brackets2025 = {
    // Married filing jointly / surviving spouse
    mfj: [
      [23850, 0.10],
      [96950, 0.12],
      [206700, 0.22],
      [394600, 0.24],
      [501050, 0.32],
      [751600, 0.35],
      [Infinity, 0.37],
    ],
    // Head of household
    hoh: [
      [17000, 0.10],
      [64850, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250500, 0.32],
      [626350, 0.35],
      [Infinity, 0.37],
    ],
    // Single
    single: [
      [11925, 0.10],
      [48475, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250525, 0.32],
      [626350, 0.35],
      [Infinity, 0.37],
    ],
    // Married filing separately
    mfs: [
      [11925, 0.10],
      [48475, 0.12],
      [103350, 0.22],
      [197300, 0.24],
      [250525, 0.32],
      [375800, 0.35],
      [Infinity, 0.37],
    ],
  };

  // Social Security wage base (SSA). Include TY 2025 + TY 2026 options.
  TAX.ssWageBase = {
    "2025": 176100,
    "2026": 184500,
  };

  // FICA rates
  TAX.ssRateEmployee = 0.062;
  TAX.medicareRate = 0.0145;
  TAX.addlMedicareRate = 0.009;

  // Additional Medicare threshold (common IRS rule-of-thumb)
  TAX.addlMedicareThreshold = {
    single: 200000,
    hoh: 200000,
    mfj: 250000,
    mfs: 125000,
  };

  // Self-employment tax parameters
  TAX.seNetEarningsFactor = 0.9235; // 92.35% of net profit
  TAX.seSsRate = 0.124; // SS portion
  TAX.seMedRate = 0.029; // Medicare portion

  // ---------- calculators ----------
  TAX.computeFederalIncomeTax2025 = function (taxableIncome, filingStatus) {
    const status = (filingStatus || "single").toLowerCase();
    const brackets = TAX.brackets2025[status] || TAX.brackets2025.single;

    let remaining = Math.max(0, n(taxableIncome));
    let lastCap = 0;
    let tax = 0;

    for (const [cap, rate] of brackets) {
      const bandCap = cap === Infinity ? Infinity : cap;
      const band = bandCap === Infinity ? remaining : Math.max(0, Math.min(remaining, bandCap - lastCap));
      if (band <= 0) break;
      tax += band * rate;
      remaining -= band;
      lastCap = bandCap;
      if (remaining <= 0) break;
    }

    return tax;
  };

  TAX.findMarginalRate2025 = function (taxableIncome, filingStatus) {
    const status = (filingStatus || "single").toLowerCase();
    const brackets = TAX.brackets2025[status] || TAX.brackets2025.single;
    const ti = Math.max(0, n(taxableIncome));

    let lastCap = 0;
    for (const [cap, rate] of brackets) {
      if (ti <= cap) return { rate, bandStart: lastCap, bandEnd: cap };
      lastCap = cap;
    }
    return { rate: 0, bandStart: 0, bandEnd: Infinity };
  };

  TAX.computeEmployeeFICA = function (wages, filingStatus, wageBaseYear) {
    const w = Math.max(0, n(wages));
    const y = String(wageBaseYear || "2025");
    const ssBase = TAX.ssWageBase[y] ?? TAX.ssWageBase["2025"];

    const ssTax = Math.min(w, ssBase) * TAX.ssRateEmployee;
    const medicare = w * TAX.medicareRate;

    const thresh = TAX.addlMedicareThreshold[(filingStatus || "single").toLowerCase()] ?? 200000;
    const addl = Math.max(0, w - thresh) * TAX.addlMedicareRate;

    return { ssTax, medicare, addl, total: ssTax + medicare + addl, ssBase };
  };

  TAX.computeSelfEmploymentTax = function (netProfit, wageBaseYear) {
    const profit = Math.max(0, n(netProfit));
    const y = String(wageBaseYear || "2025");
    const ssBase = TAX.ssWageBase[y] ?? TAX.ssWageBase["2025"];

    const netEarnings = profit * TAX.seNetEarningsFactor;
    const ssTax = Math.min(netEarnings, ssBase) * TAX.seSsRate;
    const medTax = netEarnings * TAX.seMedRate;
    const total = ssTax + medTax;

    // Deductible portion (half of SE tax)
    const halfDeduction = total * 0.5;

    return { netEarnings, ssTax, medTax, total, halfDeduction, ssBase };
  };

  TAX.computeTakeHome = function (opts) {
    const gross = Math.max(0, n(opts.gross));
    const filing = (opts.filingStatus || "single").toLowerCase();
    const year = String(opts.wageBaseYear || "2025");

    const pretax = Math.max(0, n(opts.pretaxDeductions));
    const otherPostTax = Math.max(0, n(opts.otherPostTaxDeductions));
    const stateRate = clamp(n(opts.stateRate) / 100, 0, 0.30); // simple
    const localRate = clamp(n(opts.localRate) / 100, 0, 0.30);

    const std = TAX.standardDeduction2025[filing] ?? TAX.standardDeduction2025.single;

    const taxableIncome = Math.max(0, gross - pretax - std);
    const fedIncomeTax = TAX.computeFederalIncomeTax2025(taxableIncome, filing);

    const fica = TAX.computeEmployeeFICA(gross - pretax, filing, year); // SS/Med apply to wages, generally pretax reduces taxable wages for some plans; this is a simplification.
    const stateTax = (gross - pretax) * stateRate;
    const localTax = (gross - pretax) * localRate;

    const netAnnual = Math.max(
      0,
      gross - pretax - fedIncomeTax - fica.total - stateTax - localTax - otherPostTax
    );

    return {
      gross,
      pretax,
      std,
      taxableIncome,
      fedIncomeTax,
      fica,
      stateTax,
      localTax,
      otherPostTax,
      netAnnual,
      effectiveTotalTaxRate: gross > 0 ? (fedIncomeTax + fica.total + stateTax + localTax) / gross : 0,
    };
  };

  // Expose globally
  window.TDY_TAX = Object.assign(
    TAX,
    { n, money, pct, clamp }
  );
})();
