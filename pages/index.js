import Head from 'next/head';
import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [city, setCity] = useState('');
  const [attractions, setAttractions] = useState([]);

  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  const handleAttractionsClick = async () => {
    try {
      const response = await axios.post('/api/opentrip', { city });
      setAttractions(response.data);
    } catch (error) {
      console.error('Error fetching attractions:', error);
    }
  };

  return (
    <>
      <Head>
        <title>City Explorer</title>
        {/* Frame metadata for Farcaster */}
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="/travel.png" />
        
        {/* Button 1: "See Attractions" */}
        <meta property="fc:frame:button:1" content="See Attractions" />
        <meta property="fc:frame:button:1:method" content="POST" />
        
        {/* Button 2: "Share" */}
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta 
          property="fc:frame:button:2:target" 
          content={`https://warpcast.com/~/compose?text=Check+out+these+attractions+in+${city}!%0A%0AFrame+by+%40aaronv%26%0A%0AExplore+more+at+https://sightseeing-seven.vercel.app/`} 
        />
      </Head>
      
      <main>
        <h1>Explore {city || "Your City"}</h1>
        <img src="/travel.png" alt="Travel" width={500} height={300} />
        <p>Type in a city to see its top attractions:</p>
        <input 
          type="text" 
          value={city} 
          onChange={handleCityChange} 
          placeholder="Enter city name" 
        />
        <button onClick={handleAttractionsClick}>See Attractions</button>
        <button 
          onClick={() => window.location.href = `https://warpcast.com/~/compose?text=Check+out+these+attractions+in+${city}!%0A%0AFrame+by+%40aaronv%26%0A%0AExplore+more+at+https://sightseeing-seven.vercel.app/`}
        >
          Share
        </button>

        {/* Display fetched attractions */}
        {attractions.length > 0 && (
          <ul>
            {attractions.map((attraction) => (
              <li key={attraction.id}>{attraction.name}</li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
