"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button, Input } from "@ogp/ui";

// Beira city bounding box
const BEIRA_BOUNDING_BOX = {
  minLat: -19.88,  // South
  maxLat: -19.66,  // North
  minLng: 34.78,   // West
  maxLng: 34.91,   // East
};

function isWithinBeira(lat: number, lng: number): boolean {
  return (
    lat >= BEIRA_BOUNDING_BOX.minLat &&
    lat <= BEIRA_BOUNDING_BOX.maxLat &&
    lng >= BEIRA_BOUNDING_BOX.minLng &&
    lng <= BEIRA_BOUNDING_BOX.maxLng
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const verifyLocation = () => {
    setIsCheckingLocation(true);
    setError("");

    if (!navigator.geolocation) {
      setError("O seu navegador não suporta geolocalização. Por favor, utilize outro navegador.");
      setIsCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (isWithinBeira(latitude, longitude)) {
          setLocationVerified(true);
          setUserLocation({ lat: latitude, lng: longitude });
          setError("");
        } else {
          setError(
            "A sua localização está fora dos limites da cidade da Beira. " +
            "Este serviço está disponível apenas para residentes da Beira."
          );
          setLocationVerified(false);
        }
        setIsCheckingLocation(false);
      },
      (err) => {
        let errorMessage = "Não foi possível obter a sua localização. ";
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage += "Por favor, permita o acesso à localização nas configurações do seu navegador.";
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage += "Informação de localização indisponível.";
            break;
          case err.TIMEOUT:
            errorMessage += "O pedido de localização expirou. Tente novamente.";
            break;
          default:
            errorMessage += "Ocorreu um erro desconhecido.";
        }
        setError(errorMessage);
        setIsCheckingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!phone || phone.length < 9) {
      setError("Por favor, introduza um número de telefone válido.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          password,
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || "Ocorreu um erro ao criar a conta.");
        return;
      }

      // Auto sign-in and redirect to incidents page
      const signInResult = await signIn("credentials", {
        email: phone,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Conta criada, mas não foi possível entrar. Por favor, faça login manualmente.");
        return;
      }

      router.push("/incidents");
      router.refresh();
    } catch (err) {
      setError("Ocorreu um erro ao criar a conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Open Government Platform</h1>
          <p className="mt-2 text-gray-600">Criar uma nova conta</p>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="mb-4 text-sm font-medium text-gray-900">
                Dados da Conta
              </h3>
              
              <div className="space-y-4">
                <Input
                  label="Nome Completo"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Introduza o seu nome completo"
                />

                <Input
                  label="Número de Telefone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+258 84 123 4567"
                />

                <Input
                  label="Palavra-passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                />

                <Input
                  label="Confirmar Palavra-passe"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita a palavra-passe"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {isLoading ? "A criar conta..." : "Criar Conta"}
            </Button>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{" "}
              <Link
                href="/auth/signin"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
