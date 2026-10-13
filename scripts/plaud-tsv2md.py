#!/usr/bin/env python3
"""Convert a Plaud transcript TSV (start_ms<TAB>speaker<TAB>text, one segment per line,
no header) into a vault transcript note.

Usage: python3 -I scripts/plaud-tsv2md.py <tsv> <plaud_id_bare_hex> <YYYY-MM-DD> <out_md> <expected_total>

Asserts: segment count == expected_total, start_ms non-decreasing, no empty speaker/text,
plaud_id is 32 hex chars. Refuses to overwrite an existing out_md.
"""
import os, re, sys

def main():
    tsv, pid, date, out, total = sys.argv[1:6]
    total = int(total)
    assert re.fullmatch(r"[0-9a-f]{32}", pid), f"plaud_id must be bare 32-hex, got {pid!r}"
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", date), date
    if os.path.exists(out):
        sys.exit(f"REFUSING: {out} already exists")
    segs = []
    with open(tsv, encoding="utf-8") as f:
        for n, line in enumerate(f, 1):
            line = line.rstrip("\n").rstrip("\r")
            if not line.strip():
                continue
            parts = line.split("\t")
            assert len(parts) >= 3, f"line {n}: expected 3 tab-separated fields, got {len(parts)}"
            ms, spk, text = parts[0].strip(), parts[1].strip(), "\t".join(parts[2:]).strip()
            assert ms.isdigit(), f"line {n}: start_ms not an integer: {ms!r}"
            assert spk, f"line {n}: empty speaker"
            assert text, f"line {n}: empty text"
            segs.append((int(ms), spk, text))
    assert len(segs) == total, f"segment count {len(segs)} != expected {total}"
    for i in range(1, len(segs)):
        assert segs[i][0] >= segs[i-1][0], f"start_ms decreases at segment {i+1}"
    lines = ["---", "type: transcript", "source: plaud", f"plaud_id: {pid}", f"date: {date}", "---", ""]
    for ms, spk, text in segs:
        s = ms // 1000
        lines.append(f"{s//3600:02d}:{(s%3600)//60:02d}:{s%60:02d} {spk}")
        lines.append(text)
        lines.append("")
    with open(out, "x", encoding="utf-8") as f:
        f.write("\n".join(lines).rstrip("\n") + "\n")
    spk_counts = {}
    for _, spk, _ in segs:
        spk_counts[spk] = spk_counts.get(spk, 0) + 1
    print(f"OK {len(segs)} segments -> {out}")
    print("speakers:", spk_counts)

if __name__ == "__main__":
    main()
