import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createThaiExchange,
  deleteThaiExchange,
  listThaiExchanges,
  updateThaiExchange,
} from "@/features/thai/thai.api";
import type { ExchangeType, ThaiExchange } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";

export type ThaiExchangePayload = {
  name: string;
  amountMmk: number;
  rateMmkPerUsd: number;
  senderName: string;
  receiverName: string;
  type: ExchangeType;
  date: string;
};

export type ThaiExchangeFilters = {
  page: number;
  limit: number;
  search: string;
  type?: ExchangeType;
};

function keyOf(filters: ThaiExchangeFilters): string {
  return JSON.stringify(filters);
}

function toApiDate(date: string): string {
  return date.includes("T") ? date : new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function useThaiExchanges(filters: ThaiExchangeFilters) {
  return useQuery({
    queryKey: queryKeys.thai.exchanges(keyOf(filters)),
    queryFn: () =>
      listThaiExchanges({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        type: filters.type,
      }),
  });
}

export function useThaiExchangeMutations(filters: ThaiExchangeFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["thai", "exchanges"] });

  const createMutation = useMutation({
    mutationFn: (payload: ThaiExchangePayload) =>
      createThaiExchange({
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
      payload: Partial<ThaiExchangePayload>;
    }) =>
      updateThaiExchange(id, {
        ...payload,
        ...(payload.date !== undefined ? { date: toApiDate(payload.date) } : {}),
      }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThaiExchange(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export type { ThaiExchange };
