(function () {
  const fmtUSD = (n) =>
    isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "—";

  function el(tag, attrs = {}, html = "") {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "style") n.setAttribute("style", v);
      else n.setAttribute(k, v);
    });
    if (html) n.innerHTML = html;
    return n;
  }

  async function init() {
    if (!window.CALCULATOR_CONFIG) return;

    const { json, mount } = window.CALCULATOR_CONFIG;
    const root = document.querySelector(mount);
    if (!root) return;

    const res = await fetch(json, { cache: "no-store" });
    if (!res.ok) throw new Error("Missing calculator JSON");
    const config = await res.json();

    renderCalculator(root, config);
  }

  function renderCalculator(root, config) {
    // Keep your panel look, but clean interior layout
    root.innerHTML = `
      <h2 style="font-size:1.15rem;font-weight:900;margin-bottom:10px;">
        ${config.title || "Calculator"}
      </h2>

      <div class="calculator" style="margin-top:8px;">
        <div id="calcInputs"></div>

        <div class="actions" style="margin-top:14px;">
          <button id="runCalc" type="button" class="btn btn-primary">Calculate</button>
          <button id="resetCalc" type="button" class="btn btn-ghost">Reset</button>
        </div>

        <div id="calcWarn" class="warn" style="display:none;"></div>

        <div id="calcResults" style="margin-top:18px;"></div>
      </div>
    `;

    const inputsWrap = document.getElementById("calcInputs");
    const state = buildInputs(inputsWrap, config);

    document.getElementById("runCalc").addEventListener("click", () => {
      runAvalanche(config, state);
    });

    document.getElementById("resetCalc").addEventListener("click", () => {
      resetToDefaults(config, state);
      runAvalanche(config, state);
    });

    // Auto-run once
    runAvalanche(config, state);
  }

  function buildInputs(wrap, config) {
    const state = {
      monthlyBudgetEl: null,
      debtsWrapEl: null,
      debtRows: []
    };

    // Monthly budget (currency)
    const mb = (config.inputs || []).find((i) => i.key === "monthlyBudget");
    const mbDefault = mb?.default ?? 500;

    const mbField = el("div", { class: "field" });
    mbField.appendChild(el("label", { for: "monthlyBudget" }, mb?.label || "Total Monthly Payment Budget"));
    const mbInput = el("input", {
      id: "monthlyBudget",
      type: "number",
      min: "0",
      step: "0.01",
      value: String(mbDefault),
      inputmode: "decimal"
    });
    mbField.appendChild(mbInput);
    if (mb?.help) mbField.appendChild(el("div", { class: "help-text" }, mb.help));
    wrap.appendChild(mbField);

    state.monthlyBudgetEl = mbInput;

    // Debts list
    const dl = (config.inputs || []).find((i) => i.type === "debtList");
    const dlDefaults = dl?.defaultItems || [
      { name: "Card A", balance: 3200, apr: 24.99, minPayment: 85 },
      { name: "Card B", balance: 1800, apr: 18.99, minPayment: 55 }
    ];

    const debtsSection = el("div", { style: "margin-top:14px;" });
    debtsSection.appendChild(el("h3", { style: "font-size:1.02rem;font-weight:900;margin-bottom:8px;" }, dl?.label || "Debts"));
    debtsSection.appendChild(
      el(
        "div",
        { class: "help-text", style: "margin-top:0;" },
        "Add each debt with its balance, APR, and minimum payment. Extra budget goes to the highest APR first."
      )
    );

    const debtsWrap = el("div", { id: "debtRows", style: "margin-top:10px; display:flex; flex-direction:column; gap:12px;" });
    debtsSection.appendChild(debtsWrap);

    const btnRow = el("div", { class: "actions", style: "margin-top:10px;" });
    const addBtn = el("button", { type: "button", class: "btn btn-ghost", id: "addDebtBtn" }, "Add debt");
    btnRow.appendChild(addBtn);
    debtsSection.appendChild(btnRow);

    wrap.appendChild(debtsSection);

    state.debtsWrapEl = debtsWrap;

    // Seed defaults
    dlDefaults.forEach((d) => addDebtRow(state, d));

    addBtn.addEventListener("click", () => {
      addDebtRow(state, { name: "Debt", balance: 0, apr: 0, minPayment: 0 });
    });

    return state;
  }

  function addDebtRow(state, debt) {
    const row = el("div", {
      class: "panel",
      style: "padding:14px;"
    });

    // Header row: title + remove
    const top = el("div", { style: "display:flex; align-items:center; justify-content:space-between; gap:10px;" });
    const title = el("div", { style: "font-weight:900; color: var(--text-main);" }, debt.name || "Debt");
    const removeBtn = el("button", { type: "button", class: "btn btn-ghost", style: "padding:8px 12px;" }, "Remove");
    top.appendChild(title);
    top.appendChild(removeBtn);
    row.appendChild(top);

    // Grid of labeled inputs
    const grid = el("div", { class: "calc-grid", style: "margin-top:10px;" });

    const nameField = labeledInput("Name", "text", debt.name ?? "");
    const balField = labeledInput("Balance ($)", "number", debt.balance ?? 0, { min: "0", step: "0.01", inputmode: "decimal" });
    const aprField = labeledInput("APR (%)", "number", debt.apr ?? 0, { min: "0", step: "0.01", inputmode: "decimal" });
    const minField = labeledInput("Min payment ($)", "number", debt.minPayment ?? 0, { min: "0", step: "0.01", inputmode: "decimal" });

    grid.appendChild(nameField.wrap);
    grid.appendChild(balField.wrap);
    grid.appendChild(aprField.wrap);
    grid.appendChild(minField.wrap);

    row.appendChild(grid);

    // Keep title synced with Name
    nameField.input.addEventListener("input", () => {
      title.textContent = nameField.input.value.trim() || "Debt";
    });

    removeBtn.addEventListener("click", () => {
      // prevent removing last remaining
      if (state.debtRows.length <= 1) return;

      row.remove();
      state.debtRows = state.debtRows.filter((r) => r.row !== row);
    });

    state.debtsWrapEl.appendChild(row);
    state.debtRows.push({
      row,
      nameEl: nameField.input,
      balanceEl: balField.input,
      aprEl: aprField.input,
      minEl: minField.input
    });
  }

  function labeledInput(labelText, type, value, extraAttrs = {}) {
    const wrap = el("div", { class: "field" });
    const label = el("label", {}, labelText);
    const input = el("input", { type, value: String(value ?? ""), ...extraAttrs });
    wrap.appendChild(label);
    wrap.appendChild(input);
    return { wrap, input };
  }

  function setWarn(msg) {
    const w = document.getElementById("calcWarn");
    if (!w) return;
    if (!msg) {
      w.style.display = "none";
      w.textContent = "";
      return;
    }
    w.textContent = msg;
    w.style.display = "block";
  }

  function resetToDefaults(config, state) {
    const mb = (config.inputs || []).find((i) => i.key === "monthlyBudget");
    state.monthlyBudgetEl.value = String(mb?.default ?? 500);

    // Clear all rows and re-seed defaults
    state.debtsWrapEl.innerHTML = "";
    state.debtRows = [];

    const dl = (config.inputs || []).find((i) => i.type === "debtList");
    const dlDefaults = dl?.defaultItems || [
      { name: "Card A", balance: 3200, apr: 24.99, minPayment: 85 },
      { name: "Card B", balance: 1800, apr: 18.99, minPayment: 55 }
    ];
    dlDefaults.forEach((d) => addDebtRow(state, d));

    setWarn("");
    document.getElementById("calcResults").innerHTML = "";
  }

  function runAvalanche(config, state) {
    setWarn("");

    const budget = Number(state.monthlyBudgetEl.value || 0);
    if (!(budget > 0)) {
      setWarn("Enter a total monthly payment budget greater than 0.");
      return;
    }

    const debts = state.debtRows
      .map((r) => {
        const name = (r.nameEl.value || "").trim() || "Debt";
        const balance = Number(r.balanceEl.value || 0);
        const aprPct = Number(r.aprEl.value || 0);
        const minPayment = Number(r.minEl.value || 0);

        return {
          name,
          balance: Math.max(0, balance),
          aprPct: Math.max(0, aprPct),
          minPayment: Math.max(0, minPayment)
        };
      })
      .filter((d) => d.balance > 0 || d.minPayment > 0 || d.aprPct > 0);

    if (debts.length === 0) {
      setWarn("Add at least one debt with a balance.");
      return;
    }

    const sumMins = debts.reduce((s, d) => s + d.minPayment, 0);
    if (sumMins <= 0) {
      setWarn("Minimum payments must be greater than 0 to calculate a payoff plan.");
      return;
    }
    if (budget < sumMins) {
      setWarn(`Your budget (${fmtUSD(budget)}) is less than your total minimum payments (${fmtUSD(sumMins)}). Increase budget.`);
      return;
    }

    // Simulation
    const maxMonths = 1200;
    let months = 0;
    let totalInterest = 0;

    // Work copy
    const work = debts.map((d) => ({
      name: d.name,
      bal: d.balance,
      r: (d.aprPct / 100) / 12,
      min: d.minPayment
    }));

    while (work.some((d) => d.bal > 0.005) && months < maxMonths) {
      months++;

      // Interest accrues monthly
      for (const d of work) {
        if (d.bal <= 0) continue;
        const interest = d.bal * d.r;
        totalInterest += interest;
        d.bal += interest;
      }

      // Pay minimums first
      for (const d of work) {
        if (d.bal <= 0) continue;
        const pay = Math.min(d.bal, d.min);
        d.bal -= pay;
      }

      // Apply remaining budget to highest APR debt (avalanche)
      let extra = budget - sumMins;
      while (extra > 0.0001) {
        const target = work
          .filter((d) => d.bal > 0.005)
          .sort((a, b) => b.r - a.r)[0];

        if (!target) break;

        const pay = Math.min(extra, target.bal);
        target.bal -= pay;
        extra -= pay;
      }
    }

    const results = document.getElementById("calcResults");
    const paidOff = !work.some((d) => d.bal > 0.005);

    results.innerHTML = `
      <div class="result">
        <h3>Summary</h3>
        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi-label">Months to debt-free</div>
            <div class="kpi-value">${paidOff ? months.toLocaleString() : `${maxMonths.toLocaleString()}+`}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Total interest (estimate)</div>
            <div class="kpi-value">${fmtUSD(totalInterest)}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Monthly payment budget</div>
            <div class="kpi-value">${fmtUSD(budget)}</div>
          </div>
          <div class="kpi">
            <div class="kpi-label">Total minimum payments</div>
            <div class="kpi-value">${fmtUSD(sumMins)}</div>
          </div>
        </div>
        ${paidOff ? "" : `<div class="small-note">Note: schedule is capped at ${maxMonths} months. Increase budget to reach payoff sooner.</div>`}
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch(() => {
      const root = document.querySelector(window.CALCULATOR_CONFIG?.mount || "#app");
      if (root) {
        root.innerHTML = `
          <div class="note">
            Calculator failed to load. Make sure the JSON exists and /assets/js/calculator-engine.js is accessible.
          </div>
        `;
      }
    });
  });
})();