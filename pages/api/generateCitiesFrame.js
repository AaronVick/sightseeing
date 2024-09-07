import matchCity from './matchCity';
import generateImage from './generateImage';
import seeAttractions from './seeAttractions';

const generateCitiesFrame = (city) => {
  const matchedCity = matchCity(city);

  if (!matchedCity) {
    // If the city is not found, display error
    document.body.innerHTML = `
      <div style="text-align: center; margin-top: 50px;">
        <img src="${generateImage('error')}" alt="error" style="width: 300px;" />
        <h3>City not found. Please try again.</h3>
        <button onclick="window.location.reload()" style="padding: 10px 20px;">Go Back</button>
      </div>
    `;
    return;
  }

  // If the city is matched, show options to view attractions
  document.body.innerHTML = `
    <div style="text-align: center; margin-top: 50px;">
      <img src="${generateImage('cities')}" alt="cities" style="width: 300px;" />
      <h3>Select an attraction to explore in ${matchedCity.name}:</h3>
      <button onclick="seeAttractions('${matchedCity.name}', 1)" style="padding: 10px 20px; margin-right: 10px;">1</button>
      <button onclick="seeAttractions('${matchedCity.name}', 2)" style="padding: 10px 20px; margin-right: 10px;">2</button>
      <button onclick="seeAttractions('${matchedCity.name}', 3)" style="padding: 10px 20px; margin-right: 10px;">3</button>
      <button onclick="seeAttractions('${matchedCity.name}', 4)" style="padding: 10px 20px;">4</button>
    </div>
  `;
};

export default generateCitiesFrame;
