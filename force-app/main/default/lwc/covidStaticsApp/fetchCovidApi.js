const ROOT_URL = 'https://api.covid19api.com';

const fetchCovidApi = (startDate, endDate) => {
  const TYPE_URL = 'country';
  const COUNTRY_URL = 'peru';
  const FROM_URL = startDate;
  const TO_URL = endDate;
  console.log(`${FROM_URL} - ${TO_URL}`);
  const API_URL = `${ROOT_URL}/${TYPE_URL}/${COUNTRY_URL}?from=${FROM_URL}&to=${TO_URL}`;
  console.log(`${API_URL}`);
  return fetch(API_URL, {
                method: 'GET'
        })
        .then(response =>
          response.json()
        );
}

export default fetchCovidApi;