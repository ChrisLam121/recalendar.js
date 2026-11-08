# Planner 6: Plan / Actual

Planner 6 is an optional handwriting workflow designed around the portrait
reMarkable Paper Pro page. Enable **Planner 6.6** in General settings or use the
local generator below. Disabling it retains the classic ReCalendar itinerary
layout. The public upstream website does not include this fork's changes.

## What each page does

| Page | Purpose |
| --- | --- |
| Home | Date index, month links, weekly plans (W), reviews (R), and year notes |
| Month | Fixed commitments, deadlines and milestones |
| Monthly direction & review | Intended outcomes, actual progress, one adjustment, selective notes index |
| Week | Seven chronological day rows with two writing lines each; a weekly focus and 19-action list |
| Day | Plan and Actual share one time axis; three 8.5 mm rows identify today's outcome |
| Daily Notes | Free writing: notes, thoughts, a journal or an optional detailed time log |
| Weekly review | Progress, one plan/actual difference, one change and decisions on unfinished work |
| Habits | Existing habit names, a handwritten frequency goal, observations and one adjustment |
| Inbox | Two linked capture pages, 20 items each; mark the destination when moving an item |

Keep completion status on the weekly action list. Daily timelines record time
and activity, which is different from completing the action. Preserve the plan
when the day changes, and record actual start/end times and duration on the
right. A busy day's minimum is one outcome and one actual activity; the layout
does not require filling every area or reconstructing missed days.

The default timeline is 06:00–22:00 with hourly rules and lighter full-width half-hour guides. Start and end can be
changed in the form or CLI, using whole hours between 0 and 24. At the Paper Pro
size this default gives about 10.9 mm per hour and 76 mm per writing column.
More hours reduce the row height. Rules are quiet grey; main text is dark and
weekends/holidays retain red accents. Colour never carries the only meaning.

Home, Inbox, Month, Week and Day/Notes navigation stays in the same upper strip.
Day arrows skip the intervening notes/review pages; Notes arrows stay on Notes.
Weekly review has a separate **Next plan** link. The month, direction and habits
arrows each stay with their own page type. Swiping follows physical PDF order.
The PDF cannot synchronize handwriting, automatically calculate duration or
provide a dynamic Today button. Device favourites refer to files, not individual planner pages.

## Mixed Chinese/English handwriting

Use the same writing area for both languages. The main ruled baseline is 8.5 mm,
chosen from the owner's actual handwriting experience. Dot grids are 4.25 mm in
both directions: two intervals give the same 8.5 mm writing rhythm, while a single
interval remains useful for alignment. Each dot is a 0.28 mm pure-black (#000000) vector
circle, selected by the owner after on-device calibration in Adaptive mode
on reMarkable OS 3.28.0.172. Keep the colour black and use the small diameter
to control visual weight. Fine dots can still vary after PDF rasterization;
this choice does not promise identical pixels in every viewing mode or zoom.
This is a design choice for this owner, not a universal handwriting standard.

Weekly actions and Inbox use 4 × 4 mm checkboxes with a 3 mm gap before the writing
line. On Paper Pro these rows yield nineteen weekly actions and twenty Inbox
rows per page (two pages). Daily focus has three 8.5 mm rows. The 06:00–22:00 timeline keeps the full day:
hourly rules (about 10.9 mm apart) use 0.6 pt #999999 strokes; full-width
half-hour guides use thinner 0.4 pt #D0D0D0 strokes. Both stop at the centre
time axis. Half-hour spacing is about 5.4 mm; handwriting can span more than
one half-hour interval. Month cells stay open, and the habit
marking matrix retains its purpose-specific cell dimensions.

The Home index groups months under explicit year headings and provides clearly
labelled Year notes links. It separates each month's weekday/date grid from the week-number
and review columns with two continuous vertical rules. Week numbers and R links
use a lighter grey than the actual date numbers, with their existing destinations.

## Refinements in 6.4

The weekly layout gives 60% of the width to seven chronological day rows and
40% to the task list. Day rows hold commitments; the task list owns completion
status. Each date retains two 8.5 mm writing lines. The action list provides
19 rows on Paper Pro; longer actions can use two rows. Plan and Actual retain
their original dimensions and calibrated writing guides.

Weekly and monthly review headings are shorter, with full instructions in Guide.
The monthly Notes to revisit index has four 8.5 mm rows with Date and Keyword
columns. Weekly review focuses on execution; monthly review checks direction;
habit reflection is optional. Move unfinished work directly on the weekly list
and record the reason in Review, avoiding an extra copy of the task list.

Habits adds week-boundary rules that follow the configured first day of the week.
Habits and Direction paging labels now identify their actual destination type.
Inbox has two linked pages; Home always opens its first page. The guide explains
how to process both pages and add a dated note page in reMarkable when Notes is
full. Such inserted pages have no generated PDF navigation of their own.

A day in practice replaces the blank log reference with an enlarged 09:00–11:00
example: 60 minutes planned, two math blocks totalling 80 minutes and a 15-minute
interruption. It distinguishes time spent from task completion and demonstrates
how the record informs weekly and monthly review. A detailed list in Notes is
an alternative to detailed timeline entries, not a second mandatory record.

## Refinements in 6.5

The weekly status legend fits on one line at 8 pt. A smaller gap after Weekly
focus and a calculation from the remaining height give 19 action rows on Paper
Pro, without reducing the 8.5 mm pitch or the 4 mm checkboxes.

Today’s outcome has three 8.5 mm rows. Its right-hand area extends alongside the
holiday band; holiday labels use the left 55% of the page body. The timeline
position and height stay the same. Daily Notes uses a small, right-aligned
“Notes” label in the date header and only “Use only when needed.” underneath.
The dot grid starts below the header, with no list of prescribed writing uses.

The example uses Activity / Start / End / Minutes. Record the activity and start
when beginning, and complete the last two fields after finishing. The illustrated
time blocks likewise put the activity first.

## Event markers in 6.6

Home mini calendars draw a dark square around dates with events, including
annually repeating birthdays and events tied to a specific year. The square
is separate from date colour: a weekend or holiday event retains its red
numeral. Adjacent-month dates retain their muted numeral. The marker leaves
the numeral position and the full date link unchanged.

## Generate from an existing planner

Use Node.js 24, then install dependencies with `npm ci`.

```sh
npm run planner -- --input '/path/to/existing.pdf' --output '/path/to/planner-6.pdf'
```

The input must contain ReCalendar's embedded `config.json`; a saved JSON config
also works. The generator preserves the date range, day availability, habits,
special dates, device size and other configuration, enables Planner 6 and embeds
the updated configuration in the output. It uses bundled fonts locally and
checks that the attachment can be read back. It produces a fresh template, not
a migration of handwritten annotations.

```sh
# First-month preview, with links restricted to the rendered month:
npm run planner -- --input existing.pdf --output preview.pdf --preview
# A wider timeline:
npm run planner -- --input existing.pdf --output planner-6.pdf --start 5 --end 24
```

The structured workflow uses its own writing grids and prompts. Classic itinerary
and line-style settings are kept in the embedded config, but do not override
those structured grids. English workflow labels are supplied; other locales
fall back to English for these new labels. The design has been visually checked
at the Paper Pro portrait size; substantially smaller or landscape formats need
their own layout review.

Do not commit generated personal planners or their embedded settings to a public
repository. The generator, layout and tests are sufficient to reproduce them.

## Validation

Run `npm run lint`, `npm test` and `npm run build`. CI runs tests in both
Asia/Hong_Kong and America/Los_Angeles. PDF regression tests generate an actual
January preview spanning the year boundary, resolve every internal link,
check reciprocal Day/Notes links and next-page chains, and confirm that user
settings survive the round trip. Existing holiday and classic-layout tests
remain in the suite.

Before distributing a long planner, also inspect rendered examples of every
page type, six-row months, long holiday names and the first/last dates. Check the
full PDF's named destinations and physical page bounds. File-level checks do
not establish on-device refresh speed, finger-tap comfort or pen contrast; those
still require the actual tablet.
