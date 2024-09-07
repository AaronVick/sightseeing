import axios from 'axios';

export default async function handler(req, res) {
  const { city, page = 1 } = req.body;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://sightseeing-seven.vercel.app';

  if (!city) {
    return res.status(400).json({ error: 'City name is required' });
  }

  try {
    const geoResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );
    const { lat, lon } = geoResponse.data;

    const attractionsResponse = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/radius?radius=5000&lon=${lon}&lat=${lat}&limit=10&offset=${(page - 1) * 10}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const attractions = attractionsResponse.data.features.map((feature) => ({
      id: feature.id,
      name: feature.properties.name || 'Unknown Name',
      description: feature.properties.description || 'No description available',
      image: feature.properties.image || `${baseUrl}/default-image.png`,
    }));

    res.status(200).json({
      fc_frame: {
        title: `Attractions in ${city}`,
        description: `Explore these attractions in ${city}`,
        image: `${baseUrl}/travel.png`,
        items: attractions.map((attraction) => ({
          title: attraction.name,
          description: attraction.description,
          image: attraction.image,
        })),
        buttons: [
          {
            text: 'Previous',
            method: 'POST',
            action: 'navigate',
            url: `${baseUrl}/api/seeAttractions?city=${city}&page=${page - 1}`,
            disabled: page === 1,
          },
          {
            text: 'Next',
            method: 'POST',
            action: 'navigate',
            url: `${baseUrl}/api/seeAttractions?city=${city}&page=${page + 1}`,
          },
          {
            text: 'Share',
            action: 'embed',
            target: `https://warpcast.com/~/compose?text=Explore+attractions+in+${city}!`,
          },
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({
      fc_frame: {
        title: 'Error',
        description: 'Failed to load attractions. Please try again.',
        image: `${baseUrl}/error.png`,
        buttons: [
          {
            text: 'Try Again',
            action: 'reload',
          },
        ],
      },
    });
  }
}
