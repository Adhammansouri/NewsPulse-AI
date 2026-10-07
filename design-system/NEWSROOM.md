# Newsroom /news

Newsroom uses the [hybrid design system](./HYBRID.md): Nothing tool surfaces inside the existing Newsplus brand shell. Styles are scoped to `.newsroom` in `newsplus-front/src/modules/News/newsroom.css`.

## Tokens and hierarchy

- Surfaces, borders, text, active controls and status use the existing `--nd-*` tokens in both themes. No gradients or shadows on tool surfaces. Red marks breaking news or an error.
- Arabic uses IBM Plex Sans Arabic without tracking; English news uses Space Grotesk. Space Mono is reserved for small counts. News headlines are 24–28px, feed titles 17px, body copy 16px, metadata 11–12px.
- Space follows an 8px rhythm with 12/16px pane gaps, 16/20px reading padding, 8px controls and 12px panel corners. Interactive controls have 44px touch targets.

## Responsive behaviour

- Below 1024px, headlines and editing are separate views. Search, time and a scrollable source logo rail appear in the headlines view; the filter disclosure exposes language and topic. Source filtering remains available for every language.
- At 1024px and above, the feed and editing pane sit side by side. Filters stay visible.
- Draft and revision conversation use separate controls in narrow editing panes; at a 46rem pane width they appear together. Versions, revision shortcuts and memory suggestions remain in the revision view.
- Story preview and format selection share one scrolling area. The generation action stays outside that area, so long articles do not push it away. Carousel settings in an existing draft open over the reading area.

## Feature placement

| Feature | Location |
| --- | --- |
| Refresh, incoming headline notice | Page header |
| Saved conversations and team memory | Header button; native modal dialog |
| Search, language, source, time, topic | Feed filters |
| Source logos and quick selection | Always-visible source rail; searchable native dialog grouped by language |
| Active criteria and individual removal | Filter chips; clear-all action |
| Breaking status, topic, sources, publication time | Headline row |
| Original excerpt and source links | Story preview |
| Desk, bulletin, facts, context, social, video, carousel, briefing | Format picker with icons and descriptions |
| Carousel slide count, style, density, Newsplus mark | Carousel settings |
| Copy, regenerate with a new format, choose another story | Draft toolbar |
| Revision instructions, shortcuts, versions, memory proposals | Revision conversation |

Both feed and editorial states keep their API contracts. Changing the format of a saved story uses that conversation's original item, even when it is outside the current feed filter. Opening a saved carousel restores its controls from the saved copy.

Source marks use the configured publisher domain before an article URL, so redirects or syndicated links do not replace the publisher's identity. Favicons keep their original colours on white wells, including dark mode; failed images show a source initial. Feed and preview logos are 24px and do not overlap. The source dialog becomes a bottom sheet below 640px, with focus managed by the native dialog and Escape closing it.

## Validation

TypeScript and production build checks cover integration. Browser checks should cover 360/390px phones, an 820px tablet, desktop with expanded/collapsed navigation, both themes, long headlines, filter disclosures, the conversation dialog, carousel settings, a long draft and a long revision thread. A build or server-rendered check does not establish visual or touch-interaction QA.
