# Tinyrex learning lab

## Boundary and provenance

The homepage is `src/views/TinyRexLab.astro`; its original components and contained CSS live in
`src/components/tinyrex/`. Browser code and pure model math live in `public/tinyrex/`. No new
dependencies, external requests, persistent state, meshes, renderer or hardware interface are added.
The hero is an original SVG illustration, explicitly a schematic, not a render or exact CAD view.
The site inherits system light/dark preferences and the shared JetBrains Mono / pixel-t identity.
Ochre is #A78020 in light and #E4C563 in dark; lime is confined to the robot illustration.

Facts were read from the native Tinyrex repository (HEAD
`a40e994a88fd3abd71caf972dc9267e8a7fef1ad`) on 2026-10-30. The design sources below
were clean relative to HEAD; `CREDITS.md` was a locally modified, read-only source snapshot:

- `AGENTS.md`: 18 XL330 joints; Blender → PolyCore STEP → Polykrom → MuJoCo workflow.
- `design/BOM.md`: five joints per leg; eight head/neck, jaw, tail and shoulder joints; electronics
  and materials. A design BOM is not evidence of an assembled, tested machine.
- `design/blender/joint_limits.json`: degree-valued model-swept ranges displayed by the explorer.
  This is intentionally the collision-sweep source, not the slightly different, rounded radian
  bounds in `design/sim/servos.json`. The latter also labels servo IDs as placeholders.
- `design/AUDIT.md`: current design audit and open items. No audit performance figures are promoted
  as independently verified results here.
- `design/MASS.md`: computed mass/balance methodology; linked, not presented as measured mass.
- `CREDITS.md`: Microduck MJCF/layout lineage and Open Duck Mini inspiration, with upstream links.

The old 17-joint / Feetech / 1.68 kg design is only linked under an explicitly historical archive.
No native repository files, old public/rex assets, shared layout or brand kit were changed.

## Educational models

- Joint explorer: all 18 joints, source limits and an abstract axis-plane rotation. It is not a
  coupled 3D collision model, servo calibration, or safe-pose generator.
- Support polygon: convex hull of active 28 × 65 mm rectangular lesson contacts. Signed margin is
  the shortest Euclidean distance to the hull boundary, positive inside and negative outside.
  Foot spacing and CoM are independent variables. Fixed, flat, quasi-static support only.
- Gait: two 80 mm links, fixed hip, 62% stance and 38% sinusoidal-lift swing. Analytic IK chooses one
  bend branch. Unreachable targets clamp to the geometric reachable annulus and remain visibly
  identified. Angles use downward-positive y, not the native robot’s conventions or constraints.
  No inertia, balance, actuator torque, friction or ground-contact solver is included.

All motion starts paused (including reduced-motion users), can be scrubbed/reset, and pauses when
offscreen, hidden, or motion preference changes. A reduced-motion user can explicitly opt into
playback with Play. Quiz answers remain in DOM memory and disappear on refresh. Native controls
provide keyboard interaction; feedback is textual, not colour-only. No remote fonts or analytics.

## Checks

From this repository with existing dependencies available:

```sh
node --test scripts/tinyrex-models.test.mjs
SITE_KEY=tinyrex node node_modules/astro/bin/astro.mjs build
SITE_KEY=tinyrex node scripts/postbuild.mjs
node scripts/check-links.mjs
node scripts/tinyrex-browser.mjs
```

The browser check uses installed `playwright-core` and Google Chrome, starts a loopback-only static
server, and verifies 1440/768/390/320 px in light/dark, range keyboard operation, joint selection,
balance, gait reachability, play/pause/reset, quizzes, overflow, page errors, failed resources and
absence of external browser requests. Screenshots go outside git. It also checks a no-JS fallback.
External source-link availability is not checked; the static link checker deliberately does not
fetch external URLs. Native engineering gates and physical validation are outside this website unit.

Verification on 2026-10-30: baseline Tinyrex build, postbuild and links passed. The final versions
of all commands above passed: 13 Node tests; 8 built pages / 135 internal links; all eight
viewport/theme browser combinations, plus no-JS fallback and a normal-motion keyboard-play /
motion-preference-change check. All 18 joint ranges are exercised with Home/End in each browser
combination. Playback is also checked to stop offscreen. Full-page and section screenshots were
visually reviewed. Screenshot review found default-black SVG labels in dark mode; a browser
assertion failed with 7 labels, then passed after the contained CSS fix. The link checker also
caught 21 missing legacy navigation targets during implementation; preserving the anchors fixed
them without editing shared navigation. No check was weakened.

Integration follow-up outside this unit: `src/data/site.ts` still has the earlier 17-servo metadata,
and `src/data/nav.ts` still has the old Tinyrex navigation/footer on other pages. This homepage
overrides title, description, navigation and footer, and retains compatible historical anchors.
The parent should reconcile those shared Tinyrex entries separately. No wordmark image is used in
the replacement homepage, so it does not retain the previous 280 × 58 image-ratio mismatch.

Security review boundary: only local native control values enter the math; finite values and enums
are validated, values are bounded, DOM text uses textContent and SVG attributes are numeric. No
credentials, persistence, dynamic HTML, eval, production calls or new dependencies. This repository
has no `.agents/` kit, so its security scanner is unavailable, not passed.

Rollback: revert the focused learning-site commit; there are no schema, storage or dependency changes.
