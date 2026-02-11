// CountrySelect.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";

// const API_BASE_URL = 'https://capstone-2t76ybystq-uc.a.run.app';
const API_BASE_URL = 'http://127.0.0.1:5001';

function CountrySelect({ onUpdate }) {
  const [selectedCountry, setSelectedCountry] = useState('');
  const navigate = useNavigate();

  // const countries = [
  //   { name: "Kenya", disabled: false },
  //   { name: "Uganda", disabled: false },
  // ];

  useEffect(() => {
    console.log('selectedCountry:', selectedCountry.toLowerCase());
  }
  , [selectedCountry]);

  const handleStart = () => {
    fetch(`${API_BASE_URL}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ country: selectedCountry })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      console.log('Success:', data);
      if (onUpdate) {
        onUpdate(data);  // This can be used to update parent component's state or trigger further actions
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
    navigate('/Dashboard');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }} className="font-serif items-center">
      <h1  className="text-2xl pb-8">Choose the country to monitor</h1>

      <div>
        <select 
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value.toLowerCase())}
          style={{ width: '200px', marginBottom: '20px' }}
          className='dropdown-right border-solid border-black border rounded py-2 px-2'
        >
          <option value="" disabled>Select</option>
          <option value="kenya">Kenya</option>
          <option value="uganda">Uganda</option>
          {/* <option value="ghana">Ghana</option> */}

          {/* {countries.map((country, index) => (
            <option key={index} value={country.name} disabled={country.disabled}>
              {country.name}
            </option>
          ))} */}
        </select>
      </div>
      
      <button onClick={handleStart} style={{ width: '100px' }} disabled={!selectedCountry || selectedCountry === "Select"}  className='btn'>Start</button>
    </div>
  );
}

// onClick={handleStart}

export default CountrySelect;

