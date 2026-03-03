/**
 * Organizational chart data for Câmara Municipal da Beira (2017-2021)
 * Simplified structure showing only PRESIDENTE and top-level vereações
 */

export type OrgNodeKind = "top" | "vereacao" | "gabinete" | "departamento";

export type OrgNode = {
  id: string;
  parentId: string | null;
  title: string;
  kind: OrgNodeKind;
};

export const orgChartData: OrgNode[] = [
  // TOP LEVEL
  {
    id: "presidente",
    parentId: null,
    title: "PRESIDENTE",
    kind: "top",
  },

  // TOP-LEVEL BRANCHES UNDER PRESIDENTE
  {
    id: "vereacao-desenvolvimento-humano-institucional",
    parentId: "presidente",
    title: "VEREAÇÃO DE DESENVOLVIMENTO HUMANO E INSTITUCIONAL",
    kind: "vereacao",
  },
  {
    id: "vereacao-plano-financas",
    parentId: "presidente",
    title: "VEREAÇÃO DO PLANO, FINANÇAS",
    kind: "vereacao",
  },
  {
    id: "vereacao-construcao-infraestruturas-urbanizacao",
    parentId: "presidente",
    title: "VEREAÇÃO DE CONSTRUÇÃO, INFRA-ESTRUTURAS E URBANIZAÇÃO",
    kind: "vereacao",
  },
  {
    id: "vereacao-gestao-urbana-equipamentos",
    parentId: "presidente",
    title: "VEREAÇÃO DE GESTÃO URBANA E EQUIPAMENTOS",
    kind: "vereacao",
  },
  {
    id: "vereacao-saude-accao-social-genero",
    parentId: "presidente",
    title: "VEREAÇÃO DA SAÚDE, ACÇÃO SOCIAL E GÉNERO",
    kind: "vereacao",
  },
  {
    id: "vereacao-industria-comercio-turismo-mercados-feiras",
    parentId: "presidente",
    title: "VEREAÇÃO DA INDÚSTRIA, COMÉRCIO, TURÍSMO, MERCADOS E FEIRAS",
    kind: "vereacao",
  },
  {
    id: "vereacao-proteccao-civil-sistema-transportes-transito-rodoviario-energia",
    parentId: "presidente",
    title: "VEREAÇÃO DE PROTECÇÃO CIVIL, SISTEMA DE TRANSPORTES, TRÂNSITO RODOVIÁRIO E ENERGIA",
    kind: "vereacao",
  },
  {
    id: "vereacao-juventude-desportos",
    parentId: "presidente",
    title: "VEREAÇÃO DE JUVENTUDE E DESPORTOS",
    kind: "vereacao",
  },
  {
    id: "vereacao-agro-pecuaria-pescas-meio-ambiente",
    parentId: "presidente",
    title: "VEREAÇÃO DE AGRO-PECUÁRIA, PESCAS E MEIO AMBIENTE",
    kind: "vereacao",
  },
  {
    id: "vereacao-educacao-cultura",
    parentId: "presidente",
    title: "VEREAÇÃO DE EDUCAÇÃO E CULTURA",
    kind: "vereacao",
  },
];
