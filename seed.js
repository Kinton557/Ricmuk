'use strict';
/* Starter catalogue for Ricmuk Enterprises (built from the products on their flyers).
   !! PRICES ARE SAMPLE PLACEHOLDERS. Update every price in Dashboard > Products before going live. !! */

const CATEGORIES = [
  ['roofing',    'Roofing Sheets',        'IBR, Q-tile and corrugated sheets',        'flyer-ibr.jpg'],
  ['steel',      'Angle Irons & Tubes',   'Angle irons and square tubes',             'flyer-angle-irons.jpg'],
  ['cement',     'Cement & Building',     'Cement and building essentials',           'flyer-cement.jpg'],
  ['timber',     'Timber & Doors',        'Timber, fascia boards and flash doors',    'flyer-timber.jpg'],
  ['plumbing',   'Plumbing',              'PVC, poly and copper pipes and fittings',  'flyer-plumbing.jpg'],
  ['pumps',      'Pumps & Water Tanks',   'Submersible and booster pumps, JoJo tanks','flyer-pumps-tanks.jpg'],
  ['electrical', 'Electrical',            'Boards, breakers, lighting, wire, solar lights', 'flyer-electrical.jpg'],
  ['tiles',      'Tiles',                 'Porcelain, ceramic and wall tiles',        'flyer-tiles.jpg'],
  ['security',   'Locks & Security',      'Yale locksets',                            'flyer-locksets.jpg'],
  ['bathroom',   'Bathroom',              'Geysers, shower sets, cubicles, tubs',     'flyer-bathroom.jpg'],
  ['tools',      'Tools & Safety',        'Gumboots, helmets, gloves, hand tools',    'flyer-hardware-tools.jpg']
];

// [slug, name, category, unit, price USD, stock (null = not tracked), description, image]
const PRODUCTS = [
  ['ibr-04', 'IBR Roofing Sheet 0.4mm', 'roofing', 'per metre', 6.5, null, 'Strong, durable high quality steel IBR sheeting. Corrosion resistant and ideal for roofs and walls. Cut to your length. Colours available on request.', 'flyer-ibr.jpg'],
  ['ibr-03', 'IBR Roofing Sheet 0.3mm', 'roofing', 'per metre', 5, null, 'Lighter gauge IBR sheeting for sheds, walls and budget roofing. Built to last, corrosion resistant. Cut to your length.', 'flyer-ibr.jpg'],
  ['q-tiles', 'Q-Tile Roofing Sheet', 'roofing', 'per metre', 8, null, 'Tile-profile steel roofing with a premium finish. Strong, weather resistant and beautiful on homes.', 'flyer-ibr.jpg'],
  ['corrugated', 'Corrugated Roofing Sheet', 'roofing', 'per metre', 5.5, null, 'Traditional corrugated roofing sheets, rolled on our own machine. All colours available.', 'factory.jpg'],

  ['angle-25', 'Angle Iron 25 x 25mm', 'steel', 'per 6m length', 9, null, 'Strong and durable angle iron for frames, gates, burglar bars and shelving.', 'flyer-angle-irons.jpg'],
  ['angle-40', 'Angle Iron 40 x 40mm', 'steel', 'per 6m length', 17, null, 'Heavy angle iron for structural frames, trusses and fabrication.', 'flyer-angle-irons.jpg'],
  ['angle-50', 'Angle Iron 50 x 50mm', 'steel', 'per 6m length', 26, null, 'Heavy-duty angle iron for roof structures and heavy fabrication.', 'flyer-angle-irons.jpg'],
  ['tube-25', 'Square Tube 25 x 25mm', 'steel', 'per 6m length', 10, null, 'Reliable supply of square tubing for gates, fences, frames and furniture.', ''],
  ['tube-40', 'Square Tube 40 x 40mm', 'steel', 'per 6m length', 19, null, 'Premium quality square tube for structures, carports and security fencing.', ''],
  ['tube-50', 'Square Tube 50 x 50mm', 'steel', 'per 6m length', 28, null, 'Heavy square tube for structural work and large fabrication jobs.', ''],

  ['cement-50', 'SupaSet Cement 42.5N (50kg)', 'cement', 'per 50kg bag', 12, 200, 'Premium quality 42.5N cement. Simba rebasa necement yakanaka. Available now, bulk orders welcome.', 'flyer-cement.jpg'],

  ['timber-50', 'Quality Timber 50 x 50mm', 'timber', 'per length', 6, null, 'Strong, durable timber for construction, roofing, decking and fencing. Various sizes available.', 'flyer-timber.jpg'],
  ['timber-76', 'Quality Timber 76 x 38mm', 'timber', 'per length', 8, null, 'Ready-to-use structural timber, affordable prices, various sizes.', 'flyer-timber.jpg'],
  ['timber-114', 'Quality Timber 114 x 38mm', 'timber', 'per length', 12, null, 'Strong timber for rafters, trusses and decking.', 'flyer-timber.jpg'],
  ['fascia', 'Fascia Board', 'timber', 'per length', 14, null, 'Durable, long-lasting, weather resistant fascia boards. They add the perfect finishing touch to your roof.', 'flyer-fascia.jpg'],
  ['flash-door', 'Flash Door', 'timber', 'each', 38, null, 'Premium quality flash doors: strong, durable, smooth finish. Perfect for homes, offices and projects. Various sizes available.', 'flyer-flash-doors.jpg'],

  ['pvc-pipe', 'PVC Pipes', 'plumbing', 'per 6m length', 11, null, 'Quality PVC pipes, wide range of sizes at affordable prices.', 'flyer-plumbing.jpg'],
  ['poly-pipe', 'Poly Pipes', 'plumbing', 'per roll', 35, null, 'Black poly pipe for water reticulation, irrigation and borehole connections.', ''],
  ['copper-pipe', 'Copper Pipes', 'plumbing', 'per length', 22, null, 'Quality copper pipes for water and gas installations. Top quality, durable and reliable.', 'flyer-copper.jpg'],
  ['copper-fit', 'Copper Fittings (elbows, tees, couplings)', 'plumbing', 'each', 1.5, null, 'Complete range of copper fittings: elbows, tees, reducers, couplings, connectors, adaptors and more.', 'flyer-copper.jpg'],
  ['toilet', 'Toilet Suite', 'plumbing', 'each', 85, null, 'Sanitary ware: complete toilet suites, stylish, durable and reliable.', ''],
  ['bathtub', 'Bathtub', 'plumbing', 'each', 220, null, 'Stylish and durable bathtubs for the modern bathroom.', ''],
  ['sink', 'Stainless Steel Kitchen Sink', 'plumbing', 'each', 65, null, 'Reliable stainless steel kitchen sinks, single and double bowl.', ''],

  ['sub-ac', 'Submersible Pump (AC)', 'pumps', 'each', 160, null, 'Built to perform. AC submersible pump for boreholes and wells.', 'flyer-pumps-tanks.jpg'],
  ['sub-dc', 'Submersible Pump (DC / Solar)', 'pumps', 'each', 230, null, 'DC submersible pump option, ideal for solar water systems.', 'flyer-pumps-tanks.jpg'],
  ['booster', 'Booster Pump', 'pumps', 'each', 120, null, 'Strong water pressure when you need it most.', 'flyer-pumps-tanks.jpg'],
  ['jojo-1000', 'JoJo Tank 1000L', 'pumps', 'each', 130, null, 'Strong, reliable, long-lasting JoJo water storage tank.', 'flyer-pumps-tanks.jpg'],
  ['jojo-2500', 'JoJo Tank 2500L', 'pumps', 'each', 260, null, 'Strong, reliable, long-lasting JoJo water storage tank.', 'flyer-pumps-tanks.jpg'],
  ['jojo-5000', 'JoJo Tank 5000L', 'pumps', 'each', 480, null, 'Strong, reliable, long-lasting JoJo water storage tank.', 'flyer-pumps-tanks.jpg'],

  ['db-box', 'Distribution Board', 'electrical', 'each', 28, null, 'Distribution boxes for homes, shops and sites.', ''],
  ['mcb', 'MCB Circuit Breaker', 'electrical', 'each', 3.5, null, 'Miniature circuit breakers, various ratings.', ''],
  ['contactor', 'Contactor', 'electrical', 'each', 18, null, 'Contactors for pumps and motor control.', ''],
  ['bulb', 'LED Bulb', 'electrical', 'each', 1.5, null, 'Energy saving LED bulbs, bayonet and screw fittings.', ''],
  ['fluoro', 'Fluorescent Light Fitting', 'electrical', 'each', 9, null, 'Fluorescent lights and tubes for homes and workshops.', ''],
  ['flood', 'Solar Flood Light', 'electrical', 'each', 25, null, 'Solar flood lights for security and yard lighting.', ''],
  ['lamp-holder', 'Lamp Holder', 'electrical', 'each', 0.8, null, 'Lamp holders, various types.', ''],
  ['plug-top', 'Plug Top', 'electrical', 'each', 1.2, null, 'Quality plug tops.', ''],
  ['adaptor', 'Multi Adaptor', 'electrical', 'each', 3, null, 'Adaptors and extension sockets.', ''],
  ['chandelier', 'Chandelier', 'electrical', 'each', 75, null, 'Decorative chandeliers and ceiling lights.', ''],
  ['tape', 'Installation Tape', 'electrical', 'each', 0.8, null, 'Insulation tape for electrical installation.', ''],
  ['wire', 'House Wire 2.5mm (100m roll)', 'electrical', 'per roll', 70, null, 'House wire for power circuits, 100 metre roll.', ''],
  ['trunking', 'Trunking', 'electrical', 'per length', 3.5, null, 'PVC trunking for neat cable runs.', ''],

  ['tile-porcelain', 'Porcelain Tiles', 'tiles', 'per m²', 18, null, 'Wide selection of premium quality tiles for every space: durable, stylish, perfect for floors, walls, kitchens and bathrooms.', 'flyer-tiles.jpg'],
  ['tile-ceramic', 'Ceramic Floor Tiles', 'tiles', 'per m²', 11, null, 'Durable ceramic tiles for floors, kitchens and bathrooms. Great prices.', 'flyer-tiles.jpg'],
  ['tile-wall', 'Wall Tiles', 'tiles', 'per m²', 9, null, 'Wall tiles for bathrooms and kitchens, wide choice of designs.', 'flyer-tiles.jpg'],

  ['yale-2', 'Yale 2 Lever Lockset', 'security', 'each', 6, null, 'Easy to use, durable and reliable. Ideal for homes. Essential protection.', 'flyer-locksets.jpg'],
  ['yale-3', 'Yale 3 Lever Lockset', 'security', 'each', 9, null, 'Extra security, strong and durable, perfect for homes. Long lasting performance.', 'flyer-locksets.jpg'],
  ['yale-cyl', 'Yale Cylinder Lockset', 'security', 'each', 14, null, 'High security, premium finish, maximum protection. Perfect for all doors.', 'flyer-locksets.jpg'],

  ['geyser', 'Solar Geyser', 'bathroom', 'each', 420, null, 'Solar geysers: premium quality, lasting comfort.', 'flyer-bathroom.jpg'],
  ['shower-set', 'Shower Set', 'bathroom', 'each', 45, null, 'Shower sets for the complete bathroom.', 'flyer-bathroom.jpg'],
  ['shower-cubicle', 'Shower Cubicle', 'bathroom', 'each', 190, null, 'Shower cubicles: everything you need for your bathroom and beyond.', 'flyer-bathroom.jpg'],

  ['gumboots', 'Gumboots', 'tools', 'per pair', 9, null, 'Quality gumboots, built for you.', 'flyer-hardware-tools.jpg'],
  ['shovel', 'Shovel', 'tools', 'each', 8, null, 'Quality hardware, reliable service. Strong steel shovel.', 'flyer-hardware-tools.jpg'],
  ['helmet', 'Safety Helmet', 'tools', 'each', 4, null, 'Safety helmets for site work.', 'flyer-hardware-tools.jpg'],
  ['pick', 'Pick', 'tools', 'each', 10, null, 'Heavy duty pick with handle.', 'flyer-hardware-tools.jpg'],
  ['pvc-gloves', 'PVC Gloves', 'tools', 'per pair', 2, null, 'PVC work gloves.', 'flyer-hardware-tools.jpg']
];

module.exports = { CATEGORIES, PRODUCTS };
