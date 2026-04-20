import type { Metadata } from "next";
import { Card } from "@ogp/ui";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { PolicyMarkdownBody } from "@/components/legal/PolicyMarkdownBody";
import { privacyPolicyEn, privacyPolicyPt } from "@/content/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | Beira É Wawa",
  description:
    "Privacy policy for the municipal open government platform (English and Portuguese).",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        English and Portuguese versions are published on this page for transparency.
      </p>

      <Card className="p-6 sm:p-8 mb-10">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900" id="english">
            English
          </h2>
        </div>
        <PolicyMarkdownBody markdown={privacyPolicyEn} />
      </Card>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-900" id="portuguese">
            Português
          </h2>
        </div>
        <PolicyMarkdownBody markdown={privacyPolicyPt} />
      </Card>
    </LegalPageShell>
  );
}
