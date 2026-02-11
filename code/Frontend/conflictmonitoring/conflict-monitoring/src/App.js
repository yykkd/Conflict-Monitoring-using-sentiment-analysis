// App.js
import React, { useState } from 'react';
import CountrySelect from './Components/CountrySelect';
import Dashboard from './Components/Dashboard';
import Login from './Components/Login';
import SignUp from './Components/SignUp';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './Components/Authentication';
import PrivateRoute from './Components/PrivateRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login/>}/>
            <Route path="/SignUp" element={<SignUp/>}/>
            <Route path="/Login" element={<Login/>}/>
            {/* <Route path="/Dashboard" element={<Dashboard/>}/>
            <Route path="/CountrySelect" element={<CountrySelect/>}/> */}
            <Route path="/Dashboard" element={<PrivateRoute element={Dashboard} />} />
            <Route path="/CountrySelect" element={<PrivateRoute element={CountrySelect} />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

