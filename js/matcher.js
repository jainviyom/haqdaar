/**
 * Client-side eligibility matcher. Pure function of (profile, SCHEMES) -> ranked matches.
 * profile fields: age, incomeMax, occupation, flags: { farmland, newMother, girlChild,
 * senior, disabled, widow, streetVendor, artisan, unorganisedWorker }
 */

const FLAG_TO_CRITERION = {
  requiresFarmland: "farmland",
  requiresNewMother: "newMother",
  requiresGirlChild: "girlChild",
  requiresSenior: "senior",
  requiresDisabled: "disabled",
  requiresWidow: "widow",
  requiresStreetVendor: "streetVendor",
  requiresArtisan: "artisan",
  requiresUnorganisedWorker: "unorganisedWorker",
};

const REASON_LABELS = {
  farmland: "owns farmland",
  newMother: "new/expecting mother",
  girlChild: "has a daughter under 10",
  senior: "senior citizen (60+)",
  disabled: "has a disability certificate",
  widow: "widow",
  streetVendor: "street vendor",
  artisan: "artisan / craftsperson",
  unorganisedWorker: "unorganised sector worker",
};

const OCCUPATION_REASON = {
  farmer: "farmer",
  student: "student",
  self_employed: "self-employed",
  salaried: "salaried employee",
  daily_wage: "daily wage worker",
  homemaker: "homemaker",
  unemployed: "unemployed",
  retired: "retired",
};

function isEligible(profile, criteria) {
  if (criteria.minAge != null && profile.age < criteria.minAge) return false;
  if (criteria.maxAge != null && profile.age > criteria.maxAge) return false;
  if (criteria.maxIncome != null && profile.incomeMax > criteria.maxIncome) return false;
  if (criteria.occupations && !criteria.occupations.includes(profile.occupation)) return false;

  for (const [key, flagName] of Object.entries(FLAG_TO_CRITERION)) {
    if (criteria[key] && !profile.flags[flagName]) return false;
  }

  if (criteria.anyFlags) {
    const anySet = criteria.anyFlags.some((key) => {
      const flagName = FLAG_TO_CRITERION[key];
      return profile.flags[flagName];
    });
    if (!anySet) return false;
  }

  return true;
}

function buildReasons(profile, criteria) {
  const reasons = [];

  if (criteria.occupations && criteria.occupations.includes(profile.occupation)) {
    reasons.push(OCCUPATION_REASON[profile.occupation] || profile.occupation);
  }
  for (const [key, flagName] of Object.entries(FLAG_TO_CRITERION)) {
    if (criteria[key] && profile.flags[flagName]) {
      reasons.push(REASON_LABELS[flagName]);
    }
  }
  if (criteria.anyFlags) {
    criteria.anyFlags.forEach((key) => {
      const flagName = FLAG_TO_CRITERION[key];
      if (profile.flags[flagName] && !reasons.includes(REASON_LABELS[flagName])) {
        reasons.push(REASON_LABELS[flagName]);
      }
    });
  }
  if (criteria.maxIncome != null) {
    reasons.push(`income under Rs ${(criteria.maxIncome / 100000).toFixed(1).replace(/\.0$/, "")}L`);
  }
  if (criteria.minAge != null && criteria.maxAge != null) {
    reasons.push(`age ${criteria.minAge}-${criteria.maxAge}`);
  } else if (criteria.minAge != null && criteria.minAge > 10) {
    reasons.push(`age ${criteria.minAge}+`);
  }

  return reasons.length ? reasons.join(", ") : "You meet the basic criteria";
}

function findMatches(profile, schemes) {
  const matched = [];
  for (const scheme of schemes) {
    if (isEligible(profile, scheme.criteria)) {
      matched.push({
        ...scheme,
        whyYouQualify: buildReasons(profile, scheme.criteria),
      });
    }
  }
  matched.sort((a, b) => b.priority - a.priority);
  return matched;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { findMatches, isEligible, buildReasons };
}
