"use client";

import { useState, useEffect } from "react";
import { getCategoryIcon } from "@/lib/constants";
import { PlusCircle, Loader2, Calendar, Tag, FileText, Banknote, CheckCircle2, ChevronDown } from "lucide-react";
import { saveOfflineExpense } from "@/lib/offlineSync";

export default function ExpenseForm({ plannedItems = [], categories = [], onSuccess, hideTitle = false, isModal = false }) {
  const today = new Date().toISOString().split("T")[0];

  const itemsList = plannedItems && plannedItems.length > 0 ? plannedItems : [];
  const categoryList = categories && categories.length > 0
    ? categories
    : ["Housing", "Food & Groceries", "Utilities & Bua", "Kids & Education", "Transportation & Leisure", "Medical", "Toiletries", "Savings & Misc."];

  const [category, setCategory] = useState(categoryList[0] || "Food & Groceries");
  
  // Filter items matching selected category
  const filteredItems = itemsList.filter((item) => {
    if (!item.category) return false;
    return item.category.trim().toLowerCase() === category.trim().toLowerCase();
  });

  const [selectedItem, setSelectedItem] = useState(filteredItems[0]?.itemName || "__custom__");
  const [customItemName, setCustomItemName] = useState("");
  const [isCustomItem, setIsCustomItem] = useState(filteredItems.length === 0);
  const [amount, setAmount] = useState(filteredItems[0]?.limit ? String(filteredItems[0].limit) : "");
  const [date, setDate] = useState(today);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // When category changes, dynamically update the related item dropdown list!
  useEffect(() => {
    const updated = itemsList.filter((item) => {
      if (!item.category) return false;
      return item.category.trim().toLowerCase() === category.trim().toLowerCase();
    });

    if (updated.length > 0) {
      setSelectedItem(updated[0].itemName);
      setIsCustomItem(false);
      if (updated[0].limit) {
        setAmount(String(updated[0].limit));
      } else {
        setAmount("");
      }
    } else {
      setSelectedItem("__custom__");
      setIsCustomItem(true);
      setCustomItemName("");
      setAmount("");
    }
  }, [category, itemsList]);

  const handleItemSelect = (itemNameVal) => {
    if (itemNameVal === "__custom__") {
      setIsCustomItem(true);
      setSelectedItem("__custom__");
      setCustomItemName("");
      setAmount("");
      return;
    }

    setIsCustomItem(false);
    setSelectedItem(itemNameVal);

    const found = itemsList.find((i) => i.itemName === itemNameVal);
    if (found && found.limit && found.limit > 0) {
      setAmount(String(found.limit));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalItemName = isCustomItem ? customItemName.trim() : selectedItem;

    if (!finalItemName) {
      setStatusMessage({ type: "error", text: "Please select or enter an item name." });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid expense amount." });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const payload = {
      amount: parseFloat(amount),
      category,
      note: finalItemName,
      date,
    };

    // Handle Offline mode
    if (typeof window !== "undefined" && !navigator.onLine) {
      try {
        await saveOfflineExpense(payload);
        setStatusMessage({
          type: "success",
          text: `Saved offline! Entry for '${finalItemName}' will auto-sync when online.`,
        });
        setAmount("");
        if (onSuccess) onSuccess({ ...payload, isOffline: true });
        setTimeout(() => setStatusMessage(null), 4000);
      } catch (err) {
        setStatusMessage({ type: "error", text: "Could not save offline expense." });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Online submission
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add expense");
      }

      setStatusMessage({ type: "success", text: `Recorded: '${finalItemName}' (৳${amount})` });

      if (filteredItems.length > 0) {
        setSelectedItem(filteredItems[0].itemName);
        setIsCustomItem(false);
        setAmount(filteredItems[0].limit ? String(filteredItems[0].limit) : "");
      } else {
        setAmount("");
        setCustomItemName("");
      }
      setDate(today);

      if (onSuccess) {
        onSuccess(data.expense);
      }

      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage({ type: "error", text: err.message || "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = isModal
    ? "w-full"
    : "bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md w-full";

  return (
    <div className={containerStyle}>
      {!hideTitle && (
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            Record Expense Entry
          </h2>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            BDT (৳)
          </span>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3 sm:p-3.5 rounded-2xl mb-4 text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Step 1: Category Selector */}
        <div>
          <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            1. Select Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-semibold text-sm sm:text-base rounded-2xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              {categoryList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900 text-slate-100 py-2">
                  {getCategoryIcon(cat)} {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Step 2: Category-Filtered Item Name Dropdown */}
        <div>
          <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            2. Select Item Name ({filteredItems.length} items in {category})
          </label>
          <div className="relative">
            <select
              value={isCustomItem ? "__custom__" : selectedItem}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 font-semibold text-sm sm:text-base rounded-2xl pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              {filteredItems.map((item) => (
                <option key={item.id || item.itemName} value={item.itemName} className="bg-slate-900 text-slate-100 py-2">
                  {item.itemName} — (Limit: ৳{item.limit?.toLocaleString()})
                </option>
              ))}
              <option value="__custom__" className="bg-slate-900 text-amber-300 py-2 font-semibold">
                ✏️ + Type Custom Item Name...
              </option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Custom Item Text Field if '__custom__' selected */}
        {isCustomItem && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-[11px] sm:text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
              Custom Item Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Extra Bazar, Taxi fare, Medicine"
              value={customItemName}
              onChange={(e) => setCustomItemName(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/40 text-slate-100 text-sm sm:text-base font-semibold rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-base"
            />
          </div>
        )}

        {/* Amount Input */}
        <div>
          <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Amount (BDT ৳)
          </label>
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-base sm:text-lg">
              ৳
            </div>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-lg sm:text-xl rounded-2xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600 text-base"
            />
          </div>
        </div>

        {/* Date Picker (ISO 8601 YYYY-MM-DD) */}
        <div>
          <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Date (YYYY-MM-DD)
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-sm rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-base"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-slate-950 font-bold text-sm sm:text-base py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Entry...</span>
            </>
          ) : (
            <>
              <Banknote className="w-5 h-5" />
              <span>Record Expense</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
