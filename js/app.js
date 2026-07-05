(function () {
  const STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir",
    "Ladakh", "Puducherry", "Chandigarh",
  ];

  const INCOME_BRACKETS = [
    { key: "under1L", maxIncome: 100000, labelKey: "incomeUnder1L" },
    { key: "1to2_5L", maxIncome: 250000, labelKey: "income1to2_5L" },
    { key: "2_5to5L", maxIncome: 500000, labelKey: "income2_5to5L" },
    { key: "5to8L", maxIncome: 800000, labelKey: "income5to8L" },
    { key: "8Lplus", maxIncome: Infinity, labelKey: "income8LPlus" },
  ];

  const OCCUPATION_CHIPS = [
    { key: "farmer", labelKey: "occFarmer" },
    { key: "student", labelKey: "occStudent" },
    { key: "self_employed", labelKey: "occSelfEmployed" },
    { key: "salaried", labelKey: "occSalaried" },
    { key: "daily_wage", labelKey: "occDailyWage" },
    { key: "homemaker", labelKey: "occHomemaker" },
    { key: "unemployed", labelKey: "occUnemployed" },
    { key: "retired", labelKey: "occRetired" },
  ];

  const LIFE_FLAGS = [
    { key: "farmland", labelKey: "flagFarmland" },
    { key: "newMother", labelKey: "flagNewMother" },
    { key: "girlChild", labelKey: "flagGirlChild" },
    { key: "senior", labelKey: "flagSenior", auto: true },
    { key: "disabled", labelKey: "flagDisability" },
    { key: "widow", labelKey: "flagWidow" },
    { key: "streetVendor", labelKey: "flagStreetVendor" },
    { key: "artisan", labelKey: "flagArtisan" },
    { key: "unorganisedWorker", labelKey: "flagUnorganised" },
  ];

  const RESULTS_PAGE_SIZE = 4;
  const SAVED_KEY = "haqdaar_saved_schemes";

  const state = {
    lang: "hi",
    age: null,
    stateName: "",
    incomeBracketKey: null,
    incomeMax: null,
    occupation: null,
    flags: {
      farmland: false, newMother: false, girlChild: false, senior: false,
      disabled: false, widow: false, streetVendor: false, artisan: false,
      unorganisedWorker: false,
    },
    matches: [],
    resultsExpanded: false,
    selectedSchemeId: null,
  };

  function t(key, ...args) {
    const dict = I18N[state.lang] || I18N.en;
    const val = dict[key] !== undefined ? dict[key] : I18N.en[key];
    return typeof val === "function" ? val(...args) : val;
  }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.documentElement.lang = state.lang;
    document.querySelectorAll(".lang-chip").forEach((btn) => {
      const lang = btn.dataset.lang;
      btn.textContent = t(lang === "hi" ? "langHindi" : lang === "en" ? "langEnglish" : "langMarathi");
      btn.classList.toggle("selected", state.lang === lang);
    });
    const stateSelect = document.getElementById("stateInput");
    if (stateSelect.options.length) stateSelect.options[0].textContent = t("statePlaceholder");
    renderIncomeChips();
    renderOccupationChips();
    renderSituationChips();
    if (document.getElementById("screen-results").classList.contains("active")) renderResults();
    if (document.getElementById("screen-detail").classList.contains("active") && state.selectedSchemeId) {
      renderDetail(state.selectedSchemeId);
    }
  }

  function showScreen(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo(0, 0);
  }

  function populateStates() {
    const select = document.getElementById("stateInput");
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = t("statePlaceholder");
    select.appendChild(placeholder);
    STATES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      select.appendChild(opt);
    });
  }

  function renderIncomeChips() {
    const row = document.getElementById("incomeChips");
    row.innerHTML = "";
    INCOME_BRACKETS.forEach((bracket) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (state.incomeBracketKey === bracket.key ? " selected" : "");
      btn.textContent = t(bracket.labelKey);
      btn.addEventListener("click", () => {
        state.incomeBracketKey = bracket.key;
        state.incomeMax = bracket.maxIncome;
        renderIncomeChips();
      });
      row.appendChild(btn);
    });
  }

  function renderOccupationChips() {
    const row = document.getElementById("occupationChips");
    row.innerHTML = "";
    OCCUPATION_CHIPS.forEach((occ) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (state.occupation === occ.key ? " selected" : "");
      btn.textContent = t(occ.labelKey);
      btn.addEventListener("click", () => {
        state.occupation = occ.key;
        renderOccupationChips();
      });
      row.appendChild(btn);
    });
  }

  function renderSituationChips() {
    const row = document.getElementById("situationChips");
    row.innerHTML = "";
    LIFE_FLAGS.forEach((flag) => {
      if (flag.auto) {
        state.flags.senior = state.age != null && state.age >= 60;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip" + (state.flags[flag.key] ? " flag-selected" : "");
      btn.textContent = t(flag.labelKey);
      if (flag.auto) {
        btn.disabled = true;
        btn.title = "Automatically set from your age";
      } else {
        btn.addEventListener("click", () => {
          state.flags[flag.key] = !state.flags[flag.key];
          renderSituationChips();
        });
      }
      row.appendChild(btn);
    });
  }

  function formatRupees(value) {
    if (value >= 100000) {
      const lakhs = value / 100000;
      return `Rs ${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1)} Lakh`;
    }
    return `Rs ${value.toLocaleString("en-IN")}`;
  }

  function getSavedIds() {
    try {
      return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function toggleSaved(id) {
    const saved = new Set(getSavedIds());
    if (saved.has(id)) saved.delete(id);
    else saved.add(id);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
    return saved.has(id);
  }

  function computeMatches() {
    const profile = {
      age: state.age,
      incomeMax: state.incomeMax,
      occupation: state.occupation,
      flags: state.flags,
    };
    state.matches = findMatches(profile, SCHEMES);
    state.resultsExpanded = false;
  }

  function renderResults() {
    const countEl = document.getElementById("resultsCount");
    const amountEl = document.getElementById("resultsAmount");
    const listEl = document.getElementById("schemeList");
    const moreBtn = document.getElementById("moreSchemesBtn");

    const matches = state.matches;
    countEl.textContent = t("resultsEligibleFor", matches.length);

    if (matches.length === 0) {
      amountEl.textContent = "";
      listEl.innerHTML = `<p class="no-matches">${t("noMatches")}</p>`;
      moreBtn.hidden = true;
      return;
    }

    const topValue = Math.max(...matches.map((m) => m.benefitValue));
    amountEl.textContent = t("resultsUpTo", formatRupees(topValue));

    const visibleCount = state.resultsExpanded ? matches.length : Math.min(RESULTS_PAGE_SIZE, matches.length);
    listEl.innerHTML = "";
    matches.slice(0, visibleCount).forEach((scheme) => {
      const card = document.createElement("div");
      card.className = "scheme-card";
      card.innerHTML = `
        <div class="scheme-card-top">
          <h3>${scheme.name}</h3>
          <span class="scheme-benefit">${scheme.benefitLabel}</span>
        </div>
        <p class="scheme-desc">${scheme.description}</p>
        <span class="eligible-tag">${t("eligibleTag")}</span>
      `;
      card.addEventListener("click", () => {
        state.selectedSchemeId = scheme.id;
        renderDetail(scheme.id);
        showScreen("screen-detail");
      });
      listEl.appendChild(card);
    });

    const remaining = matches.length - visibleCount;
    if (remaining > 0) {
      moreBtn.hidden = false;
      moreBtn.textContent = t("moreSchemes", remaining);
      moreBtn.onclick = () => {
        state.resultsExpanded = true;
        renderResults();
      };
    } else {
      moreBtn.hidden = true;
    }
  }

  function renderDetail(schemeId) {
    const scheme = state.matches.find((m) => m.id === schemeId) || SCHEMES.find((s) => s.id === schemeId);
    if (!scheme) return;

    document.getElementById("detailName").textContent = scheme.name;
    document.getElementById("detailBenefit").textContent = scheme.benefitLabel;
    document.getElementById("detailWhy").textContent =
      scheme.whyYouQualify || (state.matches.find((m) => m.id === schemeId) || {}).whyYouQualify || "";
    document.getElementById("detailDocuments").textContent = scheme.documents.join(" · ");

    const stepsEl = document.getElementById("detailSteps");
    stepsEl.innerHTML = "";
    scheme.applySteps.forEach((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      stepsEl.appendChild(li);
    });

    document.getElementById("detailMeta").textContent = `${scheme.difficulty} · ${scheme.timeEstimate}`;

    const applyBtn = document.getElementById("applyNowBtn");
    applyBtn.href = scheme.applyUrl;
    applyBtn.textContent = t("applyNow");

    const saveBtn = document.getElementById("saveBtn");
    const isSaved = getSavedIds().includes(scheme.id);
    saveBtn.textContent = t("save");
    saveBtn.classList.toggle("saved", isSaved);
    saveBtn.onclick = () => {
      const nowSaved = toggleSaved(scheme.id);
      saveBtn.classList.toggle("saved", nowSaved);
    };
  }

  function init() {
    populateStates();
    applyTranslations();

    document.querySelectorAll(".lang-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lang = btn.dataset.lang;
        applyTranslations();
      });
    });

    document.getElementById("startBtn").addEventListener("click", () => showScreen("screen-profile"));

    document.getElementById("ageInput").addEventListener("input", (e) => {
      state.age = e.target.value ? parseInt(e.target.value, 10) : null;
    });

    document.getElementById("stateInput").addEventListener("change", (e) => {
      state.stateName = e.target.value;
    });

    document.getElementById("toStep3Btn").addEventListener("click", () => {
      if (state.age == null || !state.stateName || !state.incomeBracketKey || !state.occupation) {
        alert(t("fillAllFields"));
        return;
      }
      renderSituationChips();
      showScreen("screen-situation");
    });

    document.getElementById("seeSchemesBtn").addEventListener("click", () => {
      computeMatches();
      renderResults();
      showScreen("screen-results");
    });

    document.getElementById("startOverLink").addEventListener("click", (e) => {
      e.preventDefault();
      showScreen("screen-welcome");
    });

    document.querySelectorAll(".back-chevron").forEach((btn) => {
      btn.addEventListener("click", () => showScreen(btn.dataset.back));
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
