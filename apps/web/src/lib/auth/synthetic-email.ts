/** Domain for phone-only citizens: digits@{SYNTHETIC_PHONE_EMAIL_DOMAIN} */
export const SYNTHETIC_PHONE_EMAIL_DOMAIN = "beiraewawa.com";

const LEGACY_SYNTHETIC_SUFFIX = "@phone.beira.gov.mz";

export function syntheticEmailFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@${SYNTHETIC_PHONE_EMAIL_DOMAIN}`;
}

/** Map legacy synthetic email to current domain (for login lookup after migration). */
export function normalizeSyntheticEmailForLookup(identifier: string): string {
  const t = identifier.trim();
  if (t.endsWith(LEGACY_SYNTHETIC_SUFFIX)) {
    const local = t.slice(0, -LEGACY_SYNTHETIC_SUFFIX.length);
    return `${local}@${SYNTHETIC_PHONE_EMAIL_DOMAIN}`;
  }
  return t;
}
