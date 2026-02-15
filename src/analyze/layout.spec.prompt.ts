export function buildLayoutSpecPrompt(screenshotWidth: number, screenshotHeight: number): string {
  return `Analyze this webpage screenshot and create a COMPREHENSIVE layout specification in JSON format that includes ALL visual details.

REQUIRED STRUCTURE WITH VISUAL DETAILS:
{
  "viewport": {
    "width": ${screenshotWidth},
    "height": ${screenshotHeight}
  },
  "container": {
    "maxWidth": "1280px",
    "padding": "0 24px",
    "alignment": "center"
  },
  "sections": [
    {
      "id": "header-1",
      "name": "Header",
      "type": "header",
      "position": {
        "vertical": "top",
        "horizontal": "full-width",
        "order": 1
      },
      "layout": {
        "pattern": "row",
        "alignment": "space-between"
      },
      "content": {
        "title": "Header",
        "items": ["Logo", "Navigation items", "Buttons"]
      },
      "styling": {
        "padding": "16px 24px",
        "backgroundColor": "#000000",
        "color": "#ffffff"
      },
      "visual": {
        "background": "#000000",
        "textColor": "#ffffff",
        "buttonStyle": {
          "backgroundColor": "#ffffff",
          "color": "#000000",
          "borderRadius": "6px"
        }
      }
    }
  ]
}

CRITICAL VISUAL DETAILS TO INCLUDE:
1. COLORS: For EVERY section, specify:
   - background/backgroundColor: exact hex color (e.g., "#000000" for black, "#ffffff" for white)
   - textColor/color: exact text color
   - For buttons: backgroundColor, color, border, borderRadius

2. TYPOGRAPHY: For text elements, specify:
   - fontSize: exact size (e.g., "48px", "24px", "16px")
   - fontWeight: "normal", "bold", "600", "700", etc.
   - lineHeight: e.g., "1.5", "1.2"
   - fontFamily: if visible (e.g., "Inter", "system-ui")

3. BUTTON STYLES: For each button, specify EXACT colors:
   - Primary button: backgroundColor, color, border, borderRadius
   - Secondary button: backgroundColor, color, border, borderRadius
   - Example: "Sign up" button might be white bg (#ffffff) with black text (#000000)

4. SPACING: Be precise:
   - padding: exact values (e.g., "16px 24px")
   - margin: exact values
   - gap: exact spacing between elements

5. LAYOUT ACCURACY:
   - If buttons are side-by-side, pattern: "row"
   - If content is centered, horizontal: "center"
   - If logo is left, nav center, buttons right: use "space-between" alignment

For EACH section, provide:
- id: unique identifier (string)
- name: descriptive name (string)
- type: MUST be one of: "header", "navigation", "hero", "section", "sidebar", "footer", "card", "button", "text", or "image" (use "section" for generic content areas)
- position: { vertical: "top"/"middle"/"bottom", horizontal: "left"/"center"/"right"/"full-width", order: number }
- layout: { pattern: "single"/"row"/"column"/"grid"/"flex"/"centered", columns?: number, gap?: string, alignment?: string }
- content: { title?: string, subtitle?: string, text?: string, items?: string[] }
- styling: { width?: string, maxWidth?: string, padding?: string, margin?: string, backgroundColor?: string, color?: string, borderRadius?: string, border?: string }
- visual: { background?: string, textColor?: string, buttonStyle?: object, typography?: object }

CRITICAL: 
- type field MUST be exactly one of the valid types listed above (use "section" if unsure)
- Extract EXACT colors from the screenshot (use hex codes like "#000000", "#ffffff")
- Specify button colors accurately (white button = #ffffff background, not blue)
- Include typography details for all text elements
- If cards are side-by-side, use pattern: "row" with gap
- Keep response concise but complete - focus on essential visual details
- Return valid JSON only. The screenshot is ${screenshotWidth}×${screenshotHeight} pixels.`;
}
