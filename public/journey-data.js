/*
 * Experience manifest. Edit here only — no other code changes needed.
 *
 * Each step is a real product screenshot in a frame.
 * src: path under /public/screens/ (null = "coming soon" placeholder).
 * role: chapter the step belongs to. Consecutive steps with the same role form
 *   one chapter on the chapter rail (Author → Staff → Manager).
 * viewport: "desktop" → browser frame, "mobile" → phone frame.
 * hotspot: position as % of image width / height (the camera zooms here).
 * callout: label beside the hotspot. short: label on the timeline.
 * points: the short tiles shown beside the frame.
 * duration (optional): autoplay time in ms. By default it follows the amount of text.
 */
window.MISE_CONTACT_HREF = "mailto:hello@misehotel.com";

/* One line under each chapter on the chapter rail (optional). */
window.MISE_ROLES = {
  Author: "Writes the standard",
  Staff: "Does the work",
  Manager: "Sees the proof"
};

window.MISE_JOURNEY = [

  { kind: "screen", src: "screens/author_standards_queue.jpg", short: "One queue", callout: "Confirm the review", role: "Author", viewport: "desktop",
    title: "One queue for every standard.",
    caption: "Every standard, in one queue — not one supervisor's head.", hotspot: { x: 85, y: 74 },
    points: ["Front office to spa, side by side", "Review status at a glance", "Reviewed before it's published"] },

  { kind: "screen", src: "screens/author_create_standard_steps.jpg", short: "Timed steps", callout: "Publish the sequence", role: "Author", viewport: "desktop",
    title: "From standard to timed sequence.",
    caption: "Bring in your standard. Mise turns it into a timed sequence.", hotspot: { x: 63, y: 83 },
    points: ["Numbered steps with reference photos", "What must be true at the end", "Supervisor release check"] },

  { kind: "screen", src: "screens/staff_task_arrives.jpg", short: "Task arrives", callout: "Open the task", role: "Staff", viewport: "mobile",
    title: "The task arrives on the floor.",
    caption: "The task lands on the right phone, timed to the shift.", hotspot: { x: 28, y: 75 },
    points: ["On the phone already in their pocket", "Timed to the shift", "In every department"] },

  { kind: "screen", src: "screens/staff_task_steps.jpg", short: "Step by step", callout: "Start the task", role: "Staff", viewport: "mobile",
    title: "Done step by step, the way you do it.",
    caption: "Every step in order, with a target time, exactly as your hotel wrote it.", hotspot: { x: 50, y: 52 },
    points: ["One step at a time", "Coaching notes on every step", "Independent check before release"] },

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
    points: ["Observed outcomes, not completions", "Compare roles and properties", "Reinforce what works"] }
];
