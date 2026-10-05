import { getExpenses, appendExpense, updateExpense, deleteExpense } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get("budget_auth_session")?.value;
  return session === "authenticated";
}

export async function GET() {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }
    const data = await getExpenses();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }
    const body = await request.json();
    const { date, category, note, amount } = body;

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number" },
        { status: 400 }
      );
    }

    const result = await appendExpense({ date, category, note, amount });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to append expense" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }
    const body = await request.json();
    const { id, date, category, note, amount } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required for update" },
        { status: 400 }
      );
    }

    const result = await updateExpense({ id, date, category, note, amount });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized access. Please log in." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { error: "Expense ID is required for deletion" },
        { status: 400 }
      );
    }

    const result = await deleteExpense(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
