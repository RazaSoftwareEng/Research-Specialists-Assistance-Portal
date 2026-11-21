const P = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  docs: 'M9 12h6m-6 4h6M7 4h7l5 5v11a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z',
  upload: 'M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2',
  users: 'M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M10 11a4 4 0 100-8 4 4 0 000 8zM21 20v-1a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8',
  mail: 'M4 6h16v12H4zM4 6l8 7 8-7',
  user: 'M20 21v-1a6 6 0 00-6-6h-4a6 6 0 00-6 6v1M12 11a4 4 0 100-8 4 4 0 000 8z',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18',
  logout: 'M15 17l5-5-5-5M20 12H9M12 21H5a1 1 0 01-1-1V4a1 1 0 011-1h7',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  clock: 'M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  check: 'M5 13l4 4L19 7',
  alert: 'M12 9v4m0 4h.01M10.3 3.9L2 18a2 2 0 001.7 3h16.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  x: 'M6 6l12 12M18 6L6 18',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  refresh: 'M4 4v5h5M20 20v-5h-5M5.6 15a7 7 0 0011.9 2.3M18.4 9A7 7 0 006.5 6.7',
  shield: 'M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z',
  key: 'M15 7a3 3 0 11-6 0 3 3 0 016 0zM12 10v11M12 15h3M12 18h2',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z',
  building: 'M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M15 9h4a1 1 0 011 1v11M8 8h3M8 12h3M8 16h3M3 21h18',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  inbox: 'M4 13h4l1 3h6l1-3h4M4 13l2-8h12l2 8v6H4v-6z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  more: 'M12 6h.01M12 12h.01M12 18h.01',
  filter: 'M4 5h16l-6 8v6l-4-2v-4L4 5z',
}

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={P[name]} />
    </svg>
  )
}
