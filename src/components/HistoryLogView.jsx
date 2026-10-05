"use client";

import { useState, useMemo, useEffect } from "react";
import { getCategoryIcon } from "@/lib/constants";
import { confirmDeleteExpense, showSuccessAlert, showErrorAlert } from "@/lib/swal";
import {
  History,
  Calendar,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  Layers,
  ArrowUpDown
} from "lucide-react";

export default function HistoryLogView({
  data,
  isLoading,
  onUpdateExpense,
  onDeleteExpense,
  onOpenAddModal,
}) {
  const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Filter & Search states
  const [filterMode, setFilterMode] = useState("all"); // 'all' | 'month' | 'single' | 'range'
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [singleDate, setSingleDate] = useState(todayStr);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit Expense modal state
  const [editingExpense, setEditingExpense] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editItemName, setEditItemName] = useState("");
  const [editDate, setEditDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const categoriesList = data?.categories || [];
  const allExpenses = data?.expenses || [];

  // Reset pagination to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [filterMode, filterMonth, singleDate, startDate, endDate, selectedCategory, searchTerm, pageSize]);

  // Filter and Sort Expenses strictly Date-wise Descending (latest date on top)
  const filteredAndSortedExpenses = useMemo(() => {
    let list = [...allExpenses];

    // Date-wise filtering
    if (filterMode === "month" && filterMonth) {
      list = list.filter((e) => e.date && e.date.startsWith(filterMonth));
    } else if (filterMode === "single" && singleDate) {
      list = list.filter((e) => e.date === singleDate);
    } else if (filterMode === "range") {
      if (startDate) {
        list = list.filter((e) => e.date >= startDate);
      }
      if (endDate) {
        list = list.filter((e) => e.date <= endDate);
      }
    }

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter(
        (e) => (e.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search term filter
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.itemName && e.itemName.toLowerCase().includes(query)) ||
          (e.note && e.note.toLowerCase().includes(query)) ||
          (e.category && e.category.toLowerCase().includes(query))
      );
    }

    // Strict Date Descending Sort (latest date first)
    list.sort((a, b) => {
      const dateDiff = (b.date || "").localeCompare(a.date || "");
      if (dateDiff !== 0) return dateDiff;
      return (b.id || "").localeCompare(a.id || "");
    });

    return list;
  }, [allExpenses, filterMode, filterMonth, singleDate, startDate, endDate, selectedCategory, searchTerm]);

  // Pagination calculation
  const totalRecords = filteredAndSortedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPageExpenses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedExpenses.slice(start, start + pageSize);
  }, [filteredAndSortedExpenses, page, pageSize]);

  // Handle Edit Action
  const handleOpenEdit = (item) => {
    setEditingExpense(item);
    setEditAmount(String(item.amount));
    setEditCategory(item.category);
    setEditItemName(item.itemName || item.note || item.category);
    setEditDate(item.date || todayStr);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    setActionLoading(true);
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
      showSuccessAlert("Expense Updated", `'${editItemName}' has been updated.`);
    } catch (err) {
      showErrorAlert("Update Failed", err.message || "Could not update expense.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Action with SweetAlert2
  const handleDelete = async (id, name) => {
    const isConfirmed = await confirmDeleteExpense(name);
    if (!isConfirmed) return;

    setActionLoading(true);
    try {
      if (onDeleteExpense) {
        await onDeleteExpense(id);
      }
      showSuccessAlert("Record Deleted", `'${name}' was deleted.`);
    } catch (err) {
      showErrorAlert("Delete Failed", err.message || "Failed to delete expense entry.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Controls */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400 shrink-0" />
              All Expense Records
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtered & sorted date-wise descending (latest first)
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-2 rounded-xl transition-all active:scale-95 shrink-0 shadow-md shadow-emerald-950/40"
          >
            + Add New Expense
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Date Filter Mode:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterMode("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === "all"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setFilterMode("month")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === "month"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setFilterMode("single")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === "single"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Single Date
              </button>
              <button
                onClick={() => setFilterMode("range")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === "range"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Date Range
              </button>
            </div>
          </div>

          {/* Dynamic Date Inputs based on Filter Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {filterMode === "month" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Select Month
                </label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            )}

            {filterMode === "single" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Specific Date
                </label>
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            )}

            {filterMode === "range" && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Filter Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Categories ({categoriesList.length})</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Search Item Name / Note
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Bazar, Rice, Electricity bill..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs font-semibold pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense List Records Card */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Results Header Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2 pb-2 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-200">
              Showing {totalRecords === 0 ? 0 : (page - 1) * pageSize + 1} –{" "}
              {Math.min(page * pageSize, totalRecords)} of {totalRecords} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Expenses Table/List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-xs sm:text-sm flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading expense records...</span>
          </div>
        ) : currentPageExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs sm:text-sm">
            No matching expense records found for the selected filters.
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3">
            {currentPageExpenses.map((item) => {
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
                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap shrink-0 inline-block truncate max-w-[140px]">
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

                    {/* Edit & Delete Actions */}
                    <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, displayName)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalRecords > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="font-semibold text-[11px] sm:text-xs">
              Page {page} of {totalPages} ({totalRecords} items total)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-200 font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>

              <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-bold text-xs">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-slate-200 font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal for History View */}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Amount (BDT ৳)
                </label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-semibold text-sm rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Date (YYYY-MM-DD)
                </label>
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
