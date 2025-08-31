import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface UserOption {
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export function UserSwitcher() {
  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    throwOnError: false
  });
  
  // In development, show user switching options
  const userOptions: UserOption[] = [
    {
      email: "trexia.olaya@pdax.ph",
      firstName: "Trexia",
      lastName: "Olaya",
      isAdmin: true,
    },
  ];

  const switchUser = (email: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('testUser', email);
    window.location.href = currentUrl.toString();
  };

  const logout = () => {
    // Clear URL parameters and redirect to logout endpoint
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('testUser');
    window.history.replaceState({}, '', currentUrl.pathname);
    window.location.href = "/api/dev/logout";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">
            {(user as any)?.firstName} {(user as any)?.lastName}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5 text-sm font-medium">
          Current: {(user as any)?.email}
        </div>
        <DropdownMenuSeparator />
        {userOptions.map((option) => (
          <DropdownMenuItem
            key={option.email}
            onClick={() => switchUser(option.email)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="font-medium">
                {option.firstName} {option.lastName}
              </span>
              <span className="text-xs text-gray-500">{option.email}</span>
            </div>
            {option.isAdmin && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Admin
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} className="text-red-600">
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}