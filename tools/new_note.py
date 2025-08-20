#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import argparse, os, re, sys
from datetime import datetime
from pathlib import Path

CATS = {"cigars","cigarettes","pipe","ryo","snus","ecig"}

TEMPLATES = {
"cigars": """---
product: {title}
vitola: 
origin: 
price: 
rating: /100
pairing: 
tags: []
---
**Appearance/Draw**：  
**1/3**：  
**2/3**：  
**3/3**：  
**Burn/Ash**：  
**Retrohale**：  
**Verdict**：
""",
"cigarettes": """---
brand: {title}
style: 
rating: /5
price: 
tags: []
---
开包｜前段｜中段｜尾段；烟气密度/燃速/余味
""",
"pipe": """---
blend: {title}
cut: 
tin_date: 
rating: /5
tags: []
---
上段｜中段｜下段；温度/舌刺/湿度；余味
""",
"ryo": """---
tobacco: {title}
paper: 
filter: 
rating: /5
tags: []
---
切丝/含水｜点燃｜风味｜击喉｜燃速｜余味
""",
"snus": """---
brand: {title}
type: 
nicotine:  mg/g
rating: /5
tags: []
---
1–10min｜20–40min 的风味与滴漏；满足度
""",
"ecig": """---
device: 
coil: 
liquid: {title}
rating: /5
tags: []
---
闻香｜入口/稳定期风味｜喉感与余味
"""
}

def slugify(s:str)->str:
    s = re.sub(r"[^\w\- ]+", "", s.strip(), flags=re.U).replace(" ","-")
    return re.sub(r"-{2,}", "-", s).lower()

def main():
    ap = argparse.ArgumentParser(description="Create tasting note skeleton")
    ap.add_argument("category", choices=sorted(CATS))
    ap.add_argument("title", help="product/brand/flavor etc.")
    ap.add_argument("--date", default=datetime.now().strftime("%Y-%m-%d"))
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    args = ap.parse_args()

    root = Path(args.root)
    path = root / "notes" / args.category
    path.mkdir(parents=True, exist_ok=True)
    fn = f"{args.date}-{slugify(args.title)}.md"
    fp = path / fn

    if fp.exists():
        print(f"File exists: {fp}")
        sys.exit(1)

    content = TEMPLATES[args.category].format(title=args.title)
    fp.write_text(content, encoding="utf-8")
    print(fp)

if __name__ == "__main__":
    main()
