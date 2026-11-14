# Dashboard research: personnel management for a Vietnamese Buddhist community

Research date: 2026-11-10. Method: public primary-source reading only. No application execution, member-record access, or application changes. Schema and existing-chart descriptions below come from the task brief, not independent inspection. No personal information is included.

## Scope and applicability

The useful present-day dashboard is an administrative and care-assignment overview: which registrations need review, which records lack an assigned responsible person, how recorded members are distributed, and which actionable data issues need checking. It cannot measure actual participation or spiritual commitment.

The sources are UK public-sector statistical/data-quality guidance and first-party volunteer-sector guidance. Their principles transfer to clarity, record quality, support responsibility and respectful recognition. They are not Vietnamese legal guidance, Buddhist doctrine, proof of this community's needs, or evidence that every member is a volunteer. Recommended actions below are design inferences for the supplied schema; validate priorities with the managers who will use them.

## Sources verified

All links were opened and readable during this research.

| Source | Verified content and applicability |
|---|---|
| [UK Government Data Quality Framework](https://www.gov.uk/government/publications/the-government-data-quality-framework/the-government-data-quality-framework) | Defines fitness for purpose and separates completeness, uniqueness, consistency, timeliness, validity and accuracy. Published 3 December 2020. Supports describing precisely what a check establishes. |
| [Government Data Quality Framework: guidance](https://www.gov.uk/government/publications/the-government-data-quality-framework/the-government-data-quality-framework-guidance) | Prioritise critical fields, define purpose-specific rules, communicate limitations and investigate causes. Published 3 December 2020. Supports an actionable issue list rather than an indiscriminate completion score. |
| [ONS: dashboards](https://service-manual.ons.gov.uk/data-visualisation/guidance/dashboards) | Justify dashboards through user needs, place important insights prominently, supply context and review measures. Warns about interpretation burden and maintenance. Supports a focused overview with a few decision paths. |
| [ONS: visualisation principles](https://service-manual.ons.gov.uk/data-visualisation/guidance/principles) | Show the important comparison, simplify charts and provide explanatory text. Primarily communicative guidance, with principles also useful for exploration. |
| [ONS: bar charts](https://service-manual.ons.gov.uk/data-visualisation/chart-types/bar-charts) | Preferred for comparing categories; zero baseline and logical ordering. Supports readable group, team, assignment and tag counts. |
| [ONS: stacked bar charts](https://service-manual.ons.gov.uk/data-visualisation/chart-types/stacked-bar-charts) | Compare composition, generally limit segments to five, and do not stack overlapping categories. Supports ward-by-group totals, but rules out a part-of-whole display of recognition tags. |
| [NCVO: supporting volunteers](https://www.ncvo.org.uk/help-and-guidance/involving-volunteers/supporting-and-managing-volunteers/supporting-volunteers/) | Clarify support responsibility, offer individual support and listen to feedback. Page reviewed 12 April 2021. Supports checking assignment coverage; it does not establish a valid caseload limit. |
| [Volunteering New Zealand: feedback and recognition](https://www.volunteeringnz.org.nz/best-practice-guidelines/feedback-and-recognition) | Tailor recognition to the individual and check preferences for public acknowledgement. Supports respectful appreciation, not competition or inferred merit. |

## Six principles and their consequences

1. **Start with a recurring management decision.** Put review and assignment questions before demographic exploration; do not require seven equal-weight visualisations merely because seven exist. A chart needs a clear question and a next action. This applies the [ONS dashboard guidance](https://service-manual.ons.gov.uk/data-visualisation/guidance/dashboards).

2. **Name the measured fact, and expose its limits.** A recorded registration is not attendance; a submitted form is not an approved member; assignment is not completed care. Date provenance matters. This follows the [Government framework's distinction between fitness for purpose and accuracy](https://www.gov.uk/government/publications/the-government-data-quality-framework/the-government-data-quality-framework). The specific distinctions here are inferences from the supplied schema.

3. **Treat a missing applicable requirement as an issue, not every blank.** Quality checks should serve an explicit use. Adult personal phone is required; a child's personal phone is optional. Child-hidden occupation, introducedBy and adult position are inapplicable. Empty optional recognition, nickname, notes or dharma name must not become defects by default. Other requiredness must be confirmed from documented rules. This applies [purpose-specific quality rules](https://www.gov.uk/government/publications/the-government-data-quality-framework/the-government-data-quality-framework-guidance).

4. **Make responsibility visible without claiming outcomes.** Show people with and without a recorded caregiver and the number assigned to each caregiver. Use this to ask who should help and whether assignments need discussing. Never call an assigned person cared-for, contacted, neglected or overdue without contact evidence. This is an application of [NCVO's guidance to clarify supervision responsibility](https://www.ncvo.org.uk/help-and-guidance/involving-volunteers/supporting-and-managing-volunteers/supporting-volunteers/).

5. **Compare quantities with a common baseline.** Horizontal bars support category comparisons; monthly counts suit columns. Use direct counts, readable labels and a visible missing category. Keep the overview's explanatory burden low. See [ONS bar guidance](https://service-manual.ons.gov.uk/data-visualisation/chart-types/bar-charts) and [visualisation principles](https://service-manual.ons.gov.uk/data-visualisation/guidance/principles).

6. **Keep recognition appreciative and noncompetitive.** The six labels describe recorded positive recognition; absent labels establish no negative trait. Do not rank people, teams or carers by label totals, or derive commitment, virtue, activity or risk scores. This is a schema-specific recommendation consistent with [individualised recognition guidance](https://www.volunteeringnz.org.nz/best-practice-guidelines/feedback-and-recognition). Tags overlap, so use separate bars rather than slices or stacked parts of one total, following [ONS stacking rules](https://service-manual.ons.gov.uk/data-visualisation/chart-types/stacked-bar-charts).

## Concrete managerial questions, displays and actions

The proposals in this table are design inferences, not findings about real members. Priority is suggested, pending manager validation.

| Priority and question | Display and exact meaning | Useful next action and limits |
|---|---|---|
| 1. “Hồ sơ nào đang chờ duyệt?” | Pending count, oldest valid submittedAt, and an oldest-first review list. Optional age buckets should be labelled calendar days waiting, not service-level breaches unless a policy exists. | Open registration review. Unknown/invalid submittedAt belongs in an explicit unknown bucket. Do not calculate review turnaround without decision timestamps or invent a funnel from current status counts. |
| 1. “Ai chưa có người phụ trách được ghi nhận?” | Assigned/unassigned counts, broken down by children/youth/congregation; separate invalid caregiver references from empty assignments. | Open the matching records and discuss an assignment. Assignment alone does not verify a reachable, willing or suitable caregiver. |
| 1. “Phân công đang tập trung ở đâu?” | Horizontal bars of member counts per resolved caregiver; an unassigned row; optional group filter. Label “Số người được phân công”. | Discuss redistribution and confirm availability. Do not call this workload, burnout, capacity utilisation or care quality: intensity and available time are absent. No externally justified caseload threshold was found. |
| 1. “Hồ sơ nào cần xác minh để liên hệ hoặc phân nhóm?” | Counts by independently defined issue: missing required adult phone; invalid birthday; unresolved member reference; recorded-group/age mismatch. Drill into separate issue lists. | Verify facts with the responsible person. Syntax-valid phone is not verified contactability. Multiple issues can affect one person: do not sum issue counts as unique people. |
| 2. “Đạo tràng hiện có bao nhiêu hồ sơ theo nhóm?” | Three zero-baseline bars and a total, with unclassified records explicit. Show the registration-status scope. | Plan age-appropriate communication or group administration. These are recorded people, not active participants. Default to approved records if approval is the actual membership gate; otherwise label the chosen scope explicitly. |
| 2. “Phường/tổ nào cần trao đổi về phân công?” | Horizontal ward totals, optionally stacked by the three exclusive recorded groups; team totals as a separate sorted bar view. Preserve unassigned/unknown. | Open the relevant ward/team records to coordinate locally. Counts are not area penetration or community coverage: no population denominator or participation evidence exists. Top-N views must disclose “Khác” and the omitted count. |
| 2. “Những mốc tuổi nào sắp cần rà soát?” | Age bands and an optional list approaching age 16 or 41, calculated from valid birthdays as of the displayed date. | Confirm group transitions with managers. Labels are children under 16, youth 16–40 inclusive, congregation over 40. A mismatch is a review suggestion, not authority to silently change a recorded group. |
| 3. “Hồ sơ được ghi nhận theo tháng như thế nào?” | Monthly columns only after determining what joined actually means; separately, submittedAt counts measure submissions. State excluded unknown dates and partial current month. | Investigate records or import batches. Never label imported dates as recruitment, spiritual growth, attendance or retention. If provenance is unresolved, show an explicit limitation or omit this panel. |
| 3. “Các ghi nhận tích cực đang được lưu như thế nào?” | Six independent horizontal bars counting distinct people carrying each recognition tag, with the filtered denominator. Optional filter to records with no recognition label, phrased neutrally. | Review the recorded appreciation context privately. One person may appear in several bars; percentages can exceed 100% when summed. Do not call a blank label “inactive” or imply missing recognition needs correction. |

## Treatment of the seven existing chart concepts

This is a recommendation based on their supplied descriptions, not a visual/code review.

| Existing concept | Recommendation |
|---|---|
| Monthly registration | Conditional secondary panel. Resolve joined/submittedAt semantics and import provenance first. A current snapshot cannot reconstruct historic member totals. |
| Orbit of groups | Replace with three labelled bars or compact count cards. Category count comparison is the task; orbital placement has no management meaning. |
| Ward stack | Keep if ward totals and group composition answer a real local coordination question. Three groups are exclusive; preserve unknowns and explain scope. |
| Caregiver waffle | Replace with assigned/unassigned counts plus horizontal caregiver bars and an assignment review action. This exposes both gaps and concentration. |
| Tag bubbles | Replace with independent bars, or move to secondary exploration. Recognition labels overlap and bubble area adds comparison effort. |
| Team ticks | Prefer sorted bars with direct counts and a visible unassigned category. The action is reviewing team distribution, not ranking performance. |
| Age/gender | Keep as secondary planning context if managers use it. Age bands generally suffice; retain unknown values. Avoid presenting a descriptive imbalance as a problem or target without an explicit organisational purpose. |

These replacements apply the [ONS recommendation for category bars](https://service-manual.ons.gov.uk/data-visualisation/chart-types/bar-charts), the [composition requirements for stacked bars](https://service-manual.ons.gov.uk/data-visualisation/chart-types/stacked-bar-charts), and its [advice to keep charts simple](https://service-manual.ons.gov.uk/data-visualisation/guidance/principles).

## Measurement contract and limits

Recommendations for a future implementation, grounded in the supplied schema:

- Display the counting scope beside each indicator: approved-only, pending-only, or all records. Handle legacy/unknown registration status explicitly; never silently treat it as approved. Use a shared group/ward/team filter context for comparable panels.
- Count distinct member IDs. Record totals and link counts must not be mixed. Caregiver and introducedBy are member references, not proof of contact, family relationships or successful referral.
- Label age calculations with an as-of date in Asia/Ho_Chi_Minh. A birthday date is a calendar date; avoid timezone shifts when calculating anniversaries or ages.
- Separate recorded group from age-derived group. Missing birthdays remain unknown and must not turn into age zero. The thresholds in this brief are community categories, not claims about legal adulthood.
- Child schoolClass accepts 1–12 or “Không”; “Không” is an allowed answer, not a missing value. Do not infer education disadvantage from it. Missing parentName/relativePhone should only become required-field issues if the actual documented child rules require them. Do not infer guardian identity from caregiver.
- A record's empty caregiver/team may be an assignment opportunity even if the form allows it; label it “chưa phân công”, not “hồ sơ không đầy đủ”. Separate administrative workflow needs from validation defects.
- Optional occupation, nickname, personality, notes and recognition do not justify collection pressure or profile scoring. Free text is not reliable structured evidence of behaviour or support outcomes.
- No attendance/event records, contact log, lastContact, exit history or longitudinal snapshots are available. Therefore omit attendance rate, inactivity, last-contact overdue, retention, churn, attrition risk, care success, activity ranking, and historical cohort survival. Approved registration is not evidence of current attendance.
- Pending age is measurable from submittedAt; approval speed is not measurable from status alone. Current approved/rejected counts describe present outcomes, not necessarily decisions made during a selected month.
- Prefer aggregate summaries on the overview; open a purpose-specific, access-controlled record list only for the manager's action. Do not expose phones, notes, child personality, exact addresses or parent details as chart labels or tooltips. This is a product-scope recommendation; legal/privacy compliance was outside this research.

## Suggested first version

Use three prominent actions: review pending registrations; review people without a recorded caregiver; verify specific applicable-field issues. Then show group distribution, caregiver assignment distribution and one ward/team breakdown. Keep date trends, age/gender and recognition in secondary exploration. There is no evidence-based reason to force all seven existing chart concepts onto the first screen.

Validate with managers using concrete tasks: finding the oldest pending form, finding unassigned youth in one ward, and identifying which required adult contact field needs checking. Success means they can explain what the number counts and reach the correct action; it does not mean generating more charts. This recommendation applies the [ONS dashboard advice on user research and priority](https://service-manual.ons.gov.uk/data-visualisation/guidance/dashboards).

## Current-source correction by the coordinating researcher

`src/lib/registration.ts` independently checked: avatar is required for all three forms; child personal phone, parentName and relativePhone are currently optional. Treat missing child parent contact as a proposed operational follow-up, not a current validation failure. `server/migrations/007_registration_approval.sql` contains approved_at/approved_by/submitted_by, but the current member API projection does not expose those fields. Processing-time and origin analysis therefore needs a small API projection change and exclusion of automatic staff approvals; it is not available from current frontend records alone.
