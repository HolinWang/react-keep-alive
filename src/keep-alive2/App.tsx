// src/App.tsx
import React from 'react';
import { CacheProvider } from './contexts/CacheContext';
import { BrowserRouter } from 'react-router-dom';
import TabNav from './components/TabNav';
import routes from './routes';
import CacheRoute from './components/CacheRoute';

const App: React.FC = () => {
  return (
    <CacheProvider>
      <BrowserRouter>
        <TabNav />
        {routes.map(route => (
          <CacheRoute
            key={route.cacheKey}
            path={route.path}
            exact={route.exact}
            cacheKey={route.cacheKey}
            ttl={route.ttl}
            component={route.component}
            noCache={true}
          />
        ))}
      </BrowserRouter>
    </CacheProvider>
  );
};

export default App;