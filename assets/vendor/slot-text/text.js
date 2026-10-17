const NBSP = "\u00A0";
const segmenters = Intl.Segmenter
    ? {
        character: new Intl.Segmenter(undefined, { granularity: "grapheme" }),
        word: new Intl.Segmenter(undefined, { granularity: "word" }),
    }
    : undefined;
/** Split text into roll units, with dependency-free fallbacks. */
export function segmentText(text, rollBy) {
    if (segmenters) {
        return Array.from(segmenters[rollBy].segment(text), ({ segment }) => segment);
    }
    return rollBy === "word" ? (text.match(/\s+|\S+/g) ?? []) : Array.from(text);
}
/** Preserve regular spaces inside individually measured glyph cells. */
export function getVisibleSegmentText(segment) {
    return segment === " " ? NBSP : segment;
}
