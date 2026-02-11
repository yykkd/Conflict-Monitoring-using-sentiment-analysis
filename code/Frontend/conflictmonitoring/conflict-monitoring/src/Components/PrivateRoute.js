import React from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './Authentication';

const PrivateRoute = ({ element: Component, ...rest }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? <Component {...rest} /> : <Navigate to="/Login" state={{ from: location }} />;
};

export default PrivateRoute;




