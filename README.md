# ReCalendar
### Highly customizable calendar for ReMarkable tablets

ReCalendar allows you to generate your own, personalized calendar right in your browser. You can view the live, production version at https://recalendar.me/.

It is the continuation of my previous efforts: https://github.com/klimeryk/recalendar. Although, basically all of the code had to be rewritten as I'm using a different PDF library, CSS engine, language, etc.

## Features

### Planner 6: Plan / Actual

This fork includes a handwriting workflow for reMarkable Paper Pro: paired daily
Plan / Actual timelines, linked daily notes, weekly actions, monthly direction
and weekly/monthly reviews. Enable **Planner 6.0** in General settings, or
regenerate an existing planner locally:

```sh
npm run planner -- --input '/path/to/existing.pdf' --output '/path/to/planner-6.pdf'
```

See [the workflow and generation guide](docs/planner-6.md) for navigation, timeline
hours, retained settings and validation. The classic itinerary layout remains
available when Planner 6 is disabled.

### Year-aware calendar imports in this fork

This fork fixes public holidays being copied onto the wrong dates in multi-year
planners. Imported `.ics` events and national holidays keep their full year,
month and day. Recurring iCalendar events are expanded over the requested planner
months. Existing month/day birthdays and anniversaries still repeat annually.
Day pages, weekly overviews and mini-calendars use the same date matching.

To generate a November 2026–December 2027 planner with an existing layout:

1. Use Node.js 24, run `npm ci`, then `npm run dev` and open the displayed local URL.
2. Upload the existing ReCalendar PDF to restore its layout, habits and events.
3. Set November 2026 as the start and 14 as the number of months.
4. In **Special dates**, select **Remove all holidays** to clear the old imported
   holiday dates. Other events, habits and layout settings are kept.
5. Select **Holiday** beside the `.ics` upload, then import the official English
   and/or Traditional Chinese Hong Kong calendars from
   [1823](https://www.1823.gov.hk/en/hong-kong-public-holidays-ical).
6. Generate the complete PDF. The preview renders only the first month, so use
   the complete PDF to check February 2027 and the December 2027 substitute holiday.

Reimporting an identical date and label skips duplicates; different language
labels are retained. Dates displayed with a year apply only to that date.
When adding a birthday manually, enable **Repeat every year**. After changing
the planner range, reimport holidays to include any newly added months.

Configurations saved by this fork use version `v5`. Old `MM-DD` dates are kept
as annual dates; their original year cannot be reconstructed automatically.
Always clear and reimport old holiday data when restoring a pre-fix PDF.

Run `npm test`, `npm run lint` and `npm run build` to validate changes. Regression
tests include the government's actual English and Chinese 2025–2027 `.ics`
files and the independently gazetted dates for the 14-month planner.

The upstream [recalendar.me](https://recalendar.me/) site is maintained separately
and does not automatically include changes made in this fork.

See https://recalendar.me/features for a full list with screenshots.

 - Optimized for the [ReMarkable 2 tablet](https://remarkable.com/store/remarkable-2) (should work with version 1 as well) to use the full space available and minimize screen refreshes.
 - No hacks needed - the generated PDF is a normal file, with links, etc. that you can simply upload normally to your tablet.
 - Heavy use of links to allow quick and easy navigation.
 - Lots of easy configuration options to tailor the calendar to your needs - plus access to the source code for even more advanced customization.
 - Easily switch to any locale supported by PHP.
 - Add extra pages to all or selected days of the week to suit your needs.
 - Provide a list of special dates (anniversaries, birthdays, etc.) and let ReCalendar embed them into your personalized calendar - on monthly views, weekly overviews and finally, day entries.
 - Track your habits monthly.
 - Start the "year" on arbitrary month (can be useful for tracking academic years, etc.).

## Quickstart for developers/contributors

[Vite](https://vitejs.dev/) is used for development. Make sure you use `nvm` or a compatible solution to use the correct Node version.

```
nvm use
npm install
npm run dev
```

## Known issues

See the [FAQ](https://recalendar.me/faq) and [the open issues on GitHub](https://github.com/klimeryk/recalendar.js/issues).

## License

[GNU AGPLv3 License](https://github.com/klimeryk/recalendar.js/blob/main/LICENSE). In particular, this means that you can do what you want with this code, but *you have to publish your changes with the same license*. Please consider submitting a PR, if you have an idea for a great improvement! 🙏 My main motivation was to scratch my own itch, but as a result I might have missed your use case so I'm happy to hear how this project can be improved 🙇
