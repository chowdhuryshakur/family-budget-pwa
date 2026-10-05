import { google } from "googleapis";
import { parseBengaliNumber } from "@/lib/constants";

function getGoogleSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !privateKey) {
    return null;
  }

  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  try {
    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
  } catch (err) {
    console.error("Failed to authenticate Google Service Account:", err);
    return null;
  }
}

async function getActualSheetTitle(sheets, spreadsheetId, preferredName) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetList = meta.data.sheets || [];

    const matched = sheetList.find((s) => {
      const title = s.properties?.title || "";
      return title.trim().toLowerCase() === preferredName.trim().toLowerCase();
    });

    if (matched?.properties?.title) {
      return matched.properties.title;
    }

    const partial = sheetList.find((s) => {
      const title = (s.properties?.title || "").toLowerCase();
      return title.includes(preferredName.toLowerCase());
    });

    if (partial?.properties?.title) {
      return partial.properties.title;
    }

    return null;
  } catch (err) {
    console.warn(`Could not find sheet tab '${preferredName}':`, err.message);
    return null;
  }
}

async function fetchPlannedItemsFromSheet(sheets, spreadsheetId) {
  let planTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Budget_Plan");
  if (!planTabTitle) {
    planTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Monthly Budget");
  }

  if (!planTabTitle) {
    return { plannedItems: [], categoryLimits: {}, categories: [], totalPlannedSum: 0 };
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${planTabTitle}'!A1:Z`,
    });

    const rows = response.data.values || [];
    const plannedItems = [];
    const categoryLimits = {};
    const categoriesSet = new Set();
    let totalPlannedSum = 0;

    rows.forEach((row, index) => {
      if (!row || row.length === 0) return;

      const categoryRaw = row[0] ? row[0].trim() : "";
      
      // Skip header rows or total summary rows
      if (
        categoryRaw.includes("সর্বমোট") ||
        categoryRaw.includes("Total") ||
        categoryRaw.includes("TOTAL") ||
        categoryRaw.includes("ক্যাটাগরি") ||
        categoryRaw.toLowerCase().includes("category")
      ) {
        return;
      }

      const itemNameRaw = row[1] ? row[1].trim() : categoryRaw;
      const qtyDetails = row[2] ? row[2].trim() : "";
      
      let limitVal = parseBengaliNumber(row[4]);
      if (!limitVal) {
        limitVal = parseBengaliNumber(row[3] || row[1]);
      }

      if (categoryRaw || itemNameRaw) {
        const category = categoryRaw || "Savings & Misc.";
        categoriesSet.add(category);

        plannedItems.push({
          id: `plan-${index + 1}`,
          category,
          itemName: itemNameRaw,
          qtyDetails,
          limit: limitVal,
        });

        if (limitVal > 0) {
          categoryLimits[category] = (categoryLimits[category] || 0) + limitVal;
          totalPlannedSum += limitVal;
        }
      }
    });

    return {
      plannedItems,
      categoryLimits,
      categories: Array.from(categoriesSet),
      totalPlannedSum,
    };
  } catch (err) {
    console.error("Error reading Budget_Plan tab from Google Sheet:", err);
    return { plannedItems: [], categoryLimits: {}, categories: [], totalPlannedSum: 0 };
  }
}

export async function getExpenses() {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheets || !spreadsheetId) {
    throw new Error("Google Sheets credentials not set in .env.local");
  }

  try {
    const { plannedItems, categoryLimits, categories, totalPlannedSum } =
      await fetchPlannedItemsFromSheet(sheets, spreadsheetId);

    const totalBudget = totalPlannedSum > 0 ? totalPlannedSum : 50000;

    let expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Expenses");
    if (!expTabTitle) {
      expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Monthly Budget");
    }
    if (!expTabTitle) {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      expTabTitle = meta.data.sheets[0]?.properties?.title || "Expenses";
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${expTabTitle}'!A1:Z`,
    });

    const rows = response.data.values || [];
    const todayStr = new Date().toISOString().split("T")[0];

    const expenses = rows
      .filter((row) => {
        if (!row || row.length === 0) return false;
        const col0 = String(row[0] || "").toLowerCase();
        const col1 = String(row[1] || "").toLowerCase();
        // Skip header row if present
        if (col0.includes("date") || col0.includes("তারিখ") || col0.includes("category") || col1.includes("category")) {
          return false;
        }
        return row[0] || row[1];
      })
      .map((row, index) => {
        let date = todayStr;
        let categoryRaw = row[1];
        let noteRaw = row[2];
        let amountRaw = row[3];
        let id = row[4] || `row-${index + 1}`;

        if (row[0] && (row[0].includes("-") || row[0].includes("/") || !isNaN(Date.parse(row[0])))) {
          date = row[0];
          categoryRaw = row[1];
          noteRaw = row[2];
          amountRaw = row[3];
        } else {
          categoryRaw = row[0];
          noteRaw = row[1];
          amountRaw = row[4] || row[3];
        }

        const category = categoryRaw ? categoryRaw.trim() : "Savings & Misc.";
        const itemName = noteRaw ? noteRaw.trim() : category;
        const amount = parseBengaliNumber(amountRaw);

        return {
          id,
          date,
          category,
          itemName,
          note: noteRaw || "",
          amount,
        };
      })
      .filter((item) => item.amount > 0);

    // Sort expenses strictly date-wise descending (latest date on top)
    const sortedExpenses = [...expenses].sort((a, b) => {
      const dateDiff = (b.date || "").localeCompare(a.date || "");
      if (dateDiff !== 0) return dateDiff;
      return 0;
    });

    const totalSpent = sortedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const remainingBalance = totalBudget - totalSpent;

    return {
      isDemo: false,
      expenses: sortedExpenses,
      plannedItems,
      categoryLimits,
      categories,
      totalBudget,
      totalSpent,
      remainingBalance,
    };
  } catch (error) {
    console.error("Error reading Google Sheets API:", error);
    throw new Error(`Failed to load Google Sheet data: ${error.message}`);
  }
}

export async function appendExpense({ date, category, note, amount }) {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Please enter a valid expense amount.");
  }

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheets || !spreadsheetId) {
    throw new Error("Google Sheets credentials not set in .env.local");
  }

  const newExpense = {
    id: `exp-${Date.now()}`,
    date: date || new Date().toISOString().split("T")[0],
    category: category || "Savings & Misc.",
    note: note || "",
    itemName: note || category || "Daily Expense",
    amount: parsedAmount,
  };

  try {
    let expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Expenses");
    if (!expTabTitle) {
      expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Monthly Budget");
    }
    if (!expTabTitle) {
      expTabTitle = "Expenses";
    }

    const values = [[
      newExpense.date,
      newExpense.category,
      newExpense.note || newExpense.category,
      newExpense.amount,
      newExpense.id,
      new Date().toISOString()
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${expTabTitle}'!A:F`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return { isDemo: false, success: true, expense: newExpense };
  } catch (error) {
    console.error("Error appending row to Google Sheets:", error);
    throw new Error(`Failed to write to Google Sheet: ${error.message}`);
  }
}

export async function updateExpense({ id, date, category, note, amount }) {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Please enter a valid expense amount.");
  }

  const sheets = getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheets || !spreadsheetId) {
    throw new Error("Google Sheets credentials not set in .env.local");
  }

  let expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Expenses");
  if (!expTabTitle) {
    expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Monthly Budget");
  }
  if (!expTabTitle) expTabTitle = "Expenses";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${expTabTitle}'!A1:Z`,
  });

  const rows = response.data.values || [];
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row[4] === id || `row-${i + 1}` === id || `exp-${i + 1}` === id) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Expense entry with ID '${id}' not found in Google Sheet.`);
  }

  const values = [[
    date || new Date().toISOString().split("T")[0],
    category || "Savings & Misc.",
    note || category || "Daily Expense",
    parsedAmount,
    id,
    new Date().toISOString()
  ]];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${expTabTitle}'!A${rowIndex}:F${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });

  return { success: true, updatedRow: rowIndex };
}

export async function deleteExpense(id) {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheets || !spreadsheetId) {
    throw new Error("Google Sheets credentials not set in .env.local");
  }

  let expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Expenses");
  if (!expTabTitle) {
    expTabTitle = await getActualSheetTitle(sheets, spreadsheetId, "Monthly Budget");
  }
  if (!expTabTitle) expTabTitle = "Expenses";

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${expTabTitle}'!A1:Z`,
  });

  const rows = response.data.values || [];
  let rowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row[4] === id || `row-${i + 1}` === id || `exp-${i + 1}` === id) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Expense entry with ID '${id}' not found in Google Sheet.`);
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${expTabTitle}'!A${rowIndex}:F${rowIndex}`,
  });

  return { success: true, deletedRow: rowIndex };
}
