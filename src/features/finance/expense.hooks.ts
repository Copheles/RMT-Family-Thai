import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createThaiExpense,
  deleteThaiExpense,
  listThaiExpenses,
  updateThaiExpense,
} from "@/features/thai/thai.api";
import type { ThaiExpense } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";

export type ThaiExpensePayload = {
  name: string;
  price: number;
  date: string;
};

export type ThaiExpenseFilters = {
  page: number;
  limit: number;
  search: string;
  dateFrom?: string;
  dateTo?: string;
};

function keyOf(filters: ThaiExpenseFilters): string {
  return JSON.stringify(filters);
}

function toApiDate(date: string): string {
  return date.includes("T") ? date : new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function useThaiExpenses(filters: ThaiExpenseFilters) {
  return useQuery({
    queryKey: queryKeys.thai.expenses(keyOf(filters)),
    queryFn: () =>
      listThaiExpenses({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
  });
}

export function useThaiExpenseMutations(filters: ThaiExpenseFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["thai", "expenses"] });

  const createMutation = useMutation({
    mutationFn: (payload: ThaiExpensePayload) =>
      createThaiExpense({
        ...payload,
        date: toApiDate(payload.date),
      }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ThaiExpensePayload>;
    }) =>
      updateThaiExpense(id, {
        ...payload,
        ...(payload.date !== undefined ? { date: toApiDate(payload.date) } : {}),
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThaiExpense(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export type { ThaiExpense };
