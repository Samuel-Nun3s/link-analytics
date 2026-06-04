import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { isAuthenticated } from "../lib/auth";

type FormValues = { password: string };

export function LoginPage() {
  const { login, loading, error } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  // Já autenticado? joga direto pro dashboard
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  async function onSubmit(values: FormValues) {
    await login(values.password);
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">
          Link Analytics
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Entre com a senha de admin definida no <code>.env</code>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="password"
            label="Senha"
            autoComplete="current-password"
            autoFocus
            error={errors.password?.message}
            {...register("password", { required: "Senha obrigatória" })}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
