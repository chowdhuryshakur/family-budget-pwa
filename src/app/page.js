"use client";

import { useEffect, useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import Dashboard from "@/components/Dashboard";
import ExpenseForm from "@/components/ExpenseForm";
import { setupOnlineListener } from "@/lib/offlineSync";
import { Wallet, PlusCircle, History, Sparkles, X, WifiOff, CheckCircle2 } from "lucide-react";

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function Home() {
  const { data, error, isLoading, mutate: revalidate } = useSWR("/api/expenses", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'add' | 'history'
  const [showAddModal, setShowAddModal] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [syncToast, setSyncToast] = useState(null);

  // Monitor online/offline status and setup automatic IndexedDB background sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      const cleanupSync = setupOnlineListener((syncedCount) => {
        setSyncToast(`Auto-synced ${syncedCount} offline expense(s) to Google Sheets!`);
        revalidate();
        setTimeout(() => setSyncToast(null), 5000);
      });

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        cleanupSync();
      };
    }
  }, [revalidate]);

  const handleExpenseAdded = () => {
    revalidate();
    setShowAddModal(false);
    setActiveTab("dashboard");
  };

  const handleUpdateExpense = async (updatedPayload) => {
    const res = await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPayload),
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || "Failed to update expense");
    }

    revalidate();
  };

  const handleDeleteExpense = async (id) => {
    const res = await fetch(`/api/expenses?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || "Failed to delete expense");
    }

    revalidate();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Offline Status & Sync Notifications */}
      {isOffline && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>You are currently offline. New expenses will save to IndexedDB & auto-sync when online.</span>
        </div>
      )}

      {syncToast && (
        <div className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 sm:py-3.5">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 text-base sm:text-lg shrink-0">
              ৳
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight">
                Family Budget
              </h1>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <span>Monthly Tracking</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">50k BDT</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden min-[360px]:inline">Add Expense</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-md md:max-w-2xl lg:max-w-4xl w-full mx-auto p-3.5 sm:p-5 pb-28 space-y-6">
        {activeTab === "dashboard" && (
          <Dashboard
            data={data}
            loading={isLoading}
            onRefresh={revalidate}
            onOpenAddModal={() => setShowAddModal(true)}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === "add" && (
          <div className="max-w-md mx-auto pt-2">
            <ExpenseForm
              plannedItems={data?.plannedItems}
              categories={data?.categories}
              onSuccess={handleExpenseAdded}
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400 shrink-0" />
              All Expense Records
            </h2>
            {data?.expenses && data.expenses.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3">
                {data.expenses.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800/60 p-3 sm:p-3.5 rounded-2xl flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                        {item.itemName || item.note || item.category}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {item.category} • {item.date}
                      </p>
                    </div>
                    <span className="font-bold text-rose-400 text-sm sm:text-base shrink-0 pl-2">
                      -৳{Number(item.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 text-center py-8">
                {isLoading ? "Loading expenses..." : "No expense entries found."}
              </p>
            )}
          </div>
        )}
      </main>

      {/* Quick Add Modal / Bottom Drawer */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 space-y-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Quick Expense Entry
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ExpenseForm
              plannedItems={data?.plannedItems}
              categories={data?.categories}
              onSuccess={handleExpenseAdded}
              hideTitle={true}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* Bottom Mobile PWA Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 pt-2 pb-5 sm:pb-3 px-6">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs font-semibold transition-all ${
              activeTab === "dashboard"
                ? "text-emerald-400 scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="-mt-7 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 font-bold active:scale-95 transition-all"
            title="Add Expense"
          >
            <PlusCircle className="w-7 h-7" />
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex flex-col items-center gap-1 text-[11px] sm:text-xs font-semibold transition-all ${
              activeTab === "history"
                ? "text-emerald-400 scale-105"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <History className="w-5 h-5" />
            <span>History</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
