/*
 * Experience manifest. Edit here only — no other code changes needed.
 *
 * kind: "screen" → a real product screenshot in a frame.
 *       "scene"  → an animated illustration (no product UI is faked).
 * src: path under /public/screens/ (null = "coming soon" placeholder).
 * viewport: "desktop" → browser frame, "mobile" → phone frame.
 * hotspot: position as % of image width / height.
 * points: the short tiles shown beside the frame.
 * short: label on the timeline. callout: label beside the hotspot.
 */
window.MISE_CONTACT_HREF = "mailto:hello@misehotel.com";

window.MISE_JOURNEY = [
  { kind: "scene", scene: "intake", short: "Bring it in", role: "Author",
    title: "Start with what you already have.",
    caption: "Binders, chat threads, a supervisor's memory. Mise brings them into one place.",
    points: ["Your hotel's own standards", "Every department", "Nothing rewritten for you"] },

  { kind: "screen", src: "screens/author_standards_queue.jpg", short: "One queue", callout: "Confirm & publish", role: "Author", viewport: "desktop",
    title: "One queue for every standard.",
    caption: "Every standard, in one queue — not one supervisor's head.", hotspot: { x: 85, y: 74 },
    points: ["Front office to spa, side by side", "Review status at a glance", "Confirm and publish"] },

  { kind: "screen", src: "screens/author_create_standard_steps.jpg", short: "Sequence", callout: "Publish the sequence", role: "Author", viewport: "desktop",
    title: "From standard to timed sequence.",
    caption: "Bring in your standard. Mise turns it into a timed sequence.", hotspot: { x: 63, y: 83 },
    points: ["Numbered steps with reference photos", "What must be true at the end", "Supervisor release check"] },

  { kind: "screen", src: null, short: "Arrives", role: "Staff", viewport: "mobile",
    title: "The task arrives on the floor.",
    caption: "Coming soon: the timed task arriving on a staff phone.",
    points: ["On the phone already in their pocket", "Timed to the shift", "In every department"] },

  { kind: "screen", src: null, short: "Proof", role: "Staff", viewport: "mobile",
    title: "Done step by step, with proof.",
    caption: "Coming soon: working the task step by step, with photo proof.",
    points: ["One step at a time", "Photo evidence as the work happens", "Supervisor sign-off"] },

  { kind: "screen", src: "screens/manager_assign_job.jpg", short: "Assign", callout: "Send to the floor", role: "Manager", viewport: "desktop",
    title: "Send it to the floor.",
    caption: "Pick the standard, pick the shift, send it to the floor.", hotspot: { x: 64, y: 82 },
    points: ["Choose the standard and the team", "Set the shift and due time", "Delivered to staff phones"] },

  { kind: "screen", src: "screens/manager_team_evidence_review.jpg", short: "Readiness", callout: "Review the evidence", role: "Manager", viewport: "desktop",
    title: "Know who's ready.",
    caption: "See who's ready, who's at risk, before a guest does.", hotspot: { x: 93, y: 54 },
    points: ["Readiness for every person", "Evidence attached to every task", "Risk flagged before the guest sees it"] },

  { kind: "screen", src: "screens/manager_sop_results_dashboard.jpg", short: "Results", callout: "See what changed", role: "Manager", viewport: "desktop",
    title: "Scored by what changed.",
    caption: "Every standard, scored by what actually changed.", hotspot: { x: 81, y: 69 },
    points: ["Observed outcomes, not completions", "Compare roles and properties", "Reinforce what works"] },

  { kind: "scene", scene: "record", short: "Record", role: "Manager",
    title: "An audit-ready service record.",
    caption: "Every task, photo and sign-off, kept as one record you can show an inspector.",
    points: ["Timestamped evidence", "Supervisor sign-offs", "Ready when the inspector is"] }
];
