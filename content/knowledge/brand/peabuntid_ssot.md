# Peabuntid Single Source of Truth (SSOT)

## 1. POS System Database Architecture (ACF Structure)
The system is built on 4 core relational data entities:

- **1. Customer (`customer`)**
  - *Purpose:* Customer profiles and privilege management.
  - *Key Field:* `customer_discount` (Number) - Individual percentage discount.

- **2. Product (`product`)**
  - *Purpose:* Master product catalog.
  - *Key Field:* `price` (Number) - Standard unit selling price.

- **3. Bill/Invoice Header (`bill`)**
  - *Purpose:* Aggregated sales record per transaction.
  - *Key Fields:* 
    - `bill_number` (Text) - Sequential order ID.
    - `bill_date` (Date Picker) - Transaction date (Ymd).
    - `status` (Select) - Payment status (paid / unpaid).
    - `customer_id` (Post Object) - Relational link to `customer`.
    - `bill_discount` (Number) - Additional counter discount applied.
    - `total_price` (Number) - Net total to be collected.

- **4. Bill Items (`bill_item`)**
  - *Purpose:* Line-item details for each purchased product.
  - *Key Fields:*
    - `bill_id` (Post Object) - Relational link to parent `bill`.
    - `product_id` (Post Object) - Relational link to `product`.
    - `quantity` (Number) - Units purchased.
    - `price` (Number) - Locked unit price *at the time of purchase* (prevents historical data corruption from future price changes).

## 2. User Roles
- Business Partners (คู่ค้า)
- Customers (ลูกค้า)
- Internal Stakeholders (e.g., P'Kai)
