import Head from 'next/head';
import { useState } from 'react';
import generateCitiesFrame from './generateCitiesFrame';
import generateImage from './generateImage';

export default function Home() {
  const [city, setCity] = useState('');

  const handleLookup = () => {
    if (!city) {
      alert('Please enter a city!');
      return;
    }
    generateCitiesFrame(city);
  };

  const handleShare = () => {
    alert(`City shared: ${city}`);
    // Additional share logic can be added here
  };

  return (
    <>
      <Head>
        <title>Travel App - Explore Cities</title>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="/travel.png" />
        <meta property="fc:frame:button:1" content="Lookup City" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:post_url:1" content="/api/matchCity" />

        <meta property="fc:frame:button:2" content="Share" />
        <meta property="fc:frame:button:2:action" content="link" />
        <meta property="fc:frame:button:2:target" content="https://warpcast.com/~/compose?text=Exploring+city+via+Farcaster!" />
      </Head>

      <main style={{ textAlign: 'center', marginTop: '50px' }}>
        <img src={generateImage('default')} alt="default static" style={{ width: '300px' }} />
        <div>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city"
            style={{ padding: '10px', margin: '20px', fontSize: '16px' }}
          />
        </div>
        <div>
          <button onClick={handleLookup} style={{ padding: '10px 20px', marginRight: '10px' }}>Lookup City</button>
          <button onClick={handleShare} style={{ padding: '10px 20px' }}>Share</button>
        </div>
      </main>
    </>
  );
}
