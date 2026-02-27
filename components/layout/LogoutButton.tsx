"use client";

import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface LogoutButtonProps {
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function LogoutButton({
  className,
  variant = "ghost",
  size = "default",
  showIcon = true,
  showText = true,
}: LogoutButtonProps) {
  const { logout, isLoading, error } = useLogout();

  // Show error as alert when logout fails
  useEffect(() => {
    if (error) {
      // Using alert for simplicity - can be replaced with toast
      alert(error);
    }
  }, [error]);

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={logout}
      disabled={isLoading}
      aria-label="Logout"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span className="ml-2">Logging out...</span>}
        </>
      ) : (
        <>
          {showIcon && <LogOut className="h-4 w-4" />}
          {showText && <span className={showIcon ? "ml-2" : ""}>Logout</span>}
        </>
      )}
    </Button>
  );
}
