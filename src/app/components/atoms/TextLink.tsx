interface TextLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function TextLink({ href, children }: TextLinkProps) {
  return (
    <a href={href} className="text-[var(--fg-muted)] hover:text-white transition text-sm">
      {children}
    </a>
  );
}
