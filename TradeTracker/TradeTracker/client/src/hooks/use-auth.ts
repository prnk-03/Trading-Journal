import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LoginUser, RegisterUser } from "@shared/schema";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  });
  
  const queryClient = useQueryClient();

  // Get current user
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
    meta: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  // Update API client headers when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('authToken', token);
      // Set default headers for future requests
      window.defaultHeaders = { Authorization: `Bearer ${token}` };
    } else {
      localStorage.removeItem('authToken');
      delete window.defaultHeaders;
    }
  }, [token]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser): Promise<AuthResponse> => {
      return apiRequest("POST", "/api/auth/login", credentials);
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUser): Promise<AuthResponse> => {
      return apiRequest("POST", "/api/auth/register", userData);
    },
    onSuccess: (data) => {
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (token) {
        return apiRequest("POST", "/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    },
    onSuccess: () => {
      setToken(null);
      queryClient.clear();
    },
  });

  const login = (credentials: LoginUser) => {
    return loginMutation.mutateAsync(credentials);
  };

  const register = (userData: RegisterUser) => {
    return registerMutation.mutateAsync(userData);
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const exportTrades = async () => {
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/trades/export/csv', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    exportTrades,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    defaultHeaders?: Record<string, string>;
  }
}