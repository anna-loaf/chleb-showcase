// Proste ikony liniowe (currentColor). Dekoracyjne — znaczenie zawsze niesie tekst obok.
const PATHS = {
  piec: 'M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z M9 10.5l1.2 1.8 M12 9.5l1.2 1.8 M15 10.5l1.2 1.8',
  chat: 'M20.5 12a8 8 0 0 1-11.7 7.1L4 20.2l1.2-4.5A8 8 0 1 1 20.5 12z',
  jar: 'M8 3.5h8 M7 6.5h10 M7 6.5C5.3 7.6 4.5 9.2 4.5 11v7a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-7c0-1.8-.8-3.4-2.5-4.5 M9 12h6v4H9z',
  book: 'M5.5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v13H8a2.5 2.5 0 0 1-2.5-2.5z M5.5 17.5A2.5 2.5 0 0 1 8 15h11 M9.5 8.5h5',
  sliders: 'M4 7h9 M17 7h3 M4 17h3 M11 17h9 M15 5v4 M9 15v4',
  plus: 'M12 5v14 M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  swap: 'M4 9h13l-3.5-3.5 M20 15H7l3.5 3.5',
  send: 'M12 19V6 M6.5 11.5L12 6l5.5 5.5',
  close: 'M6 6l12 12 M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
  alert: 'M12 4.5l8.5 15h-17z M12 10v4.5 M12 17.2v.3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7.5V12l3 2',
  trash: 'M5 7h14 M10 11v6 M14 11v6 M6.5 7l.8 11.5A2 2 0 0 0 9.3 20.5h5.4a2 2 0 0 0 2-2L17.5 7 M9.5 7V4.5h5V7',
  link: 'M14 4.5h5.5V10 M19.5 4.5L11 13 M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4',
  leaf: 'M5 19c6.5 0 14-5 14-14C10 5 5 12.5 5 19z M5 19l7.5-7.5',
  pencil: 'M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4',
  download: 'M12 4v11 M7 10.5l5 5 5-5 M5 20h14',
  upload: 'M12 20V9 M7 13.5l5-5 5 5 M5 4h14',
  bell: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15z M10 20.5a2 2 0 0 0 4 0',
  paste: 'M9 3.5h6v3H9z M8 5H6.5A1.5 1.5 0 0 0 5 6.5v13A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 17.5 5H16 M9 12h6 M9 16h4',
  calendar: 'M4.5 7.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z M4.5 10.5h15 M8.5 3.5v4 M15.5 3.5v4',
  pin: 'M12 21s6.5-6 6.5-11.5a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21z M12 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  mail: 'M4 6.5h16v11H4z M4.5 7l7.5 6 7.5-6',
};

export function Icon({ name, size = 22, strokeWidth = 1.8, className, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d={PATHS[name]} />
    </svg>
  );
}
