"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassPanel } from "@/components/ui/glass-panel";
import { API_ROUTES } from "@/lib/api";
import { saveTokens } from "@/lib/auth-store";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const res = await fetch(API_ROUTES.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setServerError(body?.message ?? "No se pudo iniciar sesión.");
      return;
    }

    const data = await res.json();
    saveTokens(data.tokens);
    router.push("/");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accede a tu cuenta de NORA</p>
      </div>

      <GlassPanel as="form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <Input type="email" placeholder="Correo electrónico" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-critical">{errors.email.message}</p>}
        </div>
        <div>
          <Input type="password" placeholder="Contraseña" {...register("password")} />
          {errors.password && (
            <p className="mt-1 text-xs text-critical">{errors.password.message}</p>
          )}
        </div>
        {serverError && <p className="text-sm text-critical">{serverError}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
        </Button>
      </GlassPanel>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-primary underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
