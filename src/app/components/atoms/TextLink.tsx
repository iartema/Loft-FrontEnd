interface TextLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function TextLink({ href, children }: TextLinkProps) {
  return (
    <a href={href} className="text-[#A9A9B7] hover:text-white transition text-sm">
      {children}
    </a>
  );
}
