import Head from 'next/head';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [city, setCity] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [page, setPage] = useState(1); // Page state for pagination
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Farcaster frame initialized');
  }, []);

  const handleCityChange = (e) => {
    console.log(`City input changed to: ${e.target.value}`);
    setCity(e.target.value);
  };

  const fetchAttractions = async () => {
    setLoading(true);
    console.log(`Fetching attractions for ${city} on page ${page}`);
    try {
      const response = await axios.post('/api/opentrip', { city, page });
      console.log('Attractions fetched:', response.data);
      setAttractions(response.data);
    } catch (error) {
      console.error('Error fetching attractions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttractionsClick = () => {
    setPage(1); // Reset to first page when fetching a new city
    fetchAttractions();
  };

  const handleNext = () => {
    setPage(prevPage => prevPage + 1);
    fetchAttractions(); // Re-fetch data for the new page
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage(prevPage => prevPage - 1);
      fetchAttractions(); // Re-fetch data for the previous page
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
        <meta property="fc:frame:post_url" content="/api/opentrip" />
        
        {/* Button 2: "Share" */}
        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta 
          property="fc:frame:button:2:target" 
          content={`https://warpcast.com/~/compose?text=Check+out+these+attractions+in+${city}!%0A%0AExplore+more+at+https://sightseeing-seven.vercel.app`}
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
          onClick={() => window.location.href = `https://warpcast.com/~/compose?text=Check+out+these+attractions+in+${city}!%0A%0AExplore+more+at+https://sightseeing-seven.vercel.app`}
        >
          Share
        </button>

        <button onClick={() => window.location.href = '/'}>
          Home
        </button>

        {/* Pagination Controls */}
        <div>
          <button onClick={handlePrevious} disabled={page <= 1}>Previous</button>
          <button onClick={handleNext}>Next</button>
        </div>

        {/* Display fetched attractions */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul>
            {attractions.map((attraction) => (
              <li key={attraction.id}>
                <h3>{attraction.name}</h3>
                <p>{attraction.description}</p>
                <img src={attraction.image || '/travel.png'} alt={attraction.name} width={200} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
