# Wire Squad design handoff

- artboards/: 16 published canvas artboards (.dc.html). Markup is static inline SVG/HTML/CSS; open them as text and copy components. They only render inside the Design canvas (they load ./support.js), so use them as source, not as standalone pages.
- generators/: Python scripts that produced the artboards. common.py, rack.py, board.py, table.py, ui.py hold reusable functions (tile_svg, info_token, dial_svg, rack, board, ...). Port these to JS render functions for index.html; run `python3 p1.py` etc. to regenerate (set ROOT in common.py first).
- BombBusters_05_Implementation_Plan.md: the implementation plan.
