import Swal from "sweetalert2";

export const darkSwal = Swal.mixin({
  customClass: {
    popup: "bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-5 shadow-2xl backdrop-blur-xl",
    title: "text-white font-bold text-lg sm:text-xl tracking-tight",
    htmlContainer: "text-slate-300 text-xs sm:text-sm font-medium mt-2",
    confirmButton:
      "bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer mx-1",
    cancelButton:
      "bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer mx-1",
    denyButton:
      "bg-rose-500 hover:bg-rose-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer mx-1",
  },
  buttonsStyling: false,
  background: "#0f172a",
  color: "#f8fafc",
});

/**
 * Show a professional SweetAlert confirmation for Deleting an Expense
 */
export async function confirmDeleteExpense(itemName = "this entry") {
  const result = await darkSwal.fire({
    title: "Delete Expense Record?",
    html: `Are you sure you want to delete <b class="text-rose-400">'${itemName}'</b>?<br/><span class="text-slate-400 text-xs">This action will immediately update Google Sheets.</span>`,
    icon: "warning",
    iconColor: "#f43f5e",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete Record",
    cancelButtonText: "Cancel",
    customClass: {
      popup: "bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-5 shadow-2xl",
      title: "text-white font-bold text-lg sm:text-xl tracking-tight",
      htmlContainer: "text-slate-300 text-xs sm:text-sm font-medium mt-2",
      confirmButton:
        "bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm shadow-lg shadow-rose-950/40 transition-all cursor-pointer mx-1",
      cancelButton:
        "bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer mx-1",
    },
    buttonsStyling: false,
  });

  return result.isConfirmed;
}

/**
 * Show a success notification alert
 */
export function showSuccessAlert(title, text) {
  return darkSwal.fire({
    title,
    text,
    icon: "success",
    iconColor: "#10b981",
    timer: 2500,
    showConfirmButton: false,
  });
}

/**
 * Show an error notification alert
 */
export function showErrorAlert(title, text) {
  return darkSwal.fire({
    title,
    text,
    icon: "error",
    iconColor: "#f43f5e",
    confirmButtonText: "OK",
  });
}
