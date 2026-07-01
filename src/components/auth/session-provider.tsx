"use client";

import { createContext, useContext } from "react";
import type { UserProfile } from "@/lib/auth/types";

const SessionContext = createContext<UserProfile | null>(null);

export function SessionProvider({
  profile,
  children,
}: {
  profile: UserProfile;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={profile}>{children}</SessionContext.Provider>;
}

export function useSession(): UserProfile {
  const profile = useContext(SessionContext);
  if (!profile) {
    throw new Error("useSession must be used within SessionProvider with a profile");
  }
  return profile;
}
