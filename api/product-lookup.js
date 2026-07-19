// Barcode → product lookup for scan-to-add.
// Scans a UPC/EAN and returns product info to prefill a new item.
// Uses UPCitemdb's free trial endpoint (no key; ~100 lookups/day). Free — does
// NOT consume the app's AI credits (that's the whole point of scanning).

const CATEGORIES = [
  'Electronics', 'Tools', 'Sports & Outdoors', 'Camping & Hiking', 'Kitchen',
  'Garden & Yard', 'Games & Toys', 'Books & Media', 'Musical Instruments',
  'Photography', 'Automotive', 'Home Improvement', 'Party & Events',
  'Baby & Kids', 'Fitness', 'Crafts & Hobbies', 'Clothing & Accessories',
  'Furniture', 'Seasonal', 'Other',
];

function mapCategory(raw) {
  const s = String(raw || '').toLowerCase();
  const rules = [
    ['electronic', 'Electronics'], ['computer', 'Electronics'], ['phone', 'Electronics'],
    ['camera', 'Photography'], ['photo', 'Photography'],
    ['tool', 'Tools'], ['hardware', 'Home Improvement'], ['home improvement', 'Home Improvement'],
    ['sport', 'Sports & Outdoors'], ['outdoor', 'Sports & Outdoors'],
    ['camp', 'Camping & Hiking'], ['hik', 'Camping & Hiking'],
    ['kitchen', 'Kitchen'], ['cook', 'Kitchen'], ['appliance', 'Kitchen'],
    ['garden', 'Garden & Yard'], ['lawn', 'Garden & Yard'], ['yard', 'Garden & Yard'],
    ['toy', 'Games & Toys'], ['game', 'Games & Toys'], ['puzzle', 'Games & Toys'],
    ['book', 'Books & Media'], ['media', 'Books & Media'], ['dvd', 'Books & Media'],
    ['music', 'Musical Instruments'], ['instrument', 'Musical Instruments'], ['guitar', 'Musical Instruments'],
    ['auto', 'Automotive'], ['vehicle', 'Automotive'], ['car ', 'Automotive'],
    ['baby', 'Baby & Kids'], ['kid', 'Baby & Kids'], ['child', 'Baby & Kids'],
    ['fitness', 'Fitness'], ['exercise', 'Fitness'], ['gym', 'Fitness'],
    ['craft', 'Crafts & Hobbies'], ['hobby', 'Crafts & Hobbies'],
    ['cloth', 'Clothing & Accessories'], ['apparel', 'Clothing & Accessories'], ['shoe', 'Clothing & Accessories'],
    ['furnitur', 'Furniture'], ['party', 'Party & Events'], ['seasonal', 'Seasonal'], ['holiday', 'Seasonal'],
  ];
  for (const [k, v] of rules) if (s.includes(k)) return v;
  return '';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const upc = (req.query && req.query.upc) || '';
  const clean = String(upc).replace(/[^0-9]/g, '');
  if (!clean) return res.status(400).json({ error: 'need a upc' });
  const empty = { upc: clean, title: '', brand: '', category: '', description: '', image: '' };
  try {
    const r = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${clean}`);
    if (!r.ok) return res.status(200).json(empty);
    const j = await r.json();
    const it = (j.items || [])[0];
    if (!it || !it.title) return res.status(200).json(empty);
    return res.status(200).json({
      upc: clean,
      title: it.title,
      brand: it.brand || '',
      category: mapCategory(it.category),
      description: String(it.description || '').slice(0, 300),
      image: (Array.isArray(it.images) && it.images[0]) || '',
    });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
