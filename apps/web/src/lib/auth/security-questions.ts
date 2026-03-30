/**
 * Predefined security questions for registration and password reset.
 * IDs are stored on the user; answers are stored bcrypt-hashed.
 */

export type SecurityQuestionLocale = "pt" | "en";

export const SECURITY_QUESTIONS = [
  {
    id: 1,
    pt: "Qual é o local onde nasceu (cidade ou posto administrativo)?",
    en: "Where were you born (city or district)?",
  },
  {
    id: 2,
    pt: "Qual é o primeiro nome da sua mãe?",
    en: "What is your mother's first name?",
  },
  {
    id: 3,
    pt: "Qual é o primeiro nome do seu pai?",
    en: "What is your father's first name?",
  },
  {
    id: 4,
    pt: "Qual é o nome do bairro onde vive actualmente?",
    en: "What is the name of the neighborhood where you currently live?",
  },
  {
    id: 5,
    pt: "Qual é o nome da primeira escola primária que frequentou?",
    en: "What was the name of the first primary school you attended?",
  },
  {
    id: 6,
    pt: "Em que ano nasceu? (quatro dígitos)",
    en: "In what year were you born? (four digits)",
  },
  {
    id: 7,
    pt: "Qual é o seu prato ou comida favorita?",
    en: "What is your favorite food or dish?",
  },
  {
    id: 8,
    pt: "Qual é o nome de solteira da sua avó materna?",
    en: "What is your maternal grandmother's maiden name?",
  },
  {
    id: 9,
    pt: "Qual é o segundo nome próprio (do meio) que consta no seu BI?",
    en: "What middle name appears on your ID document?",
  },
  {
    id: 10,
    pt: "Qual é o nome da rua ou zona onde cresceu?",
    en: "What street or area did you grow up in?",
  },
] as const;

const IDS = new Set(SECURITY_QUESTIONS.map((q) => q.id));

export function isValidSecurityQuestionId(id: number): boolean {
  return IDS.has(id);
}

export function getSecurityQuestionLabel(id: number, locale: SecurityQuestionLocale): string {
  const q = SECURITY_QUESTIONS.find((x) => x.id === id);
  if (!q) return "";
  return locale === "en" ? q.en : q.pt;
}

/**
 * Normalize before hashing (registration) or comparing (password reset).
 * Case-insensitive: all answers are lowercased. Also trims whitespace and
 * strips Unicode combining marks (accents) so "São" and "sao" match after NFD.
 */
export function normalizeSecurityAnswer(raw: string): string {
  return raw
    .trim()
    .toLocaleLowerCase("pt")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
