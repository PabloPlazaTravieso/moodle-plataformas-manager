"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "../password-input";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Error al iniciar sesión");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-blue-999 via-brand-blue-975 to-brand-blue-900 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-brand-blue-975/60 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset from a trusted external CDN, not user content */}
          <img
            src="https://media.awakelab.world/MARCA_AWK26/awakelab_logo_fondo-oscuro_transparente.png"
            alt="Awakelab"
            className="mb-4 h-10"
          />
          <h1 className="text-lg font-semibold text-white">Gestor de plataformas Moodle</h1>
          <p className="mt-1 text-sm text-brand-blue-300">Accede con tus credenciales de administrador</p>
        </div>

        <label className="mb-1 block text-sm font-medium text-brand-blue-100">Usuario</label>
        <input
          className="mb-4 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-brand-blue-300 focus:border-brand-cyan-600 focus:outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />

        <label className="mb-1 block text-sm font-medium text-brand-blue-100">Contraseña</label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          className="mb-4"
          required
          inputClassName="border-white/10 bg-white/5 text-white placeholder:text-brand-blue-300 focus:border-brand-cyan-600 focus:outline-none"
          iconClassName="text-brand-blue-300 hover:text-white"
        />

        {error && (
          <p className="mb-4 rounded-md border border-red-400/30 bg-red-900/30 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-cyan-600 px-4 py-2 text-sm font-semibold text-brand-blue-999 transition hover:bg-brand-cyan-500 disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
