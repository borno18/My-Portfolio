export const projects = [
  {
    slug: 'attendance-app',
    name: 'Smart Proximity Attendance',
    type: 'Android application',
    summary: 'An offline Flutter app for running class attendance over nearby device connections.',
    stack: 'Flutter · Dart · SQLite · Android Nearby Connections',
    repo: 'https://github.com/borno18/Android-Project',
    sections: [
      ['The problem', 'Instructors need a quick, reliable way to collect attendance when classroom Wi-Fi is unreliable. The workflow also needs to accommodate large rosters and give instructors a record to review after class.'],
      ['The workflow', 'An instructor imports a class roster, starts a nearby session, and monitors check-ins. The app stores session history locally and exports attendance reports as CSV.'],
      ['The engineering', 'Flutter powers the interface, Android Nearby Connections links devices during a session, and SQLite keeps rosters and attendance history on the device. The repository also documents OCR-assisted roster entry.'],
    ],
  },
  {
    slug: 'swe-sports-week',
    name: 'SWE Sports Week',
    type: 'Web application',
    summary: 'A tournament hub for SWE Society, SUST, with fixtures, live brackets, and an organizer dashboard.',
    stack: 'Next.js · TypeScript · Turso',
    repo: 'https://github.com/borno18/swe-sports-week',
    live: 'https://swe-sports-week.vercel.app/',
    sections: [
      ['The problem', 'Running several sports at once means keeping fixtures, venues, and results in sync for organizers and participants. A correction should reach the public bracket without asking organizers to rebuild it.'],
      ['The workflow', 'Organizers publish a bracket, then record match results. Winners advance automatically. If a result is corrected, dependent matches are cleared and unrelated results are preserved.'],
      ['The engineering', 'Result propagation and change history are saved in a transaction. Version checks protect against stale edits. Public pages check a small revision endpoint and refresh when results change.'],
    ]
  },
  {
    slug: 'pookie-prep',
    featured: false,
    name: 'Pookie Prep',
    type: 'Android application',
    summary: 'A Bengali-first Flutter app for medical admission practice that runs offline.',
    stack: 'Flutter · Dart · SQLite',
    repo: 'https://github.com/borno18/PookiePrep',
    release: 'https://github.com/borno18/PookiePrep/releases/tag/v.1.1',
    sections: [
      ['The problem', 'Medical admission candidates need a way to practice general knowledge in Bengali, review mistakes, and keep studying with an unreliable connection.'],
      ['The workflow', 'Learners choose topics and question counts, work through a timed practice session, then review missed answers in a dedicated notebook.'],
      ['The engineering', 'Questions ship with the app and progress stays on device. Bengali numerals and labels are part of the core interface. The scoring rules award one mark for a correct answer and deduct a quarter mark for a wrong one.'],
    ]
  },
  {
    slug: 'queuestorm',
    name: 'QueueStorm Investigator',
    type: 'Team backend project',
    summary: 'A FastAPI service that checks transaction evidence and helps support agents route tickets.',
    stack: 'FastAPI · Python · Pydantic',
    repo: 'https://github.com/borno18/CSE_FEST_Preli',
    sections: [
      ['The problem', 'During a high-volume campaign, support agents need a consistent way to compare a customer’s report with recent transaction records.'],
      ['The workflow', 'The service validates a support ticket, compares it with the supplied ledger, and returns a typed verdict, suggested department, and draft reply for a human agent.'],
      ['The engineering', 'Deterministic matching establishes the evidence first. Gemini assists with classification and drafting, with a rules-based fallback when the model is unavailable. This case study describes the team’s system.'],
    ]
  }
];

export function projectDisplay(settings = []) {
  const overrides = new Map(settings.map(setting => [setting.slug, setting]));
  return projects.map((project, index) => {
    const setting = overrides.get(project.slug);
    return {
      ...project,
      featured: setting?.featured ?? project.featured !== false,
      display_order: setting?.display_order ?? index * 10,
    };
  }).sort((a, b) => a.display_order - b.display_order);
}
