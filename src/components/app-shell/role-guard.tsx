"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = "/login" }: Props) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace(redirectTo); return; }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-32 w-64" />
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
