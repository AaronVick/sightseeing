import axios from 'axios';

export default async function handler(req, res) {
  // Check if the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Log the incoming request to check if the data is correctly passed
  console.log('Request body:', req.body);

  // Extract the city from untrustedData.inputText
  const { untrustedData } = req.body;
  const city = untrustedData?.inputText;

  if (!city || city.trim() === '') {
    console.log('City input is missing in the request.');

    // Return the Vercel OG image with the message "Please Enter a City"
    return res.status(200).json({
      title: 'Error',
      description: 'Please Enter a City',
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/generateImage?text=Please Enter a City`,
      buttons: [
        {
          text: 'Go Back',
          method: 'POST',
          action: 'reload',
        },
      ],
    });
  }

  try {
    // Make the request to the OpenTripMap API to find matching cities
    const response = await axios.get(
      `https://api.opentripmap.com/0.1/en/places/geoname?name=${city}&apikey=${process.env.OPENTRIPMAP_API_KEY}`
    );

    const cities = response.data.features.map((feature) => feature.properties.name).slice(0, 4);

    // Log the matched cities
    console.log('Matched cities:', cities);

    // Format Farcaster frame meta tags properly for matched cities
    res.status(200).json({
      title: `Matching Cities for ${city}`,
      description: 'Select a city to explore its attractions',
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/generateImage?text=cities`,
      buttons: cities.map((cityName, index) => ({
        text: `City ${index + 1}: ${cityName}`,
        method: 'POST',
        action: 'navigate',
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/seeAttractions?city=${cityName}`,
      })),
    });
  } catch (error) {
    console.error('Error fetching cities:', error.response ? error.response.data : error.message);
    res.status(500).json({
      title: 'Error',
      description: 'Failed to match cities. Please try again.',
      image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/generateImage?text=Error Fetching Cities`,
      buttons: [
        {
          text: 'Retry',
          method: 'POST',
          action: 'reload',
        },
      ],
    });
  }
}
