DELETE FROM materials;

INSERT INTO materials (name, category, unit, material_rate_per_unit, labor_rate_per_unit, coverage_per_unit, description, texture_cloudinary_url, texture_public_id) VALUES
-- Paint
('Exterior Emulsion Paint', 'paint', 'litre', 350, 12, 120, 'Standard weather-resistant exterior emulsion paint', NULL, NULL),
('Texture Paint', 'paint', 'litre', 520, 15, 80, 'Decorative texture finish for exterior walls', NULL, NULL),
('Weatherproof Acrylic Paint', 'paint', 'litre', 420, 14, 100, 'Premium acrylic paint with UV and rain resistance', NULL, NULL),

-- Cladding
('Natural Stone Cladding', 'cladding', 'sqft', 180, 60, 1, 'Premium natural sandstone or slate cladding', NULL, NULL),
('Artificial Stone Cladding', 'cladding', 'sqft', 95, 45, 1, 'Cast stone panels, lighter and more affordable', NULL, NULL),
('Red Brick Cladding', 'cladding', 'sqft', 95, 45, 1, 'Classic red brick exterior finish', NULL, NULL),

-- Tile
('Ceramic Wall Tiles', 'tile', 'sqft', 65, 40, 1, 'Standard outdoor ceramic tiles for exterior walls', NULL, NULL),
('Vitrified Tiles', 'tile', 'sqft', 110, 45, 1, 'High-gloss vitrified tiles, frost and weather resistant', NULL, NULL),
('Porcelain Exterior Tiles', 'tile', 'sqft', 130, 50, 1, 'Heavy-duty porcelain tiles for outdoor facades', NULL, NULL),

-- Railing
('Glass Railing', 'railing', 'linear_ft', 850, 200, 1, 'Frameless toughened glass railing system', NULL, NULL),
('MS Metal Railing', 'railing', 'linear_ft', 450, 150, 1, 'Mild steel powder-coated railing', NULL, NULL),
('SS Steel Railing', 'railing', 'linear_ft', 650, 180, 1, 'Stainless steel tubular railing with satin finish', NULL, NULL),

-- Panel
('ACP Panel Cladding', 'panel', 'sqft', 145, 55, 1, 'Aluminium composite panel with modern finish', NULL, NULL),
('WPC Panel', 'panel', 'sqft', 120, 50, 1, 'Wood plastic composite panel, weather resistant', NULL, NULL),
('HPL Panel', 'panel', 'sqft', 160, 55, 1, 'High-pressure laminate panel for exterior cladding', NULL, NULL),

-- Texture
('Sand Texture Finish', 'texture', 'sqft', 35, 18, 1, 'Fine sand texture spray finish for exterior walls', NULL, NULL),
('Rustic Texture Finish', 'texture', 'sqft', 45, 22, 1, 'Coarse rustic texture finish with natural stone feel', NULL, NULL),

-- Glass
('Toughened Glass Facade', 'glass', 'sqft', 280, 120, 1, 'Toughened safety glass for facade panels', NULL, NULL),
('Frosted Glass Panel', 'glass', 'sqft', 320, 130, 1, 'Frosted toughened glass for privacy screens and partitions', NULL, NULL),

-- Window
('Wooden Casement Window', 'window', 'unit', 8500, 2500, 9, 'Classic wooden casement window with grid pattern', NULL, NULL),
('UPVC Sliding Window', 'window', 'unit', 6500, 1800, 9, 'Modern UPVC sliding window, low maintenance', NULL, NULL);
