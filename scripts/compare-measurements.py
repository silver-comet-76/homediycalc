#!/usr/bin/env python3
"""Compare baseline and candidate measurements.json files (Stage 2 UI).

Usage: python3 scripts/compare-measurements.py <baseline.json> <candidate.json> <comparison.txt> [comparison.json]

Produces the before/after table (height, visible words, overflow, calcTop,
resultTop per page per width) plus a 390px summary. Exits non-zero if any
page has horizontal overflow in either side.
"""
import json
import sys

baseline_path, candidate_path, txt_path = sys.argv[1:4]
json_path = sys.argv[4] if len(sys.argv) > 4 else None

baseline = json.load(open(baseline_path))
candidate = json.load(open(candidate_path))

b_env = baseline.get("environment", {})
c_env = candidate.get("environment", {})
b_label = baseline.get("label", "before")
c_label = candidate.get("label", "after")

lines = []
lines.append(
    f"baseline: label={b_label} script={b_env.get('scriptVersion')} "
    f"chromium={b_env.get('chromiumVersion')} baselineSha={b_env.get('baselineSha')}"
)
lines.append(
    f"candidate: label={c_label} script={c_env.get('scriptVersion')} "
    f"chromium={c_env.get('chromiumVersion')} candidateSha={c_env.get('candidateSha')}"
)
lines.append("")
same_env = (
    b_env.get("chromiumVersion") == c_env.get("chromiumVersion")
    and b_env.get("scriptVersion") == c_env.get("scriptVersion")
)
lines.append(
    "NOTE: baseline and candidate were measured on the same local machine in "
    "sequence (same Chromium, same script, same method), not the same CI "
    "runner. The CI run provides the same-runner comparison (refinement C)."
    if same_env
    else "WARNING: baseline and candidate environments differ — see the environment blocks above."
)
lines.append("")
header = (
    f"{'calculator':<28} {'w':>4} {'before':>7} {'after':>7} {'change':>7} "
    f"{'visW before':>10} {'visW after':>10}  {'overflow':>8} {'calcTop d':>8} {'resultTop d':>11}"
)
lines.append(header)
lines.append("-" * len(header))

rows = []
overflow_bad = []
for slug in sorted(baseline["pages"]):
    b_pages = baseline["pages"][slug]
    c_pages = candidate["pages"].get(slug)
    if c_pages is None:
        lines.append(f"{slug:<28} MISSING IN CANDIDATE")
        overflow_bad.append(slug)
        continue
    for width in ["320", "390", "768", "1280"]:
        b = b_pages[width]["default"]
        c = c_pages[width]["default"]
        change = (c["height"] - b["height"]) / b["height"] * 100 if b["height"] else 0
        overflow = "OK" if not (b["overflowX"] or c["overflowX"]) else "OVERFLOW"
        if b["overflowX"] or c["overflowX"]:
            overflow_bad.append(f"{slug}@{width}")
        calc_d = c["calculatorTop"] - b["calculatorTop"]
        res_d = c["resultTop"] - b["resultTop"]
        lines.append(
            f"{slug:<28} {width:>4} {b['height']:>7} {c['height']:>7} {change:>6.1f}% "
            f"{b['visibleWords']:>10} {c['visibleWords']:>10}  {overflow:>8} "
            f"{calc_d:>+8} {res_d:>+11}"
        )
        rows.append(
            {
                "calculator": slug,
                "width": int(width),
                "before": b["height"],
                "after": c["height"],
                "changePct": round(change, 1),
                "visibleWordsBefore": b["visibleWords"],
                "visibleWordsAfter": c["visibleWords"],
                "overflow": overflow,
                "calculatorTopDelta": calc_d,
                "resultTopDelta": res_d,
            }
        )

# 390px summary.
b390 = sum(baseline["pages"][s]["390"]["default"]["height"] for s in baseline["pages"])
c390 = sum(candidate["pages"][s]["390"]["default"]["height"] for s in candidate["pages"])
changes390 = [
    (candidate["pages"][s]["390"]["default"]["height"] - baseline["pages"][s]["390"]["default"]["height"])
    / baseline["pages"][s]["390"]["default"]["height"]
    * 100
    for s in baseline["pages"]
]
lines.append("")
lines.append(
    f"390px default view: total {b390} -> {c390} "
    f"({(c390 - b390) / b390 * 100:+.1f}%), range {min(changes390):.1f}% to {max(changes390):.1f}%, "
    f"all 26 pages shorter: {all(x < 0 for x in changes390)}"
)
lines.append(f"Horizontal overflow anywhere: {'NONE' if not overflow_bad else ', '.join(overflow_bad)}")

open(txt_path, "w").write("\n".join(lines) + "\n")
if json_path:
    json.dump(
        {
            "baseline": {"label": b_label, "environment": b_env},
            "candidate": {"label": c_label, "environment": c_env},
            "rows": rows,
            "summary390": {
                "before": b390,
                "after": c390,
                "changePct": round((c390 - b390) / b390 * 100, 1),
                "minPct": round(min(changes390), 1),
                "maxPct": round(max(changes390), 1),
                "allShorter": all(x < 0 for x in changes390),
            },
            "overflow": overflow_bad,
        },
        open(json_path, "w"),
        indent=2,
    )
print(f"wrote {txt_path}" + (f" and {json_path}" if json_path else ""))
print(f"390px total: {b390} -> {c390} ({(c390 - b390) / b390 * 100:+.1f}%)")
if overflow_bad:
    print(f"OVERFLOW: {overflow_bad}")
    sys.exit(1)
