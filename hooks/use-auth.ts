"use client";

import {
  permissionSatisfied,
  type AuthProfile,
  type ChangePasswordDto,
  type LoginDto,
  type RegisterDto,
  type SessionUser,
  type UpdateProfileDto,
} from "@nodedr-restaurant/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api.get<{ user: AuthProfile }>("/auth/me"),
    retry: false,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateProfileDto) => api.patch<{ user: AuthProfile }>("/auth/me", dto),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDto) => api.post<{ ok: boolean }>("/auth/me/password", dto),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LoginDto) => api.post<{ user: SessionUser }>("/auth/login", dto),
    onSuccess: (data) => {
      // Anything cached before this login belongs to nobody (or to the previous
      // user): drop it so branches and the rest load fresh for this account.
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "auth" });
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: RegisterDto) => api.post<{ user: SessionUser }>("/auth/register", dto),
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function hasPermission(user: SessionUser | undefined, permission: string): boolean {
  return user ? permissionSatisfied(user.permissions, permission) : false;
}
