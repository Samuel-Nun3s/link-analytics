import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiException } from "../lib/api";
import { clearToken, setToken } from "../lib/auth";
import type { LoginResponse } from "../types/api";

export function useAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api<LoginResponse>("/admin/login", {
        method: "POST",
        body: { password },
      });
      setToken(res.token);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiException) {
        setError(err.status === 401 ? "Senha inválida" : err.message);
      } else {
        setError("Erro de conexão com a API");
      }
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    navigate("/login");
  }

  return { login, logout, loading, error };
}
