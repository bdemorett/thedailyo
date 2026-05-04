/* =========================
FILE: /assets/js/calculators/debt-payoff-v1.js
Exports:
  window.initDebtPayoffV1(mountId, config)

Renders:
- Monthly budget input
- Debt list editor (name, balance, APR, min payment)
- Calculates snowball/avalanche payoff
- Shows KPIs + payoff schedule table

Uses main.css classes:
- .field, .actions, .btn-primary, .btn-ghost
- .kpi-grid, .kpi, .table-wrap
========================= */

(function () {
  "use strict";

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    });
    return node;
  };

  const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

  const fmtCurrency = (n) =>
    Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

  const parseMoney = (v) => {
    const cleaned = String(v ?? "").replace(/[^0-9.\-]/g, "");
    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  };

  const parsePercent = (v) => {
    const cleaned = String(v ?? "").replace(/[^0-9.\-]/g, "");
    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  };

  const addMonths = (date, months) => {
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < day) d.setDate(0);
    return d;
  };

  const monthLabel = (date) =>
    date.toLocaleString(undefined, { month: "short", year: "numeric" });

  function normalizeDebts(debts) {
    return (debts || [])
      .map((x) => ({
        name: String(x.name || "Debt").trim() || "Debt",
        balance: round2(Number(x.balance || 0)),
        apr: Number(x.apr || 0),
        minPayment: round2(Number(x.minPayment || 0))
      }))
      .filter((d) => d.balance > 0 && d.apr >= 0 && d.minPayment >= 0);
  }

  function pickTarget(debts, method) {
    let best = 0;

    if (method === "avalanche") {
      for (let i = 1; i < debts.length; i++) {
        const a = debts[i], b = debts[best];
        if (a.apr > b.apr) best = i;
        else if (a.apr === b.apr && a.balance > b.balance) best = i;
      }
    } else {
      for (let i = 1; i < debts.length; i++) {
        const a = debts[i], b = debts[best];
        if (a.balance < b.balance) best = i;
        else if (a.balance === b.balance && a.apr > b.apr) best = i;
      }
    }
    return best;
  }

  function simulate({ method, monthlyBudget, debts }) {
    const start = new Date();
    let state = normalizeDebts(debts).map((d) => ({ ...d }));

    if (!state.length) {
      return { monthsToDebtFree: 0, debtFreeDate: monthLabel(start), totalInterest: 0, totalPaid: 0, schedule: [] };
    }

    let budget = Number(monthlyBudget || 0);
    if (!isFinite(budget) || budget <= 0) {
      budget = state.reduce((s, d) => s + d.minPayment, 0);
    }

    const maxMonths = 600;
    let totalInterest = 0;
    let totalPaid = 0;
    const schedule = [];

    for (let m = 0; m < maxMonths; m++) {
      const active = state.filter((d) => d.balance > 0);
      if (!active.length) {
        return {
          monthsToDebtFree: m,
          debtFreeDate: monthLabel(addMonths(start, m)),
          totalInterest: round2(totalInterest),
          totalPaid: round2(totalPaid),
          schedule
        };
      }

      // interest first
      let monthInterest = 0;
      for (const d of active) {
        const r = (d.apr / 100) / 12;
        const interest = round2(d.balance * r);
        d.balance = round2(d.balance + interest);
        monthInterest = round2(monthInterest + interest);
      }

      // pay minimums (as possible)
      let remaining = round2(Math.max(0, budget));
      const payMap = new Map();

      for (const d of active) {
        if (remaining <= 0) break;
        const pay = round2(Math.min(d.minPayment, remaining, d.balance));
        payMap.set(d, pay);
        remaining = round2(remaining - pay);
      }

      // extra goes to target
      if (remaining > 0) {
        const active2 = state.filter((d) => d.balance > 0);
        const idx = pickTarget(active2, method);
        const target = active2[idx];
        const already = payMap.get(target) || 0;
        const extra = round2(Math.min(remaining, Math.max(0, target.balance - already)));
        payMap.set(target, round2(already + extra));
        remaining = round2(remaining - extra);
      }

      // apply payments
      let monthPay = 0;
      for (const d of active) {
        const pay = round2(payMap.get(d) || 0);
        if (pay > 0) {
          d.balance = round2(Math.max(0, d.balance - pay));
          monthPay = round2(monthPay + pay);
        }
      }

      totalInterest = round2(totalInterest + monthInterest);
      totalPaid = round2(totalPaid + monthPay);

      const remainingBal = round2(state.reduce((s, d) => s + Math.max(0, d.balance), 0));

      schedule.push({
        month: monthLabel(addMonths(start, m)),
        payment: monthPay,
        interest: monthInterest,
        principal: round2(Math.max(0, monthPay - monthInterest)),
        remaining: remainingBal
      });

      // Early stop if not decreasing
      if (m >= 24 && schedule.length >= 2) {
        const last = schedule[schedule.length - 1].remaining;
        const prev = schedule[schedule.length - 2].remaining;
        if (round2(last - prev) >= -0.01) {
          break;
        }
      }
    }

    return {
      monthsToDebtFree: null,
      debtFreeDate: "Not reached",
      totalInterest: round2(totalInterest),
      totalPaid: round2(totalPaid),
      schedule
    };
  }

  function render(mountId, config) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    const method = (config && config.method) || "snowball";
    const defaults = (config && config.defaultDebts) || [
      { name: "Card A", balance: 3200, apr: 24.99, minPayment: 85 },
      { name: "Card B", balance: 1800, apr: 18.99, minPayment: 55 }
    ];
    const defaultBudget = (config && config.defaultBudget) || 500;

    const wrapper = el("div", { class: "calculator" });

    // Budget input
    const budgetField = el("div", { class: "field" }, [
      el("label", {}, "Total Monthly Payment Budget"),
      el("input", { type: "text", value: fmtCurrency(defaultBudget), placeholder: "$0.00" }),
      el("div", { class: "help-text" }, "Total amount you can pay each month across all debts.")
    ]);
    const budgetInput = budgetField.querySelector("input");
    budgetInput.addEventListener("blur", () => (budgetInput.value = fmtCurrency(parseMoney(budgetInput.value))));

    // Debt table editor
    const tableWrap = el("div", { class: "table-wrap" });
    const table = el("table");
    table.appendChild(el("thead", {}, [
      el("tr", {}, [
        el("th", {}, "Name"),
        el("th", {}, "Balance"),
        el("th", {}, "APR %"),
        el("th", {}, "Min Payment"),
        el("th", {}, "")
      ])
    ]));
    const tbody = el("tbody");
    table.appendChild(tbody);
    tableWrap.appendChild(table);

    const rows = defaults.map(d => ({ ...d }));

    function makeRow(row, idx) {
      const name = el("input", { type: "text", value: row.name || "Debt" });
      const bal  = el("input", { type: "text", value: fmtCurrency(row.balance || 0) });
      const apr  = el("input", { type: "text", value: String(row.apr || 0) });
      const min  = el("input", { type: "text", value: fmtCurrency(row.minPayment || 0) });

      const sync = () => {
        row.name = name.value.trim() || "Debt";
        row.balance = parseMoney(bal.value);
        row.apr = parsePercent(apr.value);
        row.minPayment = parseMoney(min.value);
      };

      [name, bal, apr, min].forEach(i => i.addEventListener("input", sync));
      [bal, min].forEach(i => i.addEventListener("blur", () => (i.value = fmtCurrency(parseMoney(i.value)))));
      apr.addEventListener("blur", () => (apr.value = String(parsePercent(apr.value))));

      const del = el("button", { class: "btn btn-ghost", type: "button" }, "Remove");
      del.addEventListener("click", () => {
        rows.splice(idx, 1);
        renderBody();
      });

      return el("tr", {}, [
        el("td", {}, name),
        el("td", {}, bal),
        el("td", {}, apr),
        el("td", {}, min),
        el("td", {}, del)
      ]);
    }

    function renderBody() {
      tbody.innerHTML = "";
      rows.forEach((r, idx) => tbody.appendChild(makeRow(r, idx)));
    }
    renderBody();

    const addBtn = el("button", { class: "btn btn-primary", type: "button" }, "Add Debt");
    addBtn.addEventListener("click", () => {
      rows.push({ name: "New Debt", balance: 0, apr: 0, minPayment: 0 });
      renderBody();
    });

    const calcBtn = el("button", { class: "btn-primary", type: "button" }, "Calculate");
    const resetBtn = el("button", { class: "btn-ghost", type: "button" }, "Reset");

    const actions = el("div", { class: "actions" }, [calcBtn, resetBtn, addBtn]);

    // Results
    const resultBox = el("div", { class: "result" });
    const schedBox = el("div", { class: "result" });

    function renderResults(res) {
      resultBox.innerHTML = "";
      schedBox.innerHTML = "";

      // KPIs
      const kpiGrid = el("div", { class: "kpi-grid" }, [
        el("div", { class: "kpi" }, [
          el("div", { class: "kpi-label" }, "Months to Debt-Free"),
          el("div", { class: "kpi-value" }, res.monthsToDebtFree == null ? "—" : String(res.monthsToDebtFree))
        ]),
        el("div", { class: "kpi" }, [
          el("div", { class: "kpi-label" }, "Debt-Free Date"),
          el("div", { class: "kpi-value" }, res.debtFreeDate)
        ]),
        el("div", { class: "kpi" }, [
          el("div", { class: "kpi-label" }, "Total Interest Paid"),
          el("div", { class: "kpi-value" }, fmtCurrency(res.totalInterest))
        ]),
        el("div", { class: "kpi" }, [
          el("div", { class: "kpi-label" }, "Total Paid"),
          el("div", { class: "kpi-value" }, fmtCurrency(res.totalPaid))
        ])
      ]);

      resultBox.appendChild(el("h3", {}, "Results"));
      resultBox.appendChild(kpiGrid);

      if (res.monthsToDebtFree == null) {
        resultBox.appendChild(el("div", { class: "warn", style: "display:block;" },
          "Your budget may be too low to pay off these debts (or may not cover interest). Try increasing your monthly budget."
        ));
      }

      // Schedule table
      const schedule = (res.monthsToDebtFree == null) ? res.schedule.slice(0, 36) : res.schedule;

      if (schedule.length) {
        schedBox.appendChild(el("h3", {}, "Payoff Schedule"));
        const tw = el("div", { class: "table-wrap" });
        const t = el("table");
        t.appendChild(el("thead", {}, [
          el("tr", {}, [
            el("th", {}, "Month"),
            el("th", {}, "Payment"),
            el("th", {}, "Interest"),
            el("th", {}, "Principal"),
            el("th", {}, "Remaining")
          ])
        ]));
        const tb = el("tbody");
        schedule.forEach(r => {
          tb.appendChild(el("tr", {}, [
            el("td", {}, r.month),
            el("td", {}, fmtCurrency(r.payment)),
            el("td", {}, fmtCurrency(r.interest)),
            el("td", {}, fmtCurrency(r.principal)),
            el("td", {}, fmtCurrency(r.remaining))
          ]));
        });
        t.appendChild(tb);
        tw.appendChild(t);
        schedBox.appendChild(tw);
      }
    }

    function run() {
      const monthlyBudget = parseMoney(budgetInput.value);
      const debts = rows.map(r => ({
        name: r.name,
        balance: parseMoney(r.balance),
        apr: parsePercent(r.apr),
        minPayment: parseMoney(r.minPayment)
      }));
      const res = simulate({ method, monthlyBudget, debts });
      renderResults(res);
    }

    calcBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", () => window.location.reload());

    wrapper.appendChild(budgetField);
    wrapper.appendChild(tableWrap);
    wrapper.appendChild(actions);
    wrapper.appendChild(resultBox);
    wrapper.appendChild(schedBox);

    mount.innerHTML = "";
    mount.appendChild(wrapper);

    // auto-run once
    run();
  }

  // Export init
  window.initDebtPayoffV1 = function (mountId, config) {
    render(mountId, config || {});
  };
})();
