import type { SVGProps } from "react";

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4C16.2 4.3 15.3 4.2 14.3 4.2c-2.4 0-4 1.5-4 4.1V10.5H8v3h2.3V21h3.2Z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.6 7.5c-.2-.9-.9-1.6-1.8-1.9C18.1 5.2 12 5.2 12 5.2s-6.1 0-7.8.4c-.9.3-1.6 1-1.8 1.9C2 9.1 2 12 2 12s0 2.9.4 4.5c.2.9.9 1.6 1.8 1.9 1.7.4 7.8.4 7.8.4s6.1 0 7.8-.4c.9-.3 1.6-1 1.8-1.9.4-1.6.4-4.5.4-4.5s0-2.9-.4-4.5ZM10 15V9l5.2 3L10 15Z" />
    </svg>
  );
}
