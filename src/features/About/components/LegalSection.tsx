import type { ReactNode } from "react";

/** Classes partagées par le texte des sections de la page « À propos ». */
export const legalText = {
  paragraph: "text-zinc-600 dark:text-zinc-400",
  subheading: "mt-6 mb-2 font-semibold text-zinc-800 dark:text-zinc-200",
  list: "list-disc space-y-1 pl-5 text-zinc-600 dark:text-zinc-400",
  strong: "font-medium text-zinc-800 dark:text-zinc-200",
  link: "font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-500",
} as const;

interface LegalSectionProps {
  /** Ancre de la section (liens du pied de page). */
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function LegalSection({ id, title, icon, children }: LegalSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
      <h2
        id={`${id}-title`}
        className="mb-4 flex items-center gap-2 text-lg font-semibold text-zinc-800 dark:text-zinc-200"
      >
        {icon}
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** Lien externe ouvert dans un nouvel onglet. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={legalText.link}>
      {children}
    </a>
  );
}
