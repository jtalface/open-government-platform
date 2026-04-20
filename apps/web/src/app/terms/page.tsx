import type { Metadata } from "next";
import { Card } from "@ogp/ui";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { PolicyMarkdownBody } from "@/components/legal/PolicyMarkdownBody";
import { termsOfServiceEn, termsOfServicePt } from "@/content/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service | Beira É Wawa",
  description:
    "Terms of service for the municipal open government platform (English and Portuguese).",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of service</h1>
      <p className="text-sm text-gray-500 mb-8">
        English and Portuguese versions are published on this page.
      </p>

      <Card className="p-6 sm:p-8 mb-10">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900" id="english">
            English
          </h2>
        </div>
        <PolicyMarkdownBody markdown={termsOfServiceEn} />
      </Card>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900" id="portuguese">
            Português
          </h2>
        </div>
        <PolicyMarkdownBody markdown={termsOfServicePt} />
      </Card>
    </LegalPageShell>
  );
}
