// src/routes/index.tsx
import { RouteConfig } from 'react-router-config';
import Home from '../pages/Home';
import About from '../pages/About';
import Dashboard from '../pages/Dashboard';

interface CacheRouteConfig extends RouteConfig {
  cacheKey: string;
  ttl?: number;
}

const routes: CacheRouteConfig[] = [
  {
    path: '/home',
    component: Home,
    exact: true,
    cacheKey: 'home',
    ttl: 15 * 60 * 1000, // 15分钟缓存
  },
  {
    path: '/about',
    component: About,
    exact: true,
    cacheKey: 'about',
    ttl: 30 * 60 * 1000, // 30分钟缓存
  },
  {
    path: '/dashboard',
    component: Dashboard,
    exact: true,
    cacheKey: 'dashboard',
  },
];

export default routes;