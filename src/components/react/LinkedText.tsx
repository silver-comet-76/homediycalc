import { calculatorUrl, type LinkedText } from "../../lib/linked-text";

/**
 * React renderer for LinkedText segments (Phase 17B-1 Tranche D).
 * Same segment type and fail-closed rule as the Astro renderer
 * (src/components/LinkedText.astro): a segment with an unknown slug
 * renders as plain text, never a broken link.
 *
 * Links render inline-block with the Related-card target-size pattern
 * (py-0.5 + leading-6 = 28px tall): this renderer is used for the
 * ResultPanel note, which sits inside a `.card`, and the styles
 * regression test requires every `.card a` to be at least 24px tall
 * (WCAG 2.2 Target Size, Minimum). A plain inline link in the small
 * note text measures 19px and fails that test.
 */
export function LinkedText({
  text,
  className = "underline inline-block py-0.5 leading-6",
}: {
  text: LinkedText;
  className?: string;
}) {
  return (
    <>
      {text.map((seg, i) => {
        const url = seg.calc ? calculatorUrl(seg.calc) : undefined;
        if (url && seg.strong) {
          return (
            <a key={i} href={url} className={className}>
              <strong>{seg.text}</strong>
            </a>
          );
        }
        if (url) {
          return (
            <a key={i} href={url} className={className}>
              {seg.text}
            </a>
          );
        }
        if (seg.strong) {
          return <strong key={i}>{seg.text}</strong>;
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </>
  );
}
