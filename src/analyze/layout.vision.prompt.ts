export function buildLayoutVisionPrompt(screenshotWidth: number, screenshotHeight: number): string {
  return `Analyze this webpage screenshot with EXTREME PRECISION (target: 95-99% accuracy). Create a detailed ASCII art diagram.

CRITICAL: Identify and label EVERY visual element you can see:

1. HEADER/NAVIGATION (top of page):
   - Logo (where is it? left/center/right?)
   - Navigation menu items (list them: "Product", "Resources", etc.)
   - Action buttons (e.g., "Log in", "Sign up" - where are they?)
   - Any other header elements

2. HERO SECTION (main focal area):
   - Main headline text (what does it say? label it)
   - Subheading/description text (label it)
   - Call-to-action buttons (label each button)
   - Any images or graphics in hero
   - How is hero laid out? (text left, image right? centered? full width?)

3. CONTENT SECTIONS (below hero):
   - Each distinct section (label with actual content if readable)
   - Cards/features (how many? what are they called?)
   - Text blocks (headings, paragraphs)
   - Images or graphics
   - How are they arranged? (columns? grid? stacked?)

4. SIDEBARS (if any):
   - Left sidebar? Right sidebar?
   - What content is in each?

5. FOOTER (bottom):
   - Links, text, copyright, etc.

STEP 2: Create ASCII diagram with CRITICAL ATTENTION TO HORIZONTAL LAYOUT:

MOST IMPORTANT: If elements are side-by-side in the screenshot, they MUST be side-by-side in your ASCII diagram!

CORRECT EXAMPLE (3 cards side-by-side):
┌────────────────────────────────────────────────────────────┐
│ [Card 1: Purpose-built] [Card 2: Move fast] [Card 3: Crafted] │
└────────────────────────────────────────────────────────────┘

WRONG EXAMPLE (cards stacked):
┌────────────────────────────────────────────────────────────┐
│ [Card 1: Purpose-built]                                    │
│ [Card 2: Move fast]                                        │
│ [Card 3: Crafted]                                          │
└────────────────────────────────────────────────────────────┘

HORIZONTAL POSITIONING RULES:
1. Header layout (if logo left, nav center, buttons right):
   ┌────────────────────────────────────────────────────────────┐
   │ [Logo]        [Nav: Product|Resources|Pricing]    [Log in|Sign up] │
   └────────────────────────────────────────────────────────────┘

2. Centered content with gaps:
   ┌────────────────────────────────────────────────────────────┐
   │    [Gap]    [Main Content Centered]    [Gap]              │
   └────────────────────────────────────────────────────────────┘

3. Side-by-side cards (use full width, show spacing between):
   ┌────────────────────────────────────────────────────────────┐
   │ [Card 1]  [Card 2]  [Card 3]                             │
   └────────────────────────────────────────────────────────────┘

4. Two-column layout:
   ┌────────────────────────────────────────────────────────────┐
   │ [Left Column]        [Right Column]                       │
   └────────────────────────────────────────────────────────────┘

5. Sidebar + main content:
   ┌────────────────────────────────────────────────────────────┐
   │ [Sidebar]  [Main Content Area]                             │
   └────────────────────────────────────────────────────────────┘

CRITICAL: 
- Look at the screenshot - are cards in a ROW? Show them in a ROW in ASCII
- Is there empty space on left/right? Show it with spaces or gaps
- Are elements left-aligned, centered, or right-aligned? Show it accurately
- Use the full 78-character width to show horizontal relationships

The screenshot is ${screenshotWidth}×${screenshotHeight} pixels. Your diagram must match the visual structure at 95-99% accuracy, especially horizontal positioning and side-by-side elements.`;
}
