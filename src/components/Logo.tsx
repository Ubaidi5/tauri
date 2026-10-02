export function Logo({ className = 'size-16' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hush-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a2724" />
          <stop offset="1" stopColor="#121110" />
        </linearGradient>
        <linearGradient id="hush-moon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d48f" />
          <stop offset="1" stopColor="#d99a3a" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" rx="232" fill="url(#hush-bg)" />
      <path d="M600 262a262 262 0 1 0 162 452A222 222 0 0 1 600 262Z" fill="url(#hush-moon)" />
      <circle cx="704" cy="330" r="22" fill="#f6d48f" opacity=".9" />
      <circle cx="770" cy="430" r="12" fill="#f6d48f" opacity=".6" />
    </svg>
  )
}
