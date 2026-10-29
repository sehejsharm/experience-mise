/*
 * Prototype flows, one per portal. Edit here only — no code changes needed.
 *
 * Each flow is its own prototype, shown in order on the page:
 * Author → Manager (send to the floor) → Employee → Manager (review).
 *
 * screen fields:
 *   src       path under /public/screens/
 *   viewport  "desktop" (browser frame) or "mobile" (phone frame)
 *   title     short name, used in the screen picker and step list
 *   caption   one line under the prototype
 *   hotspot   the clickable area, in % of the image: { x, y, w, h }
 *   action    what the hotspot is, e.g. "Publish to pilot"
 */
window.MISE_CONTACT_HREF = "mailto:hello@misehotel.com";

window.MISE_FLOWS = [
  {
    id: "author",
    portal: "Author",
    title: "Turn a standard into a timed sequence",
    summary: "The author brings in the hotel’s own standard, breaks it into timed steps with photos, and publishes it for review.",
    screens: [
      { src: "screens/author_create_standard_steps.jpg", viewport: "desktop",
        title: "Write the steps",
        caption: "Bring in your standard. Mise turns it into a timed sequence.",
        hotspot: { x: 48.4, y: 80.3, w: 28.4, h: 6.2 }, action: "Publish to pilot" },
      { src: "screens/author_standards_queue.jpg", viewport: "desktop",
        title: "Review the queue",
        caption: "Every standard, in one queue — not one supervisor’s head.",
        hotspot: { x: 74.2, y: 71, w: 21.7, h: 5.7 }, action: "Confirm review note" }
    ]
  },
  {
    id: "manager-assign",
    portal: "Manager",
    title: "Send it to the floor",
    summary: "The manager picks the standard, the team and the shift, and sends it to the right phones.",
    screens: [
      { src: "screens/manager_assign_job.jpg", viewport: "desktop",
        title: "Assign the shift",
        caption: "Pick the standard, pick the shift, send it to the floor.",
        hotspot: { x: 59.4, y: 79.2, w: 10.4, h: 5.9 }, action: "Create assignment" }
    ]
  },
  {
    id: "employee",
    portal: "Employee",
    title: "Do the work, step by step",
    summary: "The task lands on the employee’s phone, timed to the shift, and walks them through every step.",
    screens: [
      { src: "screens/staff_task_arrives.jpg", viewport: "mobile",
        title: "The task arrives",
        caption: "The task lands on the right phone, timed to the shift.",
        hotspot: { x: 8.5, y: 72.4, w: 40.3, h: 6.3 }, action: "Open task" },
      { src: "screens/staff_task_steps.jpg", viewport: "mobile",
        title: "Follow the steps",
        caption: "Every step in order, with a target time, exactly as your hotel wrote it.",
        hotspot: { x: 4, y: 48.8, w: 92, h: 6.3 }, action: "Open room task" }
    ]
  },
  {
    id: "manager-review",
    portal: "Manager",
    title: "Review what happened on the floor",
    summary: "Back with the manager: who did the work, the evidence behind it, and what actually changed.",
    screens: [
      { src: "screens/manager_team_evidence_review.jpg", viewport: "desktop",
        title: "Check readiness and evidence",
        caption: "See who’s ready, who’s at risk, before a guest does.",
        hotspot: { x: 90.2, y: 51.4, w: 6.3, h: 6.4 }, action: "Review staff" },
      { src: "screens/manager_sop_results_dashboard.jpg", viewport: "desktop",
        title: "See what changed",
        caption: "Every standard, scored by what actually changed.",
        hotspot: { x: 51.9, y: 62.3, w: 31.4, h: 14.3 }, action: "Open the best result" }
    ]
  }
];
