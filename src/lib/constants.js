/**
 * Icon lookup for categories (handles English & Bengali names gracefully)
 */
export const CATEGORY_ICONS = {
  // English Categories
  "Housing": "🏠",
  "Food & Groceries": "🛒",
  "Utilities & Bua": "⚡",
  "Utilities": "⚡",
  "Kids & Education": "🎓",
  "Transportation & Leisure": "🚗",
  "Transportation": "🚗",
  "Medical": "🏥",
  "Toiletries": "🧴",
  "Savings & Misc": "💡",

  // Bengali Categories from user Google Sheet
  "আবাসন": "🏠",
  "খাবার (শর্করা)": "🍚",
  "খাবার (আমিষ)": "🥩",
  "খাবার (সবজি ও ফল)": "🥗",
  "দুগ্ধ ও নাস্তা": "🥛",
  "মুদি ও মসলা": "🛒",
  "Utility & Bill": "⚡",
  "Grihosthali": "🧹",
  "শিক্ষা ও বিকাশ": "🎓",
  "যাতায়াত ও অন্যান্য": "🚗",
  "যাতায়াত ও অন্যান্য": "🚗",
  "মেডিকেল": "🏥",
  "চিকিৎসা": "🏥",
  "Savings & Misc.": "💡",
};

export function getCategoryIcon(cat) {
  if (!cat) return "🏷️";
  const trimmed = cat.trim();
  if (CATEGORY_ICONS[trimmed]) return CATEGORY_ICONS[trimmed];
  
  const lower = trimmed.toLowerCase();
  if (lower.includes("খাবার") || lower.includes("মুদি") || lower.includes(" food")) return "🛒";
  if (lower.includes("আবাসন") || lower.includes("hous")) return "🏠";
  if (lower.includes("শিক্ষা") || lower.includes("educ")) return "🎓";
  if (lower.includes("যাতায়াত") || lower.includes("trans")) return "🚗";
  if (lower.includes("util") || lower.includes("bill") || lower.includes("bua")) return "⚡";
  if (lower.includes("medic") || lower.includes("চিকিৎসা")) return "🏥";
  if (lower.includes("toilet") || lower.includes("টয়লেট")) return "🧴";
  return "💡";
}

/**
 * Helper to convert Bengali numbers (০-৯) to English digits (0-9)
 */
export function parseBengaliNumber(val) {
  if (!val) return 0;
  const str = String(val).replace(/,/g, "").trim();
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let converted = "";
  for (let i = 0; i < str.length; i++) {
    const idx = bengaliDigits.indexOf(str[i]);
    if (idx !== -1) {
      converted += idx;
    } else if (!isNaN(parseInt(str[i])) || str[i] === ".") {
      converted += str[i];
    }
  }
  return parseFloat(converted) || 0;
}
