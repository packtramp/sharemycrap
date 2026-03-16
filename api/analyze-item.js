// npm install @anthropic-ai/sdk --legacy-peer-deps
const Anthropic = require('@anthropic-ai/sdk');

const CATEGORIES = [
  'Electronics', 'Tools', 'Sports & Outdoors', 'Camping & Hiking', 'Kitchen',
  'Garden & Yard', 'Games & Toys', 'Books & Media', 'Musical Instruments',
  'Photography', 'Automotive', 'Home Improvement', 'Party & Events',
  'Baby & Kids', 'Fitness', 'Crafts & Hobbies', 'Clothing & Accessories',
  'Furniture', 'Seasonal', 'Other',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Well-Loved'];

const SYSTEM_PROMPT = `You identify items for a community lending app. Return ONLY valid JSON with these fields:
- title: specific make/model if identifiable, otherwise descriptive name
- description: 1-2 sentences about the item, features, typical use
- category: one of [${CATEGORIES.join(', ')}]
- condition: one of [${CONDITIONS.join(', ')}] (guess from photo or default "Good" for text)
- estimatedValue: number in USD (retail estimate)
- careInstructions: brief care/handling tips for a borrower
- searchTerms: array of 2-3 search terms for finding stock photos

No markdown fences, no explanation — just the JSON object.`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const { mode, image, description } = req.body;

  if (!mode || (mode === 'photo' && !image) || (mode === 'text' && !description)) {
    return res.status(400).json({ error: 'Missing required fields. Need mode + image (photo) or description (text).' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const messages = [];

    if (mode === 'photo') {
      // Detect media type from base64 header or default to jpeg
      let mediaType = 'image/jpeg';
      if (image.startsWith('/9j/')) mediaType = 'image/jpeg';
      else if (image.startsWith('iVBOR')) mediaType = 'image/png';
      else if (image.startsWith('R0lGOD')) mediaType = 'image/gif';
      else if (image.startsWith('UklGR')) mediaType = 'image/webp';

      messages.push({
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
          { type: 'text', text: 'Identify this item and return the JSON.' },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: `Item description: "${description}"\n\nIdentify this item, fill in details, and return the JSON.`,
      });
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text = response.content[0].text.trim();
    // Parse — strip markdown fences if model snuck them in
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    const data = JSON.parse(cleaned);

    // Validate required fields exist
    if (!data.title || !data.description || !data.category) {
      return res.status(500).json({ error: 'AI returned incomplete data. Try again.' });
    }

    // Clamp category and condition to valid values
    if (!CATEGORIES.includes(data.category)) data.category = 'Other';
    if (!CONDITIONS.includes(data.condition)) data.condition = 'Good';

    return res.status(200).json(data);
  } catch (err) {
    console.error('Analyze item error:', err);
    if (err.status === 400) {
      return res.status(400).json({ error: 'Invalid image or request. Try a different photo.' });
    }
    return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
  }
};
