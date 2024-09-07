import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { city, page } = req.body;
  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    // Fetch city coordinates using the OpenTripMap API
    const geoResponse = await axios.get(`https://api.opentripmap.com/0.1/en/places/geoname?name=${city}&apikey=${process.env.OPENTRIPMAP_API_KEY}`);
    const { lat, lon } = geoResponse.data;

    // Fetch attractions within a 5km radius with pagination
    const attractionsResponse = await axios.get(`https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=10&offset=${(page - 1) * 10}&apikey=${process.env.OPENTRIPMAP_API_KEY}`);
    
    // Format the response into a simplified object array for use in the frame
    const attractions = attractionsResponse.data.features.map((feature) => ({
      id: feature.id,
      name: feature.properties.name || 'Unknown Name',
      description: feature.properties.description || 'No description available',
      image: feature.properties.image // If available, otherwise fallback
    }));

    // Return the attractions list
    return res.status(200).json(attractions);
  } catch (error) {
    console.error('Error fetching attractions:', error);
    return res.status(500).json({ error: 'Failed to fetch attractions' });
  }
}
