import { CreditsSection } from "../components/CreditsSection";
import { LegalNoticeSection } from "../components/LegalNoticeSection";
import { PrivacySection } from "../components/PrivacySection";

export function AboutView() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">À propos</h1>
      <CreditsSection />
      <LegalNoticeSection />
      <PrivacySection />
    </div>
  );
}
