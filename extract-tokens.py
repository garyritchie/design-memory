#!/usr/bin/env python3
"""
Extract design tokens from .design-memory/reference.md (or any markdown file) into structured JSON.

Also supports output in CSS, SCSS, Tailwind config, and Flutter/Dart formats.

Usage:
    python .design-memory/extract-tokens.py                                    # -> tokens.json
    python .design-memory/extract-tokens.py -o output.json                     # custom output
    python .design-memory/extract-tokens.py --format scss                      # SCSS output
    python .design-memory/extract-tokens.py --format tailwind                  # Tailwind config
    python .design-memory/extract-tokens.py --format dart                      # Flutter/Dart
    python .design-memory/extract-tokens.py --format css                       # CSS variables
    python .design-memory/extract-tokens.py --format all                       # all formats
    python .design-memory/extract-tokens.py --merge .design-memory/*.md        # merge multiple files
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Any


class OutputFormat(str, Enum):
    JSON = "json"
    CSS = "css"
    SCSS = "scss"
    TAILWIND = "tailwind"
    DART = "dart"
    ALL = "all"


# ---------------------------------------------------------------------------
# Token types and metadata
# ---------------------------------------------------------------------------

TOKEN_TYPES = {
    "color": "color",
    "shadow": "shadow",
    "dimension": "dimension",
    "spacing": "spacing",
    "border-radius": "borderRadius",
    "font-family": "fontFamily",
    "font-size": "fontSize",
    "font-weight": "fontWeight",
    "line-height": "lineHeight",
    "gradient": "gradient",
    "opacity": "opacity",
    "z-index": "zIndex",
    "animation": "animation",
    "transition": "transition",
    "typography": "typography",
    "component": "component",
    "layout": "layout",
    "breakpoint": "breakpoint",
    "principle": "principle",
    "text": "text",
}


def infer_type(value: str, name: str = "") -> str:
    """Infer the token $type from the value and/or name."""
    val = value.strip()
    if re.match(r"^#[0-9a-fA-F]{3,8}$", val):
        return "color"
    if re.match(r"^(rgba?|hsla?)\(", val):
        return "color"
    if "linear-gradient(" in val or "radial-gradient(" in val:
        return "gradient"
    if re.match(r"^\d+(\.\d+)?(px|rem|em|vh|vw|pt|mm|cm|in|fr)$", val):
        return "dimension"
    if "font" in name.lower():
        return "fontFamily"
    if "shadow" in name.lower():
        return "shadow"
    if "radius" in name.lower():
        return "borderRadius"
    if "spacing" in name.lower():
        return "spacing"
    if "opacity" in name.lower():
        return "opacity"
    if "z-" in name.lower():
        return "zIndex"
    return "any"


# ---------------------------------------------------------------------------
# CSS variable parsing
# ---------------------------------------------------------------------------

_CSS_SKIP_PREFIXES = (
    "--wp--preset--", "--wp-admin-", "--wp-block-", "--wp-editor-",
    "--wp-bound-", "--sa-", "--_sa-", "--wp--global-",
)


def _is_design_token(name: str) -> bool:
    return not any(name.startswith(p) for p in _CSS_SKIP_PREFIXES)


def parse_css_variables(content: str) -> dict:
    """Extract CSS custom properties from the first :root block before 'Site-Defined'."""
    # Stop at the Site-Defined section or next code block
    site_marker = re.search(r"Site-Defined|```\s*$", content)
    search_area = content[:site_marker.start()] if site_marker else content

    root_match = re.search(r":root\s*\{([^}]+)\}", search_area)
    if not root_match:
        return {}

    custom_props = {}
    props = re.findall(r"(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);", root_match.group(1))
    for name, value in props:
        name = name.strip()
        if not _is_design_token(name):
            continue
        val = value.strip()
        type_val = infer_type(val, name)
        custom_props[name] = {
            "$value": val,
            "$type": type_val,
        }
    return {"custom-property": custom_props} if custom_props else {}


# ---------------------------------------------------------------------------
# Table parsing (section-aware)
# ---------------------------------------------------------------------------

def _extract_section(content: str, heading: str) -> str:
    """Extract content between a ## heading and the next ## heading (or EOF)."""
    marker = f"## {heading}\n"
    start = content.find(marker)
    if start == -1:
        return ""
    start += len(marker)
    rest = content[start:]
    next_h = re.search(r"\n## ", rest)
    return rest[:next_h.start()] if next_h else rest


def parse_table(content: str, heading: str, col_headers: list[str]) -> list[dict]:
    """Parse a Markdown table after a given ## heading, stopping at the next ## heading."""
    section = _extract_section(content, heading)
    if not section:
        return []

    lines = section.strip().split("\n")
    lines = [l.strip() for l in lines if l.strip() and not all(c in "-|" for c in l.strip())]
    if len(lines) < 1:
        return []

    headers = [h.strip() for h in lines[0].strip("|").split("|")]
    if headers != col_headers:
        return []

    rows = []
    for line in lines[1:]:
        cells = [c.strip() for c in line.strip("| ").split("|")]
        row = dict(zip(headers, cells))
        rows.append(row)
    return rows


# ---------------------------------------------------------------------------
# Section-specific parsers
# ---------------------------------------------------------------------------

def parse_color_palette(content: str) -> dict:
    table = parse_table(content, "Color Palette", ["Hex", "Role", "Usage"])
    if not table:
        return {}
    tokens = {}
    for row in table:
        hex_val = row.get("Hex", "").strip().strip("`")
        role = row.get("Role", "").strip()
        usage = row.get("Usage", "").strip()
        if hex_val and role:
            tokens[role] = {
                "$value": hex_val,
                "$type": "color",
            }
            if usage:
                tokens[role]["$description"] = usage
    return tokens


def parse_color_tokens(content: str) -> dict:
    """Parse a '### Colors' or '## Colors' section with key-value or list format."""
    section = _extract_section(content, "Colors")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        # Key: value format
        m = re.match(r"([\w-]+)\s*[:=]\s*(#[0-9a-fA-F]{3,8})", line)
        if m:
            key = m.group(1).lower().replace("-", "_")
            tokens[key] = {"$value": m.group(2), "$type": "color"}
    return tokens


def parse_typography(content: str) -> dict:
    """Parse typography from a table (deduplicates by role, keeping the first match)."""
    table = parse_table(content, "Typography Scale", ["Family", "Size", "Weight", "Line Height", "Role"])
    if not table:
        return {}
    tokens = {}
    seen_roles: set = set()
    for row in table:
        role = row.get("Role", "").strip().lower().replace(" ", "_")
        if not role or role in seen_roles:
            continue
        seen_roles.add(role)
        tokens[f"typography/{role}"] = {
            "$value": {
                "fontFamily": row.get("Family", "").strip(),
                "fontSize": row.get("Size", "").strip(),
                "fontWeight": row.get("Weight", "").strip(),
                "lineHeight": row.get("Line Height", "").strip(),
            },
            "$type": "any",
        }
    return tokens


def parse_components(content: str) -> dict:
    section = _extract_section(content, "Component Recipes")
    if not section:
        return {}
    blocks = re.findall(
        r"### ([^\n]+?)\n\*\*Usage:\*\* (.*?)(?=\n### |\Z)", section, re.DOTALL
    )
    tokens = {}
    for name_raw, usage in blocks:
        name = re.sub(r"\s*\([^)]+\)", "", name_raw).strip()
        if name:
            tokens[f"component/{name}"] = {"$value": usage.strip(), "$type": "any", "$extensions": {"com/design-tokens/type": "component"}}
    return tokens


def parse_spacing(content: str) -> dict:
    """Parse a spacing scale from table or list format."""
    section = _extract_section(content, "Spacing Scale")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        if not line or line.startswith("|"):
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*([\d.]+)(px|rem|em)?", line)
        if m:
            name = m.group(1).lower()
            val = m.group(2)
            unit = m.group(3) or "px"
            tokens[f"spacing/{name}"] = {
                "$value": f"{val}{unit}",
                "$type": "dimension",
            }
    return tokens


def parse_border_radius(content: str) -> dict:
    """Parse border-radius tokens."""
    section = _extract_section(content, "Border Radius")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*([\d.]+)(px|rem|em|%)?", line)
        if m:
            name = m.group(1).lower().replace("_", "-")
            val = m.group(2)
            unit = m.group(3) or "px"
            tokens[f"radius/{name}"] = {
                "$value": f"{val}{unit}",
                "$type": "border-radius",
            }
    return tokens


def parse_shadow(content: str) -> dict:
    """Parse shadow tokens."""
    section = _extract_section(content, "Shadow")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        if not line or line.startswith("|") or line.startswith("#"):
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*(.+)", line)
        if m:
            name = m.group(1).lower()
            tokens[f"shadow/{name}"] = {
                "$value": m.group(2).strip(),
                "$type": "shadow",
            }
    return tokens


def parse_breakpoints(content: str) -> dict:
    section = _extract_section(content, "Breakpoints")
    if not section:
        return {}
    tokens = {}
    # Try table format first
    table = parse_table(content, "Breakpoints", ["Name", "Value", "Min Width", "Max Width"])
    if table:
        for row in table:
            name = row.get("Name", "").strip().lower()
            val = row.get("Value", "").strip()
            if name and val:
                tokens[f"breakpoint/{name}"] = {"$value": val, "$type": "dimension"}
        return tokens

    # Try list/key-value format
    for line in section.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*([\d.]+)(px|rem|em)?", line)
        if m:
            tokens[f"breakpoint/{m.group(1).lower()}"] = {
                "$value": f"{m.group(2)}{m.group(3) or 'px'}",
                "$type": "dimension",
            }

    # Fallback: inline backtick values
    if not tokens:
        bp_values = re.findall(r"`([^`]+)`", section)
        for i, bp in enumerate(bp_values):
            tokens[f"screen/{i}"] = {"$value": bp.strip(), "$type": "dimension"}
    return tokens


def parse_z_index(content: str) -> dict:
    section = _extract_section(content, "Z-Index")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*(\d+)", line)
        if m:
            tokens[f"z-index/{m.group(1).lower()}"] = {
                "$value": int(m.group(2)),
                "$type": "dimension",
            }
    return tokens


def parse_animation(content: str) -> dict:
    section = _extract_section(content, "Animation")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        if not line or line.startswith("|"):
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*(.+)", line)
        if m:
            tokens[f"animation/{m.group(1).lower()}"] = {
                "$value": m.group(2).strip(),
                "$type": "any",
            }
    return tokens


def parse_layout(content: str) -> dict:
    section = _extract_section(content, "Layout")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        m = re.match(r"- \*\*(.+?)\*\* \((.+?)\): (.+)", line.strip())
        if m:
           tokens[f"layout/{m.group(1).strip()}"] = {
                "$value": {
                    "tag": m.group(2).strip(),
                    "usage": m.group(3).strip(),
                },
                "$type": "any",
                "$extensions": { "com/design-tokens/type": "layout" },
            }
    return tokens


def parse_principles(content: str) -> dict:
    section = _extract_section(content, "Design Principles")
    if not section:
        return {}
    lines = [l.strip() for l in section.split("\n") if l.strip()]
    if lines and all(l.startswith("- ") for l in lines):
        tokens = {}
        for i, p in enumerate(lines):
            tokens[f"principle/{i}"] = {"$value": p[2:].strip(), "$type": "any"}
        return tokens
    if lines:
        return {"$value": "\n".join(lines), "$type": "any"}
    return {}


def parse_animation(content: str) -> dict:
    """Parse animation tokens from a section."""
    section = _extract_section(content, "Animation")
    if not section:
        return {}
    tokens = {}
    for line in section.split("\n"):
        line = line.strip()
        if not line or line.startswith("|"):
            continue
        m = re.match(r"([\w-]+)\s*[:=]\s*(.+)", line)
        if m:
            tokens[f"animation/{m.group(1).lower()}"] = {
                "$value": m.group(2).strip(),
                "$type": "any",
            }
    return tokens


# ---------------------------------------------------------------------------
# Main parser
# ---------------------------------------------------------------------------

def parse_reference_md(source: str | Path) -> dict:
    """Parse a markdown design reference and return structured tokens."""
    source = Path(source)
    if not source.exists():
        raise FileNotFoundError(f"File not found: {source}")

    content = source.read_text(encoding="utf-8")

    tokens = {
        "$schema": "https://www.designtokens.org/TR/drafts/format/",
        "version": "1.0.0",
        "source": str(source),
    }

    # CSS variables (intentional design tokens only)
    tokens |= parse_css_variables(content)

    # Section parsers
    for name, fn in [
        ("color", parse_color_palette),
        ("typography", parse_typography),
        ("components", parse_components),
        ("spacing", parse_spacing),
        ("border-radius", parse_border_radius),
        ("shadow", parse_shadow),
        ("breakpoints", parse_breakpoints),
        ("layout", parse_layout),
        ("principles", parse_principles),
        ("z-index", parse_z_index),
        ("animation", parse_animation),
    ]:
        section = fn(content)
        if section:
            tokens[name] = section

    return tokens


# ---------------------------------------------------------------------------
# Output formatters
# ---------------------------------------------------------------------------

def _flatten_tokens(tokens: dict, prefix: str = "", skip_meta: bool = True) -> list[tuple[str, Any]]:
    """Flatten nested token dicts into (key, value) pairs for output."""
    items = []
    for key, val in tokens.items():
        if skip_meta and key.startswith("$"):
            continue
        full = f"{prefix}/{key}" if prefix else key
        if isinstance(val, dict) and "$value" in val:
            items.append((full, val["$value"]))
        elif isinstance(val, dict):
            items.extend(_flatten_tokens(val, full, skip_meta))
        else:
            items.append((full, val))
    return items


def format_json(tokens: dict) -> str:
    return json.dumps(tokens, indent=2, ensure_ascii=False) + "\n"


def _token_sections(tokens: dict) -> dict:
    """Return only the token sections, excluding $-prefixed metadata."""
    return {k: v for k, v in tokens.items() if not k.startswith("$") and isinstance(v, dict)}


def _extract_css_vars(section_tokens: dict) -> list[tuple[str, str, str]]:
    """Extract (var_name, value, type) from custom-property section."""
    result = []
    for key, val in section_tokens.items():
        var_name = key  # already like --color-surface
        if isinstance(val, dict) and "$value" in val:
            result.append((var_name, val["$value"], val.get("$type", "any")))
        else:
            result.append((var_name, str(val), "any"))
    return result


def format_css(tokens: dict) -> str:
    """Format tokens as CSS custom properties (for :root)."""
    lines = [":root {"]
    for section_name, section_tokens in _token_sections(tokens).items():
        if section_name == "custom-property":
            for var_name, val, typ in _extract_css_vars(section_tokens):
                lines.append(f"  {var_name}: {val};")
        else:
            for key, val in section_tokens.items():
                if isinstance(val, dict) and "$value" in val:
                    css_name = f"--{section_name.replace('_', '-')}-{key.replace('/', '-').replace('_', '-').lower()}"
                    lines.append(f"  {css_name}: {val['$value']};")
    lines.append("}")
    return "\n".join(lines) + "\n"


def format_scss(tokens: dict) -> str:
    """Format tokens as SCSS variables (nested)."""
    lines = ["$tokens: ("]
    for section_name, section_tokens in _token_sections(tokens).items():
        if section_name == "custom-property":
            lines.append(f"  '{section_name}': (")
            for var_name, val, typ in _extract_css_vars(section_tokens):
                safe_name = var_name.lstrip("-").replace("-", "_").replace("/", "_")
                if isinstance(val, str):
                    lines.append(f"    '{safe_name}': '{val}',")
                elif isinstance(val, (int, float)):
                    lines.append(f"    '{safe_name}': {val},")
                else:
                    lines.append(f"    '{safe_name}': '{json.dumps(val)}',")
            lines.append("  ),")
        else:
            lines.append(f"  '{section_name}': (")
            for key, val in section_tokens.items():
                safe_name = key.replace("-", "_").replace("/", "_").replace(" ", "_")
                if isinstance(val, dict):
                    if "$value" in val:
                        v = val["$value"]
                        if isinstance(v, dict):
                            entries = ", ".join(f"'{k}': '{vv}'" for k, vv in v.items())
                            lines.append(f"    '{safe_name}': ({entries}),")
                        elif isinstance(v, str):
                            lines.append(f"    '{safe_name}': '{v}',")
                        elif isinstance(v, (int, float)):
                            lines.append(f"    '{safe_name}': {v},")
                    elif isinstance(val, dict) and not "$value" in val:
                        entries = ", ".join(f"'{k}': '{vv}'" for k, vv in val.items())
                        lines.append(f"    '{safe_name}': ({entries}),")
                else:
                    lines.append(f"    '{safe_name}': '{val}',")
            lines.append("  ),")
    lines.append(")")
    return "\n".join(lines) + "\n"


def format_tailwind(tokens: dict) -> dict:
    """Format tokens as a Tailwind CSS config object."""
    config = {"theme": {"extend": {}}}
    for section_name, section_tokens in _token_sections(tokens).items():
        # Map section names to Tailwind theme sections
        tw_section = {
            "color": "colors",
            "color_palette": "colors",
            "custom-property": "customProperties",
            "spacing": "spacing",
            "border-radius": "borderRadius",
            "typography": "typography",
            "breakpoints": "screens",
            "shadow": "boxShadow",
            "animation": "animation",
            "transition": "transition",
            "z-index": "zIndex",
            "opacity": "opacity",
        }.get(section_name, section_name)

        if tw_section not in config["theme"]["extend"]:
            config["theme"]["extend"][tw_section] = {}

        if section_name == "custom-property":
            for var_name, val, typ in _extract_css_vars(section_tokens):
                config["theme"]["extend"][tw_section][var_name] = val
        else:
            for key, val in section_tokens.items():
                if isinstance(val, dict) and "$value" in val:
                    config["theme"]["extend"][tw_section][key] = val["$value"]
                else:
                    config["theme"]["extend"][tw_section][key] = str(val)

    return json.dumps(config, indent=2, ensure_ascii=False) + "\n"


def format_dart(tokens: dict) -> str:
    """Format tokens as Flutter/Dart AppThemeData constants."""
    lines = [
        "/// Auto-generated design tokens",
        "/// Source: " + tokens.get("source", "unknown"),
        "",
        "class DesignTokens {",
        "  DesignTokens._();",
        "",
    ]
    for section_name, section_tokens in _token_sections(tokens).items():
        safe_section = section_name.replace("-", "_").title().replace("_", "")
        lines.append(f"  // {section_name}")
        if section_name == "custom-property":
            for var_name, val, typ in _extract_css_vars(section_tokens):
                safe_name = var_name.lstrip("-").replace("-", "_").replace("/", "_")
                type_hint = "double" if isinstance(val, (int, float)) else "String"
                if isinstance(val, str):
                    lines.append(f'  static const {type_hint} {safe_name} = "{val}";')
                else:
                    lines.append(f"  static const {type_hint} {safe_name} = {val};")
        else:
            for key, val in section_tokens.items():
                safe_name = key.replace("/", "_").replace("-", "_")
                if isinstance(val, dict):
                    if "$value" in val:
                        v = val["$value"]
                        type_hint = "double" if isinstance(v, (int, float)) else "String"
                        if isinstance(v, str):
                            lines.append(f'  static const {type_hint} {safe_name} = "{v}";')
                        else:
                            lines.append(f"  static const {type_hint} {safe_name} = {v};")
                    elif isinstance(val, dict):
                        entries = ", ".join(f"'{k}': '{vv}'" for k, vv in val.items())
                        lines.append(f"  static const Map<String, dynamic> {safe_name} = {{{entries}}};")
                else:
                    lines.append(f'  static const String {safe_name} = "{val}";')
        lines.append("")
    lines.append("}")
    return "\n".join(lines) + "\n"


FORMATTERS = {
    "json": format_json,
    "css": format_css,
    "scss": format_scss,
    "tailwind": format_tailwind,
    "dart": format_dart,
}


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Extract design tokens from markdown files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python extract-tokens.py
  python extract-tokens.py -o tokens.json
  python extract-tokens.py --format scss
  python extract-tokens.py --merge *.md
  python extract-tokens.py --format all
        """,
    )
    parser.add_argument(
        "files", nargs="*", default=[".design-memory/reference.md"],
        help="Markdown files to parse (default: .design-memory/reference.md)",
    )
    parser.add_argument("-o", "--output", default=".design-memory/tokens.json",
                        help="Output file path (default: .design-memory/tokens.json)")
    parser.add_argument("-f", "--format", choices=list(FORMATTERS.keys()) + ["all"], default="json",
                        help="Output format (default: json)")
    parser.add_argument("--merge", action="store_true",
                        help="Merge all input files into a single token set")

    args = parser.parse_args()

    # Handle merge mode
    if args.merge or len(args.files) > 1:
        all_tokens: dict[str, Any] = {}
        for f in args.files:
            section_tokens = parse_reference_md(f)
            for key, val in section_tokens.items():
                if key.startswith("$"):
                    continue
                if key in all_tokens and isinstance(all_tokens[key], dict) and isinstance(val, dict):
                    all_tokens[key] |= val
                elif key in all_tokens:
                    pass  # skip duplicate top-level keys
                else:
                    all_tokens[key] = val
        all_tokens["$sources"] = [str(f) for f in args.files]
        all_tokens["$schema"] = "https://design-tokens.github.io/design-token-schema/"
        all_tokens["$version"] = "1.0.0"
        result = {k: v for k, v in all_tokens.items()}
    else:
        result = parse_reference_md(args.files[0]) if args.files else parse_reference_md(".design-memory/reference.md")

    # Handle multi-format output
    if args.format == "all":
        base = Path(args.output)
        for fmt, formatter in FORMATTERS.items():
            if str(base) in ("/dev/stdout", sys.stdout.name):
                print(f"\n=== {fmt.upper()} ===")
                print(formatter(result))
            else:
                out_path = str(base.with_suffix(f".{fmt}"))
                Path(out_path).write_text(formatter(result), encoding="utf-8")
                print(f"  -> {out_path}")
    else:
        formatter = FORMATTERS[args.format]
        output = formatter(result)
        Path(args.output).write_text(output, encoding="utf-8")
        print(f"  -> {args.output}")

    # Summary (JSON only)
    if args.format == "json":
        total = 0
        for key, val in result.items():
            if key.startswith("$"):
                continue
            if isinstance(val, dict):
                total += len(val)
        print(f"  Total: {total} token{'s' if total != 1 else ''}")
        for key, val in result.items():
            if key.startswith("$"):
                continue
            if isinstance(val, dict) and val:
                print(f"  {key}: {len(val)}")


if __name__ == "__main__":
    main()
