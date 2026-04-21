# Design Token Extractor

Extract design tokens from `.design-memory/reference.md` (or any markdown file) into structured JSON, CSS, SCSS, Tailwind, and Dart output formats.

## Quick Start

```bash
# Default: structured JSON output
python extract-tokens.py

# Custom output path
python extract-tokens.py -o dist/tokens.json

# All formats at once
python extract-tokens.py --format all

# SCSS variables
python extract-tokens.py --format scss -o _tokens.scss

# Tailwind config
python extract-tokens.py --format tailwind -o tailwind.config.tokens.js

# Flutter/Dart class
python extract-tokens.py --format dart -o design_tokens.dart

# CSS custom properties
python extract-tokens.py --format css -o _variables.css

# Merge multiple markdown files
python extract-tokens.py --merge .design-memory/*.md -o merged-tokens.json
```

## Output Formats

### JSON (default)

Structured [Design Token Schema](https://design-tokens.github.io/design-token-schema/) output with `$value`, `$type`, and `$description` metadata.

### CSS

`@root` block with native CSS custom properties:

```css
:root {
  --color-surface: #000000;
  --color-text: #010101;
  --font-heading: "Source Sans 3", sans-serif;
  --spacing-unit: 0px;
}
```

### SCSS

Nested `$tokens` map structure:

```scss
$tokens: (
  "color": (
    "surface": "#000000",
    "text": "#010101",
  ),
  "typography": (
    "heading": (
      "fontFamily": "Amaranth",
      "fontSize": "48px",
    ),
  ),
);
```

### Tailwind

`theme.extend` config with section mapping (colors, typography, screens, boxShadow, etc.):

```json
{
  "theme": {
    "extend": {
      "colors": { "surface": "#000000", "text": "#010101" },
      "screens": { "md": "768px" },
      "boxShadow": { "md": "0 4px 6px -1px rgba(0,0,0,0.1)" }
    }
  }
}
```

### Dart

Flutter `DesignTokens` class with typed constants:

```dart
class DesignTokens {
  DesignTokens._();

  // color
  static const String surface = "#000000";
  static const String accent = "#0173bc";

  // typography
  static const String heading = "{'fontFamily': 'Amaranth', 'fontSize': '48px'}";
}
```

## Input Sections

The parser scans markdown for these `##` sections:

| Section             | Format                                                   | Output Key        |
| ------------------- | -------------------------------------------------------- | ----------------- |
| `:root` block       | CSS custom properties                                    | `custom-property` |
| `Color Palette`     | Markdown table (Hex, Role, Usage)                        | `color`           |
| `Typography Scale`  | Markdown table (Family, Size, Weight, Line Height, Role) | `typography`      |
| `Component Recipes` | `### Name` + `**Usage:** text` blocks                    | `components`      |
| `Spacing Scale`     | Key: value pairs (`sm: 8px`)                             | `spacing`         |
| `Border Radius`     | Key: value pairs (`sm: 4px`)                             | `border-radius`   |
| `Shadow`            | Key: value pairs (`sm: 0 1px 3px #000`)                  | `shadow`          |
| `Breakpoints`       | Markdown table or key: value pairs                       | `breakpoints`     |
| `Layout`            | `- **Name** (tag): usage` format                         | `layout`          |
| `Z-Index`           | Key: numeric value pairs                                 | `z-index`         |
| `Animation`         | Key: value pairs (`fade: opacity 0.3s`)                  | `animation`       |
| `Design Principles` | Bullet list                                              | `principles`      |

## Reference File Structure

```markdown
## Color Palette

| Hex       | Role    | Usage                        |
| --------- | ------- | ---------------------------- |
| `#000000` | surface | h1 background, h2 background |
| `#0173bc` | accent  | a background, span text      |

## Typography Scale

| Family        | Size | Weight | Line Height | Role    |
| ------------- | ---- | ------ | ----------- | ------- |
| Source Sans 3 | 16px | 700    | 20          | label   |
| Amaranth      | 48px | 700    | 57.6        | heading |

## Component Recipes

### Button

**Usage:** Interactive action element

## Breakpoints

| Name | Value | Min Width | Max Width |
| ---- | ----- | --------- | --------- |
| md   | 768px |           |           |

## Layout

- **Header** (header): row
- **Footer** (footer): row

## Z-Index

| Name  | Value |
| ----- | ----- |
| below | -1    |
| base  | 0     |
| above | 10    |
```

## CLI Reference

```
extract-tokens.py [-h] [-o OUTPUT] [-f {json,css,scss,tailwind,dart,all}] [--merge] [files ...]

positional arguments:
  files                 Markdown files to parse (default: .design-memory/reference.md)

options:
  -h, --help            Show help message
  -o OUTPUT, --output OUTPUT
                        Output file path (default: .design-memory/tokens.json)
  -f {json,css,scss,tailwind,dart,all}, --format
                        Output format (default: json)
  --merge               Merge all input files into a single token set
```

## Token Type Detection

The script auto-detects token `$type` from values and property names:

- **color** — `#hex`, `rgba()`, `hsla()`, `linear-gradient()`, `radial-gradient()`
- **dimension** — numeric + unit (`24px`, `1.5rem`, `100%`)
- **fontFamily** — property name contains "font"
- **shadow** — property name contains "shadow"
- **borderRadius** — property name contains "radius"
- **spacing** — property name contains "spacing"
- **zIndex** — property name contains "z-"
- **opacity** — property name contains "opacity"

## File Structure

```
.design-memory/
  reference.md          ← Input design reference
  extract-tokens.py     ← This script
  tokens.json           ← Default JSON output (generated)
  README.md             ← This file
```
