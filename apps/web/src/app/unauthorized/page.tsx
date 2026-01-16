import Link from "next/link";
import { Button } from "@ogp/ui";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">403</h1>
        <p className="mt-4 text-xl text-gray-600">Acesso negado</p>
        <p className="mt-2 text-gray-500">
          Você não tem permissão para acessar esta página.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button>Voltar para o início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

