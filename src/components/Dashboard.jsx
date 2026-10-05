"use client";

import { getCategoryIcon } from "@/lib/constants";
import { RefreshCw, Wallet, ArrowDownRight, PieChart, TrendingUp, AlertCircle, Calendar, Tag, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Layers, Edit3, Trash2, X, CheckCircle2, Loader2, Filter, History } from "lucide-react";
import { useState, useEffect } from "react";
import { confirmDeleteExpense, showSuccessAlert, showErrorAlert } from "@/lib/swal";

export default function Dashboard({
  data,
  loading,
  onRefresh,
  onOpenAddModal,
  onDeleteExpense,
  onUpdateExpense,
}) {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(true);
  const [dashPage, setDashPage] = useState(1);
  const DASH_PAGE_SIZE = 8;

  // Reset pagination on month change
  useEffect(() => {
    setDashPage(1);
  }, [selectedMonth]);

  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const categoryLimits = data?.categoryLimits || {};
  const plannedItems = data?.plannedItems || [];
  const categoriesList = data?.categories && data.categories.length > 0
    ? data.categories
    : Object.keys(categoryLimits);

  const allExpenses = data?.expenses || [];

  // Filter expenses matching selected YYYY-MM
  const filteredExpenses = allExpenses.filter((item) => {
    if (!item.date) return true;
    return item.date.startsWith(selectedMonth);
  });

  // Sort expenses date-wise descending (latest date on top)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateDiff = (b.date || "").localeCompare(a.date || "");
    if (dateDiff !== 0) return dateDiff;
    return (b.id || "").localeCompare(a.id || "");
  });

  const totalDashPages = Math.max(1, Math.ceil(sortedExpenses.length / DASH_PAGE_SIZE));
  const currentDashExpenses = sortedExpenses.slice(
    (dashPage - 1) * DASH_PAGE_SIZE,
    dashPage * DASH_PAGE_SIZE
  );

  const totalBudget = data?.totalBudget || 50000;
  const totalSpent = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBalance = totalBudget - totalSpent;

  const spentPercentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  const getStatusColor = () => {
    if (spentPercentage > 90) return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    if (spentPercentage > 75) return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  };

  // Group filtered expenses by category
  const categorySpentMap = {};
  categoriesList.forEach((cat) => {
    categorySpentMap[cat] = 0;
  });

  filteredExpenses.forEach((item) => {
    const cat = item.category || "Savings & Misc.";
    categorySpentMap[cat] = (categorySpentMap[cat] || 0) + Number(item.amount || 0);
  });

  const [expandedCat, setExpandedCat] = useState(null);
  const toggleExpand = (cat) => {
    setExpandedCat(expandedCat === cat ? null : cat);
  };

  // Handle Edit Trigger
  const handleOpenEdit = (item) => {
    setEditingExpense(item);
    setEditAmount(String(item.amount));
    setEditCategory(item.category);
    setEditItemName(item.itemName || item.note || item.category);
    setEditDate(item.date || new Date().toISOString().split("T")[0]);
  };

  // Submit Edit Action
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    setActionLoading(true);
    setActionMessage(null);

    try {
      if (onUpdateExpense) {
        await onUpdateExpense({
          id: editingExpense.id,
          amount: parseFloat(editAmount),
          category: editCategory,
          note: editItemName,
          date: editDate,
        });
      }

      setEditingExpense(null);
      showSuccessAlert("Expense Updated", `'${editItemName}' was updated successfully.`);
    } catch (err) {
      showErrorAlert("Update Failed", err.message || "Failed to update expense");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Action with SweetAlert2 Professional Confirmation
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirmDeleteExpense(name);
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      if (onDeleteExpense) {
        await onDeleteExpense(id);
      }
      showSuccessAlert("Record Deleted", `'${name}' has been deleted.`);
    } catch (err) {
      showErrorAlert("Delete Failed", err.message || "Failed to delete expense entry");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            actionMessage.type === "success"
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border border-rose-500/30 text-rose-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Budget Overview Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 sm:w-44 sm:h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 truncate">
            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">Monthly Budget Overview</span>
          </span>

          {/* Monthly Filter Picker */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-950/90 border border-slate-700/70 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              />
            </div>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/50 active:scale-95 disabled:opacity-50 shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Remaining Balance Big Stat */}
        <div className="mb-5 sm:mb-6">
          <p className="text-xs text-slate-400 font-medium mb-1">
            Remaining Balance ({selectedMonth})
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent tracking-tight break-all">
              ৳{remainingBalance.toLocaleString()}
            </h1>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">BDT</span>
          </div>
        </div>

        {/* Spend & Budget Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 mb-5">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1 truncate">
              <TrendingUp className="w-3 h-3 text-slate-400 shrink-0" />
              Total Planned
            </span>
            <p className="text-base sm:text-lg font-bold text-slate-100 mt-1 truncate">
              ৳{totalBudget.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3 sm:p-3.5 rounded-2xl min-w-0">
            <span className="text-[10px] sm:text-[11px] font-semibold text-rose-400 uppercase tracking-wide flex items-center gap-1 truncate">
              <ArrowDownRight className="w-3 h-3 text-rose-400 shrink-0" />
              Actual Spent ({selectedMonth})
            </span>
            <p className="text-base sm:text-lg font-bold text-rose-400 mt-1 truncate">
              ৳{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Budget Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5 font-medium gap-2">
            <span className="text-slate-400 text-[11px] sm:text-xs">Overall Budget ({spentPercentage}%)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusColor()}`}>
              {remainingBalance >= 0 ? `${spentPercentage}% Used` : "Over Budget"}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercentage > 90
                  ? "bg-gradient-to-r from-rose-500 to-red-600"
                  : spentPercentage > 75
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-emerald-400 to-teal-500"
              }`}
              style={{ width: `${spentPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Navigation Control Bar */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/60 border border-slate-800/80 p-2 rounded-2xl">
        <button
          onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            showCategoryBreakdown
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-800/60 text-slate-300 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Category Limits ({categoriesList.length})</span>
          {showCategoryBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <a
          href="#recent-history"
          className="px-3.5 py-1.5 bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-emerald-400" />
          <span>Jump to Expense Log ({filteredExpenses.length})</span>
        </a>
      </div>

      {/* Pro Category Spending & Item Breakdown Section */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
            Category Budget & Planned Items
            <span className="text-[10px] font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {categoriesList.length} categories
            </span>
          </h3>
          <button
            onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            {showCategoryBreakdown ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Hide Categories</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Show Categories</span>
              </>
            )}
          </button>
        </div>

        {showCategoryBreakdown && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
          {categoriesList.map((cat) => {
            const spent = categorySpentMap[cat] || 0;
            const limit = categoryLimits[cat] || 0;
            const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isExceeded = spent > limit && limit > 0;
            const isWarning = !isExceeded && percentage >= 80;

            const categoryItems = plannedItems.filter(
              (p) => p.category.trim().toLowerCase() === cat.trim().toLowerCase()
            );

            let badgeText = `${percentage}%`;
            let badgeStyle = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
            let barGradient = "bg-gradient-to-r from-emerald-400 to-teal-500";
            let spentTextColor = "text-slate-100";

            if (isExceeded) {
              badgeText = "Exceeded";
              badgeStyle = "text-rose-400 bg-rose-500/15 border-rose-500/40 font-bold";
              barGradient = "bg-gradient-to-r from-rose-500 to-red-600";
              spentTextColor = "text-rose-400 font-bold";
            } else if (isWarning) {
              badgeText = `${percentage}% (High)`;
              badgeStyle = "text-amber-400 bg-amber-500/15 border-amber-500/40 font-bold";
              barGradient = "bg-gradient-to-r from-amber-400 to-orange-500";
              spentTextColor = "text-amber-400 font-bold";
            }

            const fillPercentage = Math.min(percentage, 100);
            const isExpanded = expandedCat === cat;

            return (
              <div
                key={cat}
                className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 space-y-3 hover:border-slate-700/90 transition-all shadow-lg backdrop-blur-sm"
              >
                {/* Header: Category Icon, Name & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-base shrink-0 shadow-inner">
                      {getCategoryIcon(cat)}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {cat}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center shrink-0 ${badgeStyle}`}>
                      {badgeText}
                    </span>
                    {categoryItems.length > 0 && (
                      <button
                        onClick={() => toggleExpand(cat)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-all active:scale-95"
                        title="Toggle Items"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Spent vs Planned Limit Row */}
                <div className="flex items-baseline justify-between text-xs gap-2 pt-0.5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] text-slate-400 font-medium">Spent:</span>
                    <span className={`font-bold ${spentTextColor}`}>
                      ৳{spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[11px] text-slate-400 font-medium">Limit:</span>
                    <span className="font-bold text-slate-200">
                      ৳{limit.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Category Progress Bar */}
                <div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barGradient}`}
                      style={{ width: `${fillPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Planned Items List */}
                {categoryItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                      <span className="font-semibold text-slate-300 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-400" />
                        Planned Items ({categoryItems.length})
                      </span>
                      <button
                        onClick={() => toggleExpand(cat)}
                        className="text-[10px] font-semibold text-emerald-400 hover:underline"
                      >
                        {isExpanded ? "Collapse" : "Expand All"}
                      </button>
                    </div>

                    {isExpanded ? (
                      <div className="space-y-1.5 pt-1">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="bg-slate-950/80 border border-slate-800/60 rounded-xl px-3 py-2 flex items-center justify-between text-xs transition-all"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-slate-100 block truncate">
                                {item.itemName}
                              </span>
                              {item.qtyDetails && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {item.qtyDetails}
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-emerald-400 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              ৳{item.limit.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
                        {categoryItems.slice(0, 3).map((item) => (
                          <span
                            key={item.id}
                            className="bg-slate-950/80 border border-slate-800/60 rounded-lg px-2 py-1 text-slate-200 font-medium whitespace-nowrap truncate max-w-[160px] flex items-center gap-1 shrink-0"
                          >
                            <span className="truncate">{item.itemName}</span>
                            <span className="text-emerald-400 font-bold shrink-0">
                              ৳{item.limit.toLocaleString()}
                            </span>
                          </span>
                        ))}
                        {categoryItems.length > 3 && (
                          <span className="text-slate-500 text-[10px] font-semibold self-center px-1 whitespace-nowrap shrink-0">
                            +{categoryItems.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Recent Expenses Log with Edit & Delete Actions */}
      <div id="recent-history" className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl scroll-mt-20">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            Expense History Log ({selectedMonth})
            <span className="text-[10px] sm:text-xs font-normal text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
              {filteredExpenses.length} records
            </span>
          </h3>
          <button
            onClick={onOpenAddModal}
            className="text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-1.5 rounded-xl transition-all active:scale-95 shrink-0 shadow-md shadow-emerald-950/40"
          >
            + Add Expense
          </button>
        </div>

        {sortedExpenses.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs sm:text-sm">
            No expenses recorded for {selectedMonth}.
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {currentDashExpenses.map((item) => {
              const displayName = item.itemName || item.note || item.category;

              return (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800/60 hover:border-slate-700/80 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2 transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg shrink-0 shadow-inner">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                        {displayName}
                      </h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 truncate">
                          {item.category}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 shrink-0 whitespace-nowrap">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Amount */}
                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    <p className="text-sm sm:text-base font-bold text-rose-400 whitespace-nowrap">
                      -৳{Number(item.amount).toLocaleString()}
                    </p>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Edit Expense Entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, displayName)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Delete Expense Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls for Dashboard History */}
            {sortedExpenses.length > 0 && totalDashPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs text-slate-400">
                <span className="font-semibold text-[11px]">
                  Showing {(dashPage - 1) * DASH_PAGE_SIZE + 1}–{Math.min(dashPage * DASH_PAGE_SIZE, sortedExpenses.length)} of {sortedExpenses.length} records
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDashPage((p) => Math.max(p - 1, 1))}
                    disabled={dashPage === 1}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-200 font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-bold text-xs">
                    {dashPage} / {totalDashPages}
                  </span>
                  <button
                    onClick={() => setDashPage((p) => Math.min(p + 1, totalDashPages))}
                    disabled={dashPage === totalDashPages}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-200 font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Edit Expense Entry
              </h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (BDT ৳)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <div className="relative">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-2xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-400 text-slate-950 hover:bg-emerald-300 flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
