# MarketScout SEO Tool

**MarketScout** is a proprietary internal tool for evaluating local SEO opportunities using structured keyword + location data. It helps identify under-served markets in rank-and-rent SEO strategies by analyzing demand (via Google Ads API) and competition (via Google Search and Maps).

---

## 🧭 Overview

This tool is used for internal research to determine:
- Which local service niches have viable search traffic
- Where competition is weak or missing
- What city + keyword combos present strong opportunity for building lead-gen assets

The tool processes input CSVs of niche/location pairs, then runs automated analysis using:
- Search volume and CPC data via **Google Ads API**
- Competitor listings via **Google Maps / Local Pack**
- Organic SERP results via **SerpAPI**
- Internal scoring logic to calculate opportunity level (High, Medium, Low)

---

## 🎯 Business Use Case

MarketScout supports a **rank-and-rent business model** where the operator builds local SEO sites and rents them out to real businesses once lead flow is proven. The tool streamlines research, prioritization, and lead estimation.

Example use:
Keyword: "Concrete Contractor"
Location: "Portland, OR"
→ Result: 260 monthly searches, $4.25 CPC, weak competition
→ Score: High opportunity
