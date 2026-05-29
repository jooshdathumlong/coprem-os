# PEABUNTID: MASTER PRODUCT DOCUMENT

> Source: Prem (founder) | Stored by Jeff | 2026-05-28

## 1. Vision & Positioning

**Vision:** Build **reliable information infrastructure for Thai people.** Curate, summarize, and organize real-world data, products, and services for easy access, reduced search burden, and confident decision-making. Focus on quality over quantity.

**Positioning:** Not a social platform, not an open marketplace, not a marketing agency. Peabuntid is a **central system: selector, organizer, and certifier of information.** Like a knowledgeable elder sibling who did the homework and passes on only the best.

**Goals:** (1) Reduce low-quality online data. (2) Increase visibility for quality small businesses. (3) Build long-term trustworthy information systems.

## 2. Brand Architecture

A single brand under the concept of **"The Trusted Curator"** — simple, trustworthy, neutral, community-helping without charity (creating opportunity instead).

- **For general users:** Pre-curated data source, reduced risk of misinformation, faster access.
- **For businesses/communities:** Quality products/services get proper presentation even without marketing expertise. Team helps organize and position.
- **For society:** Central infrastructure reducing redundancy and raising digital data standards.

## 3. Problem & Solution

**Problem:** Users face masses of unverified data, wasting time and eroding decision confidence. Quality small businesses get buried by large platforms focused on price competition and advertising.

**Solution:** Peabuntid curates, selects quality, organizes into easy-to-understand formats, and presents appropriately. Users don't need multiple sources. Businesses don't need to manage their own full online presence.

## 4. Core System (4 Pillars)

1. **Knowledge Warehouse:** Verified, summarized knowledge. Every article curated. No excess.
2. **Community Explorer:** Geographic database (country/province/area). Curated shop/service/local resource listings.
3. **Shop:** Curated products/services only. **No open listing.** Team reviews before publishing.
4. **Tell the Scholar:** Submission channel. Not instant — must pass curation first.

## 5. Core Advantage

1. **High Trust:** Curation process verifies all content. Users trust the quality.
2. **Excellent UX:** Clean, simple, no clutter or intrusive ads.
3. **Human Curation:** Human-selected and organized. Quality level automation cannot match.

## 6. Monetization

Revenue must not compromise trust:
- Curated product sales.
- Premium visibility services for businesses.
- High-value in-depth content.

**Iron Rule:** Revenue mechanisms must **never lower curation standards** and **never confuse users about data neutrality.**

## 7. Risk Management

**Key Risk:** If curation quality drops, trust collapses fast. Uncontrolled data intake destroys brand.
**Management:** Controlled growth. **Quality over quantity, always.**

## 8. Core Principle

> **"Prioritize data quality over quantity."** Every system element must have a reason to exist and deliver genuine user value.

## 9. System & Database Architecture

The system operates on a relational POS/Database model managed via ACF, built on 4 core entities:

1. **Customer (`customer`)**
   - *Role:* Manages customer profiles and privileges.
   - *ACF Fields:* `customer_discount` (Number, %).

2. **Product (`product`)**
   - *Role:* Master catalog.
   - *ACF Fields:* `price` (Number).

3. **Bill / Invoice Header (`bill`)**
   - *Role:* Aggregated sales record per transaction.
   - *ACF Fields:* `bill_number` (Text), `bill_date` (Date Picker, Ymd), `status` (Select: paid/unpaid), `customer_id` (Post Object), `bill_discount` (Number), `total_price` (Number).

4. **Bill Items (`bill_item`)**
   - *Role:* Line-item details.
   - *ACF Fields:* `bill_id` (Post Object), `product_id` (Post Object), `quantity` (Number), `price` (Number, locked at purchase time).

## 10. User Roles
- **Business Partners (คู่ค้า):** Suppliers or service providers listing on the platform.
- **Customers (ลูกค้า):** End-users searching for curated info or buying products.
- **Internal Operations (e.g., P'Kai):** Team members managing curation and backend processes.
