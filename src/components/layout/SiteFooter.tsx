import { Facebook, Youtube } from "lucide-react";

const contacts = [
  {
    label: "Facebook",
    Icon: Facebook,
    url: "https://www.facebook.com/ctnptphatquangbienhoa",
  },
  {
    label: "YouTube",
    Icon: Youtube,
    url: "https://www.youtube.com/@chungthanhnienptpqbienhoa",
  },
];

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Đạo tràng Phật Hào. All rights reserved.</p>
      <nav className="site-footer-contacts" aria-label="Liên hệ Đạo tràng">
        {contacts.map(({ label, Icon, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} Đạo tràng Phật Hào (mở tab mới)`}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
