-- Test Data Generation Script for Shopu
-- Tenant ID: 924cf123-390e-4d26-8e69-5f2edc552a26

-- Clear existing data for the tenant (optional - uncomment if needed)
-- DELETE FROM product_images WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26';
-- DELETE FROM products WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26';
-- DELETE FROM categories WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26';

-- Insert Main Categories
INSERT INTO categories (id, name, slug, description, "parentId", "tenantId", "isActive", "createdAt", "updatedAt") VALUES
-- Electronics
(gen_random_uuid(), 'Electronics', 'electronics', 'Electronic devices and gadgets', NULL, '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
-- Clothing
(gen_random_uuid(), 'Clothing', 'clothing', 'Fashion and apparel', NULL, '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
-- Home & Garden
(gen_random_uuid(), 'Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL, '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
-- Sports & Outdoors
(gen_random_uuid(), 'Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', NULL, '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
-- Books & Media
(gen_random_uuid(), 'Books & Media', 'books-media', 'Books, movies, music and educational content', NULL, '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW());

-- Insert Electronics Subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "tenantId", "isActive", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Smartphones', 'smartphones', 'Mobile phones and accessories', (SELECT id FROM categories WHERE slug = 'electronics' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Laptops', 'laptops', 'Portable computers and notebooks', (SELECT id FROM categories WHERE slug = 'electronics' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Gaming', 'gaming', 'Gaming consoles and accessories', (SELECT id FROM categories WHERE slug = 'electronics' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Audio & Video', 'audio-video', 'Headphones, speakers, and media devices', (SELECT id FROM categories WHERE slug = 'electronics' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW());

-- Insert Clothing Subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "tenantId", "isActive", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Men''s Clothing', 'mens-clothing', 'Clothing for men', (SELECT id FROM categories WHERE slug = 'clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Women''s Clothing', 'womens-clothing', 'Clothing for women', (SELECT id FROM categories WHERE slug = 'clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Shoes', 'shoes', 'Footwear for all occasions', (SELECT id FROM categories WHERE slug = 'clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Accessories', 'accessories', 'Fashion accessories and jewelry', (SELECT id FROM categories WHERE slug = 'clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW());

-- Insert Home & Garden Subcategories
INSERT INTO categories (id, name, slug, description, "parentId", "tenantId", "isActive", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Furniture', 'furniture', 'Home and office furniture', (SELECT id FROM categories WHERE slug = 'home-garden' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Kitchen & Dining', 'kitchen-dining', 'Kitchen appliances and dining essentials', (SELECT id FROM categories WHERE slug = 'home-garden' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Garden Tools', 'garden-tools', 'Gardening equipment and tools', (SELECT id FROM categories WHERE slug = 'home-garden' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW()),
(gen_random_uuid(), 'Home Decor', 'home-decor', 'Decorative items and artwork', (SELECT id FROM categories WHERE slug = 'home-garden' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', true, NOW(), NOW());

-- Insert Products for Electronics
INSERT INTO products (id, title, description, slug, price, "stockQuantity", "tenantId", "categoryId", "createdAt", "updatedAt") VALUES
-- Smartphones
(gen_random_uuid(), 'iPhone 15 Pro', 'Latest Apple smartphone with advanced camera system', 'iphone-15-pro', 999.99, 25, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'smartphones' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Samsung Galaxy S24', 'Flagship Android smartphone with AI features', 'samsung-galaxy-s24', 899.99, 30, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'smartphones' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Google Pixel 8', 'Pure Android experience with excellent camera', 'google-pixel-8', 699.99, 20, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'smartphones' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),

-- Laptops
(gen_random_uuid(), 'MacBook Pro 16"', 'Professional laptop for creative work', 'macbook-pro-16', 2499.99, 15, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'laptops' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Dell XPS 13', 'Ultrabook with premium design', 'dell-xps-13', 1299.99, 22, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'laptops' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'ThinkPad X1 Carbon', 'Business laptop with excellent keyboard', 'thinkpad-x1-carbon', 1899.99, 18, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'laptops' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),

-- Gaming
(gen_random_uuid(), 'PlayStation 5', 'Next-gen gaming console', 'playstation-5', 499.99, 12, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'gaming' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Xbox Series X', 'Microsoft gaming console', 'xbox-series-x', 499.99, 10, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'gaming' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Nintendo Switch OLED', 'Portable gaming console', 'nintendo-switch-oled', 349.99, 35, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'gaming' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),

-- Audio & Video
(gen_random_uuid(), 'AirPods Pro', 'Wireless earbuds with noise cancellation', 'airpods-pro', 249.99, 50, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'audio-video' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Sony WH-1000XM5', 'Premium noise-cancelling headphones', 'sony-wh-1000xm5', 399.99, 28, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'audio-video' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW());

-- Insert Products for Clothing
INSERT INTO products (id, title, description, slug, price, "stockQuantity", "tenantId", "categoryId", "createdAt", "updatedAt") VALUES
-- Men's Clothing
(gen_random_uuid(), 'Classic Denim Jeans', 'Comfortable straight-fit jeans', 'classic-denim-jeans', 79.99, 45, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'mens-clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Cotton Polo Shirt', 'Premium cotton polo in multiple colors', 'cotton-polo-shirt', 39.99, 60, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'mens-clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Business Suit Jacket', 'Professional blazer for business wear', 'business-suit-jacket', 199.99, 25, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'mens-clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),

-- Women's Clothing
(gen_random_uuid(), 'Floral Summer Dress', 'Light and airy dress perfect for summer', 'floral-summer-dress', 89.99, 35, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'womens-clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Yoga Leggings', 'High-performance activewear leggings', 'yoga-leggings', 49.99, 55, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'womens-clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Silk Blouse', 'Elegant silk blouse for professional wear', 'silk-blouse', 129.99, 20, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'womens-clothing' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),

-- Shoes
(gen_random_uuid(), 'Running Sneakers', 'High-performance athletic shoes', 'running-sneakers', 129.99, 40, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'shoes' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Leather Dress Shoes', 'Classic leather oxfords', 'leather-dress-shoes', 189.99, 30, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'shoes' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Casual Canvas Sneakers', 'Comfortable everyday sneakers', 'casual-canvas-sneakers', 69.99, 50, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'shoes' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW());

-- Insert Products for Home & Garden
INSERT INTO products (id, title, description, slug, price, "stockQuantity", "tenantId", "categoryId", "createdAt", "updatedAt") VALUES
-- Furniture
(gen_random_uuid(), 'Ergonomic Office Chair', 'Comfortable chair for long work sessions', 'ergonomic-office-chair', 299.99, 15, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'furniture' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Modern Coffee Table', 'Sleek glass-top coffee table', 'modern-coffee-table', 449.99, 8, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'furniture' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Bookshelf Unit', 'Five-tier wooden bookshelf', 'bookshelf-unit', 199.99, 12, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'furniture' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),

-- Kitchen & Dining
(gen_random_uuid(), 'Stainless Steel Cookware Set', 'Professional-grade pots and pans', 'stainless-steel-cookware-set', 299.99, 20, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'kitchen-dining' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Premium Knife Set', 'High-carbon steel kitchen knives', 'premium-knife-set', 179.99, 25, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'kitchen-dining' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Coffee Maker', 'Programmable drip coffee maker', 'coffee-maker', 89.99, 30, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'kitchen-dining' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW());

-- Insert Sample Product Images using placeholder services
INSERT INTO product_images (id, url, "altText", filename, "productId", "tenantId", "sortOrder", "createdAt", "updatedAt") VALUES
-- iPhone 15 Pro images
(gen_random_uuid(), 'https://picsum.photos/400/400?random=1', 'iPhone 15 Pro front view', 'iphone-15-pro-1.jpg', (SELECT id FROM products WHERE slug = 'iphone-15-pro' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=2', 'iPhone 15 Pro back view', 'iphone-15-pro-2.jpg', (SELECT id FROM products WHERE slug = 'iphone-15-pro' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 1, NOW(), NOW()),

-- Samsung Galaxy S24 images
(gen_random_uuid(), 'https://picsum.photos/400/400?random=3', 'Samsung Galaxy S24 display', 'galaxy-s24-1.jpg', (SELECT id FROM products WHERE slug = 'samsung-galaxy-s24' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=4', 'Samsung Galaxy S24 camera', 'galaxy-s24-2.jpg', (SELECT id FROM products WHERE slug = 'samsung-galaxy-s24' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 1, NOW(), NOW()),

-- MacBook Pro images
(gen_random_uuid(), 'https://picsum.photos/400/400?random=5', 'MacBook Pro 16 inch open', 'macbook-pro-1.jpg', (SELECT id FROM products WHERE slug = 'macbook-pro-16' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=6', 'MacBook Pro 16 inch closed', 'macbook-pro-2.jpg', (SELECT id FROM products WHERE slug = 'macbook-pro-16' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 1, NOW(), NOW()),

-- PlayStation 5 images
(gen_random_uuid(), 'https://picsum.photos/400/400?random=7', 'PlayStation 5 console', 'ps5-1.jpg', (SELECT id FROM products WHERE slug = 'playstation-5' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=8', 'PlayStation 5 controller', 'ps5-2.jpg', (SELECT id FROM products WHERE slug = 'playstation-5' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 1, NOW(), NOW()),

-- Add images for clothing items
(gen_random_uuid(), 'https://picsum.photos/400/400?random=9', 'Classic denim jeans', 'jeans-1.jpg', (SELECT id FROM products WHERE slug = 'classic-denim-jeans' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=10', 'Floral summer dress', 'dress-1.jpg', (SELECT id FROM products WHERE slug = 'floral-summer-dress' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=11', 'Running sneakers', 'sneakers-1.jpg', (SELECT id FROM products WHERE slug = 'running-sneakers' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),

-- Add images for furniture
(gen_random_uuid(), 'https://picsum.photos/400/400?random=12', 'Ergonomic office chair', 'chair-1.jpg', (SELECT id FROM products WHERE slug = 'ergonomic-office-chair' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=13', 'Modern coffee table', 'table-1.jpg', (SELECT id FROM products WHERE slug = 'modern-coffee-table' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW()),
(gen_random_uuid(), 'https://picsum.photos/400/400?random=14', 'Stainless steel cookware', 'cookware-1.jpg', (SELECT id FROM products WHERE slug = 'stainless-steel-cookware-set' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), '924cf123-390e-4d26-8e69-5f2edc552a26', 0, NOW(), NOW());

-- Add some DRAFT products for testing
INSERT INTO products (id, title, description, slug, price, "stockQuantity", "tenantId", "categoryId", "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'Upcoming Gaming Laptop', 'High-performance gaming laptop - coming soon', 'upcoming-gaming-laptop', 1999.99, 0, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'laptops' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Designer Handbag', 'Luxury designer handbag - in development', 'designer-handbag', 599.99, 0, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'accessories' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW()),
(gen_random_uuid(), 'Smart Home Hub', 'Central control for smart home devices', 'smart-home-hub', 199.99, 0, '924cf123-390e-4d26-8e69-5f2edc552a26', (SELECT id FROM categories WHERE slug = 'electronics' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), NOW(), NOW());

-- Create some sample orders
INSERT INTO orders (id, "orderNumber", "tenantId", "customerEmail", "customerName", "totalAmount", "shippingAddress", "billingAddress", notes, "createdAt", "updatedAt") VALUES
(gen_random_uuid(), 'ORD-2024-001', '924cf123-390e-4d26-8e69-5f2edc552a26', 'john.doe@example.com', 'John Doe', 1249.98, '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}', '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}', 'Please leave at door', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(gen_random_uuid(), 'ORD-2024-002', '924cf123-390e-4d26-8e69-5f2edc552a26', 'jane.smith@example.com', 'Jane Smith', 399.99, '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210"}', '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210"}', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(gen_random_uuid(), 'ORD-2024-003', '924cf123-390e-4d26-8e69-5f2edc552a26', 'bob.wilson@example.com', 'Bob Wilson', 899.99, '{"street": "789 Pine Rd", "city": "Chicago", "state": "IL", "zip": "60601"}', '{"street": "789 Pine Rd", "city": "Chicago", "state": "IL", "zip": "60601"}', 'Call before delivery', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(gen_random_uuid(), 'ORD-2024-004', '924cf123-390e-4d26-8e69-5f2edc552a26', 'alice.brown@example.com', 'Alice Brown', 179.98, '{"street": "321 Elm St", "city": "Seattle", "state": "WA", "zip": "98101"}', '{"street": "321 Elm St", "city": "Seattle", "state": "WA", "zip": "98101"}', NULL, NOW(), NOW());

-- Insert order items for the orders
INSERT INTO order_items (id, "orderId", "productId", quantity, price, title, "createdAt") VALUES
-- Order 1 items
(gen_random_uuid(), (SELECT id FROM orders WHERE "orderNumber" = 'ORD-2024-001' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), (SELECT id FROM products WHERE slug = 'dell-xps-13' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), 1, 1299.99, 'Dell XPS 13', NOW() - INTERVAL '5 days'),

-- Order 2 items
(gen_random_uuid(), (SELECT id FROM orders WHERE "orderNumber" = 'ORD-2024-002' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), (SELECT id FROM products WHERE slug = 'sony-wh-1000xm5' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), 1, 399.99, 'Sony WH-1000XM5', NOW() - INTERVAL '2 days'),

-- Order 3 items
(gen_random_uuid(), (SELECT id FROM orders WHERE "orderNumber" = 'ORD-2024-003' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), (SELECT id FROM products WHERE slug = 'samsung-galaxy-s24' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), 1, 899.99, 'Samsung Galaxy S24', NOW() - INTERVAL '1 day'),

-- Order 4 items (multiple items)
(gen_random_uuid(), (SELECT id FROM orders WHERE "orderNumber" = 'ORD-2024-004' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), (SELECT id FROM products WHERE slug = 'cotton-polo-shirt' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), 2, 39.99, 'Cotton Polo Shirt', NOW()),
(gen_random_uuid(), (SELECT id FROM orders WHERE "orderNumber" = 'ORD-2024-004' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), (SELECT id FROM products WHERE slug = 'coffee-maker' AND "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'), 1, 89.99, 'Coffee Maker', NOW());

-- Display summary
SELECT
    'Categories Created' as "Type",
    COUNT(*) as "Count"
FROM categories
WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'
UNION ALL
SELECT
    'Products Created' as "Type",
    COUNT(*) as "Count"
FROM products
WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'
UNION ALL
SELECT
    'Product Images Created' as "Type",
    COUNT(*) as "Count"
FROM product_images
WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26'
UNION ALL
SELECT
    'Orders Created' as "Type",
    COUNT(*) as "Count"
FROM orders
WHERE "tenantId" = '924cf123-390e-4d26-8e69-5f2edc552a26';