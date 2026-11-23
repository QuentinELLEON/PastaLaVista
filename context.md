# Project context

AI-facing background file (English). Read it before working on the project. Keep it accurate: update it when decisions are made.
Sources: `subject_definition/SujetAdaptation2627VF.pdf` (assignment) and `subject_definition/IHMAdaptativesCours1-20262027.pdf` (course 1, "IHM adaptatives"). The instructors' PDFs are the reference; if this file conflicts with them, the PDFs win.

## 1. What the project is

- **Name:** PastaLaVista.
- **Course:** SI5, semester S10, "Adaptation" (adaptive user interfaces / plasticity), academic year 2026-2027.
- **Instructors:** Christian Brel and Anne-Marie Pinna (they must be invited to the Git repository). Communication on Slack `#si5-adaptation`, plus a private group channel `#si5-adaptation-<GROUP NAME>`.
- **Team:** group of at most 4 students. **Every member is graded individually**, so everybody must contribute visibly.
- **Subject:** adapt the **ordering journey of a fast-food restaurant** (menu → order → payment) using **runtime adaptation** to the usage context. The restaurant sells pasta.
- **Language of the product:** the restaurant is a French-language context; UI text language is not formally decided (see open questions).

## 2. Business goals

The kiosk is the main customer touchpoint in fast food. Two goals pull together:
1. Have the **maximum number of customers and satisfy them** (smooth queues).
2. Get the **maximum number of orders** and a bigger average basket (**upselling**: push relevant products and offers).

Main customer tasks (the journey to design and adapt):
1. **Choose products** (menu browsing, customising, composing).
2. **Order** (cart, review, confirm).
3. **Pay**.
Reacting to promotional offers is part of the journey.

## 3. Scope

### Required deliverables for every group
- **Standard UIs**: satisfying for all customers (the baseline, works without any adaptation).
- **Adaptations on the "Users" axis** (mandatory).
- **Adaptations on exactly one more axis**, chosen by the group.

### Decision taken: second axis = Devices (NOT Environment)
The team works on the **Users** axis and the **Devices** axis. The **Environment** axis (weather, rush) is **out of scope**: do not design, mock up or code it.

### Axis 1 — Users (mandatory)
Personalise the journey for the user profile from the first seconds. To answer:
1. Identify different user groups.
2. Choose **2 personas with quite different expectations**.
3. Build a **comparison table of the UI journeys** (criteria relative to the personas' main tasks).
4. **Mock up** the standard UI and the UI of each of the 2 chosen personas.
5. Identify how to **recognise a profile dynamically**.
6. Identify how to **switch from the standard UI to a personalised UI**.

Chosen user groups and personas (see `docs/tableau-comparatif-parcours.md`, written in French):
- **Group:** young adults and working people → **Jérémy Martin** — regular customer, Skema student, finishes at noon on Wednesdays, comes weekly, comfortable with technology, must eat fast to get back to work, **has a customer account**.
- **Group:** tourists unfamiliar with pasta who cannot cook for themselves → **Alexovitch Dimitri Alexei** — Russian bodybuilder, wants large quantities of slow carbs and protein, healthy food adapted to his needs, no time constraint, **does not speak French**, not comfortable with technology, slow, no account.

### Axis 2 — Devices (the group's chosen second axis)
Some fast foods offer a **hybrid smartphone + kiosk** solution: the customer uses their smartphone to configure the order on the move or before coming, then uses the physical kiosk to finalise the purchase and trigger kitchen preparation. To answer:
1. Identify the **tasks offered on each device**.
2. Build a **comparison table of the UI journeys** (criteria relative to the tasks assigned to each device and to the specifics of each device).
3. Identify the **impacted standard UIs** and **mock up the new adapted smartphone UIs**.
4. Identify how to **detect the device change dynamically**.
5. Identify how to **go from the smartphone UI to the kiosk UI**.
6. Identify the **possibility of adding a chatbot** for taking orders.

Notes for this axis:
- Platform is one element of the context-of-use triplet; here it changes between smartphone (mobile, personal, anywhere, small screen, touch, possibly before arriving) and kiosk (public, in-restaurant, large touch screen, fixed, payment and kitchen trigger).
- The order state (cart, customisation) must **survive the handover** from smartphone to kiosk (continuity of experience, preserved state).
- The user axis and the device axis interact: e.g. Jérémy (account) can pre-order on his phone and pick up/finalise at the kiosk in seconds; Alexovitch (no account, no French, slow) may still use the smartphone with language help or a chatbot. Define these combinations explicitly.

### Axis 3 — Environment (excluded, kept only for reference)
Weather (heatwave / bright sun, or heavy rain / freezing cold) and rush (calm restaurant mode vs rush mode). **Not part of our work.**
### Compositions
The subject says to consider **compositions of the chosen adaptations** (here: a persona adaptation active at the same time as a device adaptation, e.g. Alexovitch on smartphone vs Alexovitch on kiosk). Priorities and conflicts must be defined explicitly.

## 4. Planned work and evaluation

Whole project is split into two stages of 3 sessions each.

**Stage 1 — UX research and specifications (first 3 sessions), evaluation at session 4**
- Usage scenarios.
- High-fidelity mock-ups.
- Comparison tables = **adaptation matrices**.
- Adaptation rules.
- **Front-end code of the interfaces, without interconnection** (no back-end wiring required).
- Consider the compositions of adaptations.

Stage 1 expectations from the instructors — mock-ups and front-end must take into account:
1. The **adaptation levels**: presentation (visuals, components), content (useful information) and behaviour (interactions).
2. The **continuity-of-experience guidelines** (see section 6).
3. **Minimum accessibility** (contrasts, minimum click/touch target size...).
Also: identify **detection criteria** (time factor, input speed, navigation pattern, simultaneity of choices, recipe/product modifications...) and fill in the adaptation matrices.

**Stage 2 — Implementation analysis and proof of concept (3 sessions), evaluation at session 8**
- Solution with an **adaptation engine and static adaptation rules**.
- Solution with **several AI techniques and a multi-level use** (context identification **and** UI generation).
- Both are explored ("with and without AI").

Code is hosted on Git; instructors have access. Source of truth for grading is the repository, so keep it clean.

## 5. Core adaptation concepts (course summary)

- **Plasticity** (Joëlle Coutaz, Interact'99): the capacity of a UI to adapt to its context of use while preserving its usability.
- **Context of use = triplet:** **User**, **Platform** (device), **Environment**. Adaptation reacts to a change in one element of the triplet. This project covers **User** and **Platform**.
- **Adaptation at design time** (initiated by the user, then handled by the system) vs **at runtime** (initiated and handled by the system). This project targets **runtime adaptation**.
- **Plasticity domain / threshold:** the set of contexts the UI covers; beyond the threshold the UI is no longer adequate.
- **Do not confuse a feature and an adaptation:** a feature answers a user need; a change of context does not change the need, it introduces a variation.
- **Adaptation matrix** (the core artefact) has 3 parts:
  1. **Context variables** (inputs): the element of context that changes (e.g. attention drops, brightness changes, device changes).
  2. **UI components** (outputs): modality, layout, textual content, dialogue flow — impact described on **content, presentation, dialogue**.
  3. **Transition rules:** how to go from state A (before change) to state B (after change).
  Construction method: list possible values of each element of the triplet → specify the context in which the value changes → for each value, identify tasks that need an adapted view → for each task, list the impact on content/presentation/dialogue → define transition rules. A matrix can be simplified depending on the impact of the change (e.g. brightness affects all tasks but only presentation).
- **Worked examples from the course:** a QCM for children with ADHD (inattentive child: more explanations, animation, a small relaxing game, condition on response time); screen brightness (below X lux raise contrast, above Y lower it, otherwise standard); a user starting on a desktop whose app migrates to a nearby smartphone when the battery is low (task continuity across devices).
- **Personalisation:** *static* (user-declared profile, or a pre-existing expert profile), *dynamic/passive* (system profiles automatically, starting from a prototype profile and refining), *interactive* (neutral product that learns; user is both active and passive; AI-enabled). Profile data may be sensitive: comply with **GDPR** (privacy, individual rights) and protect data with adequate security.
- **User profile inference:** interaction history, behavioural habits, psychological state (stress, fatigue), context identification.

## 6. Continuity-of-experience guidelines (must be reflected in mock-ups and code)

1. **Lower cognitive load:** hide information that is irrelevant at time T; facilitate action execution and verify the task was done correctly.
2. **Preserve application state:** focus and in-progress data (typed text, open option, cart) survive the swap between standard and adapted views — and between devices.
3. **Smooth visuals:** interpolate (e.g. size changes ~300 ms ease-in-out), never jump abruptly, no flicker; when text grows, neighbours move apart with a transition.
4. **Choose the right moment (sensors):** react only to a significant and stable change; use **hysteresis** (e.g. activate above 80 %, deactivate below 50 %) to avoid oscillation.
5. **Keep the structure:** keep the screen skeleton during the session, keep critical buttons in the same place, reconfigure components rather than jumping to another screen.
6. **Layout changes:** choose carefully between layouts (split-screen/list, focused/large grid, linear tunnel) and consider whether the change is occasional or persistent (ex.: inattentive child vs ADHD child).

## 7. Detection ideas (to refine in the matrices)

Candidate signals (all simulated or mocked in the front-end for now):
- **User:** customer account / login (known profile and order history), chosen language, time between actions, input speed, navigation pattern (back-and-forth, hesitation), simultaneity of choices, modification of recipes/products, explicit choice at start ("express" vs "guided").
- **Device:** screen size and input type (user agent, viewport), kiosk-identifying signal (scan of a QR code displayed on the kiosk, order code, NFC, being logged in at the restaurant), proximity or geolocation of the smartphone, order status (draft on phone → to finalise at kiosk).
- **Transitions:** how a standard UI becomes adapted and back, and how the order passes from smartphone to kiosk (threshold + stability delay, smooth animation, state preserved, reversible, user can override).

## 8. Domain vocabulary

- **Borne / kiosk:** self-order terminal.
- **Panier moyen / average basket:** average value of an order.
- **Upselling / vente additionnelle:** suggesting larger or complementary items (menu upgrade, dessert, drink).
- **Persona / user group:** archetype of a customer type used to design adapted journeys.
- **Matrice d'adaptation / adaptation matrix:** table linking context changes to UI changes and transition rules.
- **Contexte d'usage / context of use:** user + platform + environment.
- **Dispositif / device:** the platform the customer interacts with (smartphone or kiosk).
- **Handover / passage de relais:** moving an order in progress from the smartphone to the kiosk.
- **IHM:** human–machine interface (French term for UI).

## 9. Current state of the repository

- `README.md` (title), `subject_definition/` (the two instructor PDFs), `docs/tableau-comparatif-parcours.md` (French, Users axis comparison table) and these AI-instruction files.
- **No technology stack, framework, build tool, test framework or code exists yet.** Do not assume one. If asked to scaffold, ask which stack the team wants, and update `AGENTS.md` (organisation section) afterwards.
- Git: single branch `main` with an initial commit. Work on feature branches, never push to `main`.

## 10. Open questions (do not decide silently; ask the team)

- Chosen **stack** (framework, language, styling, tests). A responsive web front-end would suit both a kiosk and a smartphone UI, but it is not decided.
- Which **tasks run on the smartphone** and which on the **kiosk** (e.g. browse/customise on phone, finalise/pay/trigger kitchen at kiosk).
- **Handover mechanism** (QR code, order code, account login, NFC).
- Whether to include the **chatbot** (the subject only asks to identify its possibility) and for which persona.
- Language of the UI text (French only, or multilingual — Alexovitch needs a non-French language).
- Which AI techniques to explore in stage 2 (context identification, UI generation).
- Group name and Slack channel.
