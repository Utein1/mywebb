import { Globe2, Mail, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { SocialLink } from "../../shared/types";
import { isSafeLink } from "../lib/format";
import {
  DribbbleIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  XIcon,
} from "./BrandIcons";

type SocialIcon = LucideIcon | ComponentType<{ size?: number }>;

function iconFor(label: string): SocialIcon {
  const normalized = label.toLowerCase();
  if (normalized.includes("github")) return GithubIcon;
  if (
    normalized.includes("x") ||
    normalized.includes("twitter") ||
    normalized.includes("推特")
  ) {
    return XIcon;
  }
  if (normalized.includes("linkedin") || normalized.includes("领英")) {
    return LinkedinIcon;
  }
  if (
    normalized.includes("email") ||
    normalized.includes("mail") ||
    normalized.includes("邮箱")
  ) {
    return Mail;
  }
  if (normalized.includes("instagram")) return InstagramIcon;
  if (normalized.includes("dribbble")) return DribbbleIcon;
  return Globe2;
}

export function SocialIconLink({
  social,
  className = "",
}: {
  social: SocialLink;
  className?: string;
}) {
  const Icon = iconFor(social.label);
  const safe = isSafeLink(social.url);
  return (
    <a
      href={safe ? social.url : undefined}
      className={`social-icon ${className}`.trim()}
      target={/^https?:\/\//i.test(social.url) ? "_blank" : undefined}
      rel={/^https?:\/\//i.test(social.url) ? "noreferrer noopener" : undefined}
      aria-label={social.label}
      title={social.label}
    >
      <Icon size={17} />
    </a>
  );
}

export function SocialLinks({
  socials,
  className = "",
}: {
  socials: SocialLink[];
  className?: string;
}) {
  if (socials.length === 0) return null;
  return (
    <div className={`social-links ${className}`.trim()}>
      {socials.map((social, index) => (
        <SocialIconLink key={`${social.label}-${index}`} social={social} />
      ))}
    </div>
  );
}
