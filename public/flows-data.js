/*
 * Prototype flows, one per portal. Edit here only — no code changes needed.
 *
 * Each flow is its own prototype, shown in order on the page:
 * Author → Manager → Employee. Every screen is a real product screenshot.
 *
 * screen fields:
 *   src       path under /public/screens/
 *   viewport  "desktop" (browser frame) or "mobile" (phone frame)
 *   title     short name, used in the screen picker and step list
 *   caption   one line under the prototype
 *   hotspot   the clickable area, in % of the image: { x, y, w, h }
 *   action    what the hotspot is, e.g. "Approve for my team"
 */
window.MISE_CONTACT_HREF = "mailto:hello@misehotel.com";

window.MISE_FLOWS = [
  {
    id: "author",
    portal: "Author",
    title: "Write the standard once",
    summary: "The author writes the standard the way the hotel already works: who it’s for, how long it should take, and every step in plain words. Then one exact version is published.",
    screens: [
      { src: "screens/steps/author-1-my-standards.jpg", viewport: "desktop",
        title: "Start a new standard",
        caption: "Every standard the hotel runs, drafts and published, in one place.",
        hotspot: { x: 24.5, y: 19.8, w: 13.1, h: 5.8 }, action: "Create a new standard" },
      { src: "screens/steps/author-2-create.jpg", viewport: "desktop",
        title: "Set the essentials",
        caption: "Name it, say who it’s for, and give it a time target.",
        hotspot: { x: 25.9, y: 41.4, w: 68.5, h: 5.7 }, action: "Fill in the essentials" },
      { src: "screens/steps/author-3-steps.jpg", viewport: "desktop",
        title: "Write the steps",
        caption: "Plain words. What to do, when to stop, what a good finish looks like.",
        hotspot: { x: 25.9, y: 30.7, w: 68.5, h: 12.2 }, action: "Write the next step" },
      { src: "screens/steps/author-4-save-draft.jpg", viewport: "desktop",
        title: "Save the draft",
        caption: "Six steps in. Nothing reaches the floor until it’s published.",
        hotspot: { x: 85.7, y: 83.6, w: 9.2, h: 5.2 }, action: "Save draft" },
      { src: "screens/steps/author-5-published.jpg", viewport: "desktop",
        title: "Publish it",
        caption: "Published. Each manager now approves this exact version for their team.",
        hotspot: { x: 78.8, y: 84, w: 16.2, h: 5.2 }, action: "Read the published standard" }
    ]
  },
  {
    id: "manager",
    portal: "Manager",
    title: "Approve it, then send it to the floor",
    summary: "The manager reads the new standard, approves it for their team, and gives a room to one named person with a start and a finish time.",
    screens: [
      { src: "screens/steps/manager-6-approval-list.jpg", viewport: "desktop",
        title: "See what’s waiting",
        caption: "New standards wait here until a manager has read them.",
        hotspot: { x: 24.5, y: 44.8, w: 72.8, h: 8.6 }, action: "Open the new standard" },
      { src: "screens/steps/manager-7-approve.jpg", viewport: "desktop",
        title: "Approve for the team",
        caption: "Read it, tick it, approve it. Nobody works from a version their manager hasn’t seen.",
        hotspot: { x: 24.9, y: 72.1, w: 14.8, h: 5.5 }, action: "Approve for my team" },
      { src: "screens/steps/manager-8-assign.jpg", viewport: "desktop",
        title: "Assign the next room",
        caption: "Pick the shift and the approved standard. One owner per room.",
        hotspot: { x: 25.6, y: 79.9, w: 30, h: 8.6 }, action: "Choose a staff member" },
      { src: "screens/steps/manager-9-details.jpg", viewport: "desktop",
        title: "Set the time slot",
        caption: "The person, the room, and a finish time taken from the standard’s own target.",
        hotspot: { x: 25.5, y: 92.4, w: 18.4, h: 6.2 }, action: "Assign Room 104 to Joseph" },
      { src: "screens/steps/manager-10-assigned.jpg", viewport: "desktop",
        title: "Room assigned",
        caption: "Assigned. The room is already on Joseph’s list for this shift.",
        hotspot: { x: 24.5, y: 43.9, w: 72.8, h: 15.2 }, action: "Go to Joseph’s shift" }
    ]
  },
  {
    id: "employee",
    portal: "Employee",
    title: "Do the work, step by step",
    summary: "The room lands on the employee’s screen with its time slot. They start it, tick each step as it’s done, and send it back for a manager check.",
    screens: [
      { src: "screens/steps/employee-11-today.jpg", viewport: "desktop",
        title: "Check in for the shift",
        caption: "Check in. The next room is at the top, with its time target.",
        hotspot: { x: 26.8, y: 58.1, w: 25.8, h: 6.6 }, action: "Open room" },
      { src: "screens/steps/employee-12-room.jpg", viewport: "desktop",
        title: "Open the room",
        caption: "The exact steps the author wrote, in the same order.",
        hotspot: { x: 39.6, y: 18.3, w: 42.5, h: 6.4 }, action: "Start room task" },
      { src: "screens/steps/employee-13-started.jpg", viewport: "desktop",
        title: "Work the steps",
        caption: "The clock is running. Tick each step as it’s done.",
        hotspot: { x: 39.6, y: 33.8, w: 42.5, h: 32.4 }, action: "Tick each step" },
      { src: "screens/steps/employee-14-all-checked.jpg", viewport: "desktop",
        title: "All steps done",
        caption: "Three of three done. Saved, not sent yet.",
        hotspot: { x: 39.6, y: 61.3, w: 42.5, h: 6.5 }, action: "Save the final room check" },
      { src: "screens/steps/employee-15-send.jpg", viewport: "desktop",
        title: "Send for a manager check",
        caption: "Every step confirmed. Now a second pair of eyes.",
        hotspot: { x: 39.6, y: 61.6, w: 42.5, h: 6.5 }, action: "Send room for manager check" },
      { src: "screens/steps/employee-16-submitted.jpg", viewport: "desktop",
        title: "With the manager",
        caption: "Submitted for an independent check. The work is on record.",
        hotspot: { x: 39.6, y: 22.4, w: 42.5, h: 6.2 }, action: "Waiting for manager check" }
    ]
  }
];
