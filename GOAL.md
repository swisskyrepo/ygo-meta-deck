---
name: deep-research-deck
description: Generate a detailed walkthrough of the YuGioh deck, including combos, playstyle, win conditions, end board examples, tips, recovery options, and side deck options for matchups and counters.
license: MIT
user-invocable: true
---

Run in YOLO mode: `codex --dangerously-bypass-approvals-and-sandbox`

/goal Generate a list of combo, detailed walkthrough of the YuGioh deck "Sky Striker Mitsurugi".

- Find combo spreadsheet
- Search the latest meta tips for the deck.
- Explore deck variant in the latest tournament top.

Output: Generate a mind map for the deck, as an HTML format.
Expected content:
- Combos (card, explanations)
    - Playstyle and Win Condition
    - Core Combos and Interactions
- End board examples
    - Field by End Phase
- Tips
- Recovery options
- Side deck options for matchup, and counters

Rules:
- Use real image of the cards, they can be found at https://images.ygoprodeck.com/images/cards/CARD_ID.jpg
example: "Sky Striker Ace - Zero" is ID 76072561.
https://ygoprodeck.com/card/?search=73819701
- The output should be read more like a cheatsheet card, from top to bottom with specific sections
- Combos must be displayed as a graph to explore multiple out
- Polished output with "+", "info" icons and cards that triggers together
- Mobile responsive
- Hover on card to see them bigger
- Hidden tab to display the references used to build the cheatsheet knowledge

Resources:
- https://www.masterduelmeta.com/combos-and-counters
