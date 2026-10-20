import { createContext, useContext } from "react";

export interface AdminContextValue {
  username: string;
  setUsername: (username: string) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  logout: () => Promise<void>;
}

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used inside the admin shell");
  }
  return context;
}
