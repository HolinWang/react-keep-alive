// src/components/CacheRoute.tsx
import React, { useEffect } from 'react';
import { Route, RouteProps, useLocation, useHistory, useRouteMatch } from 'react-router-dom';
import { useCache } from '../contexts/CacheContext';

interface CacheRouteProps extends RouteProps {
  cacheKey: string;
  ttl?: number;
}

const CacheRoute: React.FC<CacheRouteProps> = ({
  cacheKey,
  ttl = 30 * 60 * 1000,
  component: Component,
  ...rest
}) => {
  const { state, dispatch } = useCache();
  const location = useLocation();
  const history = useHistory();
  const match = useRouteMatch();
  const isActive = location.pathname === rest.path;

  useEffect(() => {
    if (isActive && Component) {
      dispatch({
        type: 'CACHE_PAGE',
        payload: {
          key: cacheKey,
          element: <Component 
            history={history}
            location={location}
            match={match}
          />,
          timestamp: Date.now(),
          ttl,
        },
      });
    }
  }, [isActive, cacheKey, ttl, Component, dispatch]);

  return (
    <Route
      {...rest}
      children={() => (
        <div style={{ display: isActive ? 'block' : 'none' }}>
          {state[cacheKey]?.element}
        </div>
      )}
    />
  );
};

export default CacheRoute;