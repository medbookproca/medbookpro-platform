# Accessibility review

## Review scope

The review covered the App Router layout, authentication forms, shared UI primitives, representative application forms, links, alerts, loading states, and responsive layout classes. It was source-level and automated-test based; it was not a certification.

## Findings

- Semantic form controls and labels are present in the shared form primitives and authentication flows.
- The root document declares `lang="en-CA"`; links use application navigation primitives.
- Visible focus styles are present in the reviewed controls and links.
- Responsive Tailwind layouts are used, but device and zoom testing remains required for every pilot-critical route.
- Screen-reader announcements for asynchronous form errors, loading state transitions, and route changes require manual verification.
- Contrast has not been measured against WCAG 2.2 AA with a production theme; this remains a release gate.

## Required follow-up

- [ ] Keyboard-only pass for sign-in, onboarding, appointments, clinical, patient portal, and support-critical routes.
- [ ] Screen-reader pass with VoiceOver/NVDA for labels, errors, dialogs, tables, and status updates.
- [ ] Verify focus return after dialogs, navigation, validation errors, and failed submissions.
- [ ] Measure text, control, focus, and disabled-state contrast at normal and high zoom.
- [ ] Verify reflow at 320 CSS px and 200% text zoom without loss of task content.
- [ ] Assign and retest every WCAG gap before pilot approval.
