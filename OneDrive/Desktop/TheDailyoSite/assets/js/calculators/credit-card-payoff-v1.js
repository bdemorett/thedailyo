(function () {
  const money = (n) => isFinite(n) ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—";

  function monthsToText(m) {
    if (!isFinite(m)) return "—";
    const y = Math.floor(m / 12), mo = m % 12;
    if (y <= 0) return `${mo} month${mo === 1 ? "" : "s"}`;
    if (mo === 0) return `${y} year${y === 1 ? "" : "s"}`;
    return `${y} year${y === 1 ? "" : "s"} ${mo} month${mo === 1 ? "" : "s"}`;
  }

  function simulatePayoff(balance, aprPct, payment, extra, maxMonths) {
    const r = (aprPct / 100) / 12;
    let b = balance;
    let totalInterest = 0;
    let totalPaid = 0;
    const rows = [];

    for (let month = 1; month <= maxMonths; month++) {
      const interest = b * r;
      const pay = Math.min(b + interest, payment + extra);
      const principal = Math.max(0, pay - interest);
      const newBal = Math.max(0, b + interest - pay);

      totalInterest += interest;
      totalPaid += pay;
      rows.push({ month, payment: pay, interest, principal, balance: newBal });

      b = newBal;
      if (b <= 0.000001) {
        return { months: month, totalInterest, totalPaid, finalPayment: pay, rows };
      }
    }
    return { months: Infinity, totalInterest, totalPaid, finalPayment: NaN, rows };
  }

  window.initCreditCardPayoffV1 = function initCreditCardPayoffV1(mountId, cfg) {
    const mount = document.getElementById(mountId);
    const defaults = (cfg && cfg.defaults) || { balance: 5000, apr: 24.99, payment: 200, extra: 0 };
    const maxMonths = (cfg && cfg.maxMonths) || 600;

    mount.innerHTML = `
      <div class="form-grid">
        <div>
          <label for="balance">Balance ($)</label>
          <input id="balance" type="number" min="0" step="0.01" value="${defaults.balance}" inputmode="decimal" />
        </div>
        <div>
          <label for="apr">APR (%)</label>
          <input id="apr" type="number" min="0" step="0.01" value="${defaults.apr}" inputmode="decimal" />
        </div>
        <div>
          <label for="payment">Monthly payment ($)</label>
          <input id="payment" type="number" min="0" step="0.01" value="${defaults.payment}" inputmode="decimal" />
        </div>
        <div>
          <label for="extra">Extra payment ($)<span class="hint">(optional)</span></label>
          <input id="extra" type="number" min="0" step="0.01" value="${defaults.extra}" inputmode="decimal" />
        </div>
      </div>

      <div class="actions">
        <button class="btn-primary" id="calcBtn" type="button">Calculate</button>
        <button class="btn-ghost" id="resetBtn" type="button">Reset</button>
        <button class="btn-ghost" id="toggleBtn" type="button">Show schedule</button>
      </div>

      <div class="warn" id="warn" aria-live="polite"></div>

      <div class="result" id="result" style="display:none;">
        <h3>Results</h3>

        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Payoff time</div><div class="kpi-value" id="payoffTime">—</div></div>
          <div class="kpi"><div class="kpi-label">Total interest paid</div><div class="kpi-value" id="totalInterest">—</div></div>
          <div class="kpi"><div class="kpi-label">Total paid</div><div class="kpi-value" id="totalPaid">—</div></div>
          <div class="kpi"><div class="kpi-label">Final month payment</div><div class="kpi-value" id="finalPayment">—</div></div>
        </div>

        <div class="table-wrap" id="tableWrap" style="display:none;">
          <table aria-label="Payoff schedule">
            <thead>
              <tr>
                <th>Month</th><th>Payment</th><th>Interest</th><th>Principal</th><th>Balance</th>
              </tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>
        </div>

        <div class="note note-inline">Tip: try +$25 / +$50 / +$100 extra and compare the payoff timeline + interest.</div>
      </div>
    `;

    const el = (id) => document.getElementById(id);

    function setWarn(msg) {
      const w = el("warn");
      if (!msg) { w.style.display = "none"; w.textContent = ""; return; }
      w.textContent = msg;
      w.style.display = "block";
    }

    function renderTable(rows) {
      const tbody = el("tbody");
      tbody.innerHTML = "";
      for (const r of rows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${r.month}</td>
          <td>${money(r.payment)}</td>
          <td>${money(r.interest)}</td>
          <td>${money(r.principal)}</td>
          <td>${money(r.balance)}</td>
        `;
        tbody.appendChild(tr);
      }
    }

    let tableVisible = false;

    function calculate() {
      const balance = Number(el("balance").value);
      const apr = Number(el("apr").value);
      const payment = Number(el("payment").value);
      const extra = Number(el("extra").value);

      setWarn("");

      if (!(balance > 0)) return setWarn("Enter a balance greater than 0.");
      if (!(apr >= 0)) return setWarn("APR must be 0 or higher.");
      if (!(payment > 0)) return setWarn("Monthly payment must be greater than 0.");
      if (!(extra >= 0)) return setWarn("Extra payment must be 0 or higher.");

      const monthlyRate = (apr / 100) / 12;
      const firstMonthInterest = balance * monthlyRate;

      if (apr > 0 && (payment + extra) <= firstMonthInterest) {
        setWarn("Your payment may barely cover interest, so the balance won’t drop much. Increase payment or add extra to model a payoff plan.");
      }

      const res = simulatePayoff(balance, apr, payment, extra, maxMonths);

      el("result").style.display = "block";
      el("payoffTime").textContent = (res.months === Infinity) ? "Not paid off (payment too low)" : monthsToText(res.months);
      el("totalInterest").textContent = money(res.totalInterest);
      el("totalPaid").textContent = money(res.totalPaid);
      el("finalPayment").textContent = money(res.finalPayment);

      if (tableVisible) {
        el("tableWrap").style.display = "block";
        renderTable(res.rows);
      } else {
        el("tableWrap").style.display = "none";
      }
    }

    el("calcBtn").addEventListener("click", calculate);
    el("resetBtn").addEventListener("click", () => {
      el("balance").value = defaults.balance;
      el("apr").value = defaults.apr;
      el("payment").value = defaults.payment;
      el("extra").value = defaults.extra;
      el("result").style.display = "none";
      el("tableWrap").style.display = "none";
      tableVisible = false;
      el("toggleBtn").textContent = "Show schedule";
      setWarn("");
    });
    el("toggleBtn").addEventListener("click", () => {
      tableVisible = !tableVisible;
      el("toggleBtn").textContent = tableVisible ? "Hide schedule" : "Show schedule";
      if (el("result").style.display !== "none") calculate();
    });

    calculate();
  };
})();
