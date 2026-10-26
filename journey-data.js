/*
 * Screenshot journey manifest. Edit here only — no other code changes needed.
 * src: path under /public/screens/ (null = "coming soon" placeholder).
 * viewport: "desktop" → browser frame, "mobile" → phone frame.
 * hotspot: position as % of image width / height.
 * NOTE: filenames are provisional until Sehej confirms the final names.
 */
window.MISE_CONTACT_HREF = "#"; // TODO: set to mailto: or a contact form URL

window.MISE_JOURNEY = [
  { src: "public/screens/author_standards_queue.jpg", role: "Author", viewport: "desktop",
    caption: "Every standard, in one queue — not one supervisor's head.", hotspot: { x: 85, y: 74 } },
  { src: "public/screens/author_create_standard_steps.jpg", role: "Author", viewport: "desktop",
    caption: "Bring in your standard. Mise turns it into a timed sequence.", hotspot: { x: 63, y: 83 } },
  { src: null, role: "Staff", viewport: "mobile",
    caption: "Coming soon: the timed task arriving on a staff phone.", hotspot: null },
  { src: null, role: "Staff", viewport: "mobile",
    caption: "Coming soon: working the task step by step, with photo proof.", hotspot: null },
  { src: "public/screens/manager_assign_job.jpg", role: "Manager", viewport: "desktop",
    caption: "Pick the standard, pick the shift, send it to the floor.", hotspot: { x: 64, y: 82 } },
  { src: "public/screens/manager_team_evidence_review.jpg", role: "Manager", viewport: "desktop",
    caption: "See who's ready, who's at risk, before a guest does.", hotspot: { x: 93, y: 54 } },
  { src: "public/screens/manager_sop_results_dashboard.jpg", role: "Manager", viewport: "desktop",
    caption: "Every standard, scored by what actually changed.", hotspot: { x: 81, y: 69 } }
];
