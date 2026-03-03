import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { Card } from "@ogp/ui";
import { CitizenHeader } from "@/components/CitizenHeader";

export default async function SobreMunicipioPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CitizenHeader session={session} />
      <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sobre o Município</h1>
        <p className="text-gray-600">
          Informações sobre a Câmara Municipal da Beira
        </p>
      </div>

      <Card className="p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Câmara Municipal da Beira</h2>
          <p className="text-gray-700 leading-relaxed">
            A Câmara Municipal da Beira é o órgão executivo do município de Beira, 
            responsável pela gestão e administração dos serviços municipais, 
            desenvolvimento urbano, e prestação de serviços públicos à população.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Missão</h2>
          <p className="text-gray-700 leading-relaxed">
            Promover o desenvolvimento sustentável do município, garantindo a prestação 
            de serviços públicos de qualidade, fomentando a participação cidadã e 
            contribuindo para o bem-estar da população de Beira.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visão</h2>
          <p className="text-gray-700 leading-relaxed">
            Ser uma instituição municipal moderna, transparente e eficiente, 
            reconhecida pela excelência na prestação de serviços e pelo 
            compromisso com o desenvolvimento da cidade e o bem-estar dos cidadãos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Estrutura Organizacional</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            A Câmara Municipal da Beira está organizada em várias vereações e departamentos, 
            cada um responsável por áreas específicas de atuação:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Vereação de Desenvolvimento Humano e Institucional</li>
            <li>Vereação do Plano, Finanças</li>
            <li>Vereação de Construção, Infra-Estruturas e Urbanização</li>
            <li>Vereação de Gestão Urbana e Equipamentos</li>
            <li>Vereação da Saúde, Acção Social e Género</li>
            <li>Vereação da Indústria, Comércio, Turismo, Mercados e Feiras</li>
            <li>Vereação de Protecção Civil, Sistema de Transportes, Trânsito Rodoviário e Energia</li>
            <li>Vereação de Juventude e Desportos</li>
            <li>Vereação de Agro-Pecuária, Pescas e Meio Ambiente</li>
            <li>Vereação de Educação e Cultura</li>
          </ul>
          <p className="text-gray-700 leading-relaxed mt-4">
            Para visualizar a estrutura completa, consulte o{" "}
            <a href="/municipio/organograma" className="text-blue-600 hover:text-blue-800 underline">
              Organograma
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contactos</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Endereço:</strong> Câmara Municipal da Beira, Beira, Moçambique
            </p>
            <p>
              <strong>Telefone:</strong> (Informação a adicionar)
            </p>
            <p>
              <strong>Email:</strong> (Informação a adicionar)
            </p>
          </div>
        </section>
      </Card>
      </main>
    </div>
  );
}
