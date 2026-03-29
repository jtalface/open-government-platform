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
      </div>

      <Card className="p-8 space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enquadramento Geográfico e Estratégico</h2>
          <p className="text-gray-700 leading-relaxed">
            A cidade da Beira localiza-se na Baía de Sofala, na região centro da República de
            Moçambique, ocupando uma área de 630 km².
          </p>
          <br />
          <p className="text-gray-700 leading-relaxed">
            Pela sua posição geoestratégica de reconhecida relevância, a Beira constitui-se como
            um dos mais importantes pilares do Corredor da Beira, desempenhando um papel de
            inegável destaque no contexto económico, logístico e portuário do País e da região
            Austral de África. Mercê da existência do seu porto, a cidade afirma-se como uma
            plataforma logística de referência, assegurando a ligação aos países do hinterland
            regional, com particular destaque para o Zimbabwe, a Zâmbia e o Malawi.
          </p>
          <br />
          <p className="text-gray-700 leading-relaxed">
            Do ponto de vista físico e ambiental, a cidade encontra-se inserida num ecossistema
            caracterizado por um complexo sistema de pântanos e estuários, cuja dinâmica resulta
            da interacção entre o rio Púnguè e o Oceano Índico. Esta configuração natural confere
            à Beira características singulares, influenciando, por um lado, a sua vocação económica
            tradicional, alicerçada na pesca, na logística e nas actividades portuárias, e impondo,
            por outro, desafios estruturais permanentes nos domínios da drenagem urbana, da
            protecção costeira e da gestão sustentável do território.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visão: “Beira a Renascer”</h2>
          <p className="text-gray-700 leading-relaxed">
            Ser uma cidade próspera, segura e saudável.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Missão</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Melhorar a qualidade de vida dos munícipes e reforçar a resiliência e a segurança
            face às mudanças climáticas;</li>
            <li>Promover um ambiente atractivo ao investimento e à geração de emprego;</li>
            <li>Garantir serviços de planeamento urbano de qualidade.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Valores</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Governação participativa e inclusiva;</li>
            <li>Promoção e preservação da cultura de cidadania;</li>
            <li>Transparência e comprometimento na gestão da coisa pública;</li>
            <li>Eficiência no funcionamento dos órgãos técnicos e administrativos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Divisão Administrativa</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Em conformidade com a nova divisão administrativa, a cidade da Beira passa a estar
            organizada em 7 postos administrativos municipais e 28 bairros, constituindo esta
            estrutura uma base essencial para a organização territorial, a prestação de serviços
            públicos e a aproximação da governação aos munícipes.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>P.A. Municipal de Palmeiras</li>
            <li>P.A. Municipal do Chiveve</li>
            <li>P.A. Municipal da Munhava</li>
            <li>P.A. Municipal de Nhaconjo</li>
            <li>P.A. Municipal de Inhamízua</li>
            <li>P.A. Municipal de Manga Loforte</li>
            <li>P.A. Municipal de Nhangau</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Consideração Final</h2>
          <div className="space-y-2 text-gray-700">
            <p>
              A cidade da Beira reúne condições geográficas, logísticas, económicas e institucionais
              que a colocam numa posição de elevado relevo no contexto nacional e regional. A
              consolidação da sua visão estratégica, alicerçada numa governação participativa, numa
              administração territorial estruturada e na valorização do seu posicionamento
              geoestratégico, constitui um elemento fundamental para o desenvolvimento sustentável
              e inclusivo do Município.
            </p>
          </div>
        </section>
      </Card>
      </main>
    </div>
  );
}
