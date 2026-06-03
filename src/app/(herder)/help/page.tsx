import { Phone, Mail, Clock, FileText, ShieldCheck, Info } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScreenHeader } from "@/components/shared/ScreenHeader";
import { mn } from "@/lib/i18n/mn";

export default function HelpPage() {
  const { contact, legal } = mn.help;

  return (
    <>
      <ScreenHeader title={mn.help.title} subtitle={mn.help.subtitle} />
      <div className="px-4 pt-2 pb-nav space-y-6">
        {/* Contact */}
        <section aria-label={contact.title} className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">
            {contact.title}
          </h2>
          <div className="divide-y overflow-hidden rounded-lg border bg-card text-card-foreground">
            <a
              href={`tel:${contact.phoneValue.replace(/\s/g, "")}`}
              className="tap flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
            >
              <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-sm">{contact.phone}</span>
              <span className="font-mono text-sm text-muted-foreground">
                {contact.phoneValue}
              </span>
            </a>
            <a
              href={`mailto:${contact.emailValue}`}
              className="tap flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
            >
              <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-sm">{contact.email}</span>
              <span className="text-sm text-muted-foreground">
                {contact.emailValue}
              </span>
            </a>
            <div className="flex items-center gap-3 px-4 py-3">
              <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-sm">{contact.hours}</span>
              <span className="text-sm text-muted-foreground">
                {contact.hoursValue}
              </span>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section aria-label={legal.title} className="space-y-2">
          <h2 className="px-1 text-sm font-medium text-muted-foreground">
            {legal.title}
          </h2>
          <div className="divide-y rounded-lg border bg-card text-card-foreground">
            <LegalItem Icon={FileText} title={legal.terms} body={legal.termsBody} />
            <LegalItem
              Icon={ShieldCheck}
              title={legal.privacy}
              body={legal.privacyBody}
            />
            <LegalItem Icon={Info} title={legal.about} body={legal.aboutBody} />
          </div>
        </section>

        <p className="pt-2 text-center font-mono text-xs text-muted-foreground">
          Belchee v0.0.1
        </p>
      </div>
    </>
  );
}

function LegalItem({
  Icon,
  title,
  body,
}: {
  Icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <p className="mt-1.5 pl-7 text-xs leading-relaxed text-muted-foreground">
        {body}
      </p>
    </div>
  );
}
