const STATE_TAX_DATA = {
  // No Income Tax States
  "AK": { type: "none" },
  "FL": { type: "none" },
  "NV": { type: "none" },
  "SD": { type: "none" },
  "TN": { type: "none" },
  "TX": { type: "none" },
  "WA": { type: "none" },
  "WY": { type: "none" },

  // Flat Tax States (Rates updated for 2026/recent baselines)
  "CO": { type: "flat", rate: 0.0440 },
  "GA": { type: "flat", rate: 0.0499 },
  "ID": { type: "flat", rate: 0.05695 },
  "IL": { type: "flat", rate: 0.0495 },
  "IN": { type: "flat", rate: 0.0295 },
  "KY": { type: "flat", rate: 0.0400 },
  "MI": { type: "flat", rate: 0.0425 },
  "MS": { type: "flat", rate: 0.0470 },
  "NC": { type: "flat", rate: 0.0399 },
  "NH": { type: "none" }, // Dividend/Interest tax fully phased out by 2026
  "OH": { type: "flat", rate: 0.0350 },
  "PA": { type: "flat", rate: 0.0307 },
  "UT": { type: "flat", rate: 0.0455 },

  // Progressive Tax States (Simplified representation using optimized blended brackets)
  "AL": { type: "progressive", brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 500, rate: 0.03 }, { threshold: 3000, rate: 0.05 }] },
  "AR": { type: "progressive", brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 5000, rate: 0.03 }, { threshold: 10000, rate: 0.044 }] },
  "AZ": { type: "flat", rate: 0.0250 }, // AZ shifted to flat recently
  "CA": { type: "progressive", brackets: [{ threshold: 0, rate: 0.01 }, { threshold: 11000, rate: 0.02 }, { threshold: 26000, rate: 0.04 }, { threshold: 41000, rate: 0.06 }, { threshold: 57000, rate: 0.08 }, { threshold: 72000, rate: 0.093 }] },
  "CT": { type: "progressive", brackets: [{ threshold: 0, rate: 0.03 }, { threshold: 10000, rate: 0.05 }, { threshold: 50000, rate: 0.055 }, { threshold: 100000, rate: 0.06 }] },
  "DE": { type: "progressive", brackets: [{ threshold: 0, rate: 0.022 }, { threshold: 5000, rate: 0.039 }, { threshold: 10000, rate: 0.048 }, { threshold: 25000, rate: 0.052 }, { threshold: 60000, rate: 0.066 }] },
  "HI": { type: "progressive", brackets: [{ threshold: 0, rate: 0.014 }, { threshold: 4800, rate: 0.032 }, { threshold: 9600, rate: 0.055 }, { threshold: 24000, rate: 0.072 }, { threshold: 48000, rate: 0.082 }, { threshold: 96000, rate: 0.092 }] },
  "IA": { type: "flat", rate: 0.0390 }, // Iowa transitioned to a flat tax flat rate by 2026
  "KS": { type: "progressive", brackets: [{ threshold: 0, rate: 0.031 }, { threshold: 15000, rate: 0.0525 }, { threshold: 30000, rate: 0.057 }] },
  "LA": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0185 }, { threshold: 12500, rate: 0.035 }, { threshold: 50000, rate: 0.0425 }] },
  "MA": { type: "flat", rate: 0.0500 }, // Standard flat rate (ignoring millionaire surtax baseline)
  "MD": { type: "progressive", brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 1000, rate: 0.03 }, { threshold: 2000, rate: 0.04 }, { threshold: 3000, rate: 0.0475 }, { threshold: 150000, rate: 0.05 }] },
  "ME": { type: "progressive", brackets: [{ threshold: 0, rate: 0.058 }, { threshold: 24500, rate: 0.0674 }, { threshold: 58050, rate: 0.0715 }] },
  "MN": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0535 }, { threshold: 31000, rate: 0.068 }, { threshold: 102000, rate: 0.0785 }] },
  "MO": { type: "progressive", brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 1000, rate: 0.03 }, { threshold: 8000, rate: 0.047 }] },
  "MT": { type: "progressive", brackets: [{ threshold: 0, rate: 0.047 }, { threshold: 20500, rate: 0.059 }] },
  "ND": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0195 }, { threshold: 44725, rate: 0.025 }] },
  "NE": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0246 }, { threshold: 3700, rate: 0.0479 }, { threshold: 22000, rate: 0.0584 }] },
  "NJ": { type: "progressive", brackets: [{ threshold: 0, rate: 0.014 }, { threshold: 20000, rate: 0.0175 }, { threshold: 35000, rate: 0.035 }, { threshold: 40000, rate: 0.0552 }, { threshold: 75000, rate: 0.0637 }] },
  "NM": { type: "progressive", brackets: [{ threshold: 0, rate: 0.017 }, { threshold: 5500, rate: 0.032 }, { threshold: 11000, rate: 0.047 }, { threshold: 16000, rate: 0.059 }] },
  "NY": { type: "progressive", brackets: [{ threshold: 0, rate: 0.04 }, { threshold: 8500, rate: 0.045 }, { threshold: 11700, rate: 0.0525 }, { threshold: 13900, rate: 0.0585 }, { threshold: 21400, rate: 0.0625 }, { threshold: 80650, rate: 0.0685 }] },
  "OK": { type: "progressive", brackets: [{ threshold: 0, rate: 0.005 }, { threshold: 1000, rate: 0.01 }, { threshold: 2500, rate: 0.02 }, { threshold: 3750, rate: 0.03 }, { threshold: 4900, rate: 0.0475 }] },
  "OR": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0475 }, { threshold: 4100, rate: 0.0675 }, { threshold: 10250, rate: 0.0875 }] },
  "RI": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0375 }, { threshold: 68200, rate: 0.0475 }, { threshold: 155050, rate: 0.0599 }] },
  "SC": { type: "progressive", brackets: [{ threshold: 0, rate: 0.03 }, { threshold: 3200, rate: 0.064 }] },
  "VA": { type: "progressive", brackets: [{ threshold: 0, rate: 0.02 }, { threshold: 3000, rate: 0.03 }, { threshold: 5000, rate: 0.05 }, { threshold: 17000, rate: 0.0575 }] },
  "VT": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0335 }, { threshold: 45400, rate: 0.066 }, { threshold: 110000, rate: 0.076 }] },
  "WI": { type: "progressive", brackets: [{ threshold: 0, rate: 0.035 }, { threshold: 15140, rate: 0.044 }, { threshold: 30280, rate: 0.053 }] },
  "WV": { type: "progressive", brackets: [{ threshold: 0, rate: 0.0236 }, { threshold: 10000, rate: 0.0315 }, { threshold: 25000, rate: 0.0354 }, { threshold: 40000, rate: 0.0472 }] }
};