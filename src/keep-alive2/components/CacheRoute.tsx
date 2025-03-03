// src/components/CacheRoute.tsx
import React, { useEffect, useMemo } from 'react';
import { Route, RouteProps, useHistory, useRouteMatch } from 'react-router-dom';
import { useCache } from '../contexts/CacheContext';

interface CacheRouteProps extends RouteProps {
  cacheKey: string;
  ttl?: number;
  noCache?: boolean; // true=启用缓存，false=禁用缓存
  cacheLimit?: number;
}

const CacheRoute: React.FC<CacheRouteProps> = ({
  cacheKey,
  ttl = 30 * 60 * 1000,
  component: Component,
  noCache = true, // 默认启用缓存
  cacheLimit,
  ...rest
}) => {
  const { state, dispatch } = useCache();
  const history = useHistory();
  const match = useRouteMatch({
    path: rest.path,
    exact: rest.exact,
    strict: rest.strict
  });

  // 生成稳定的缓存键
  const paramsSignature = useMemo(() => {
    if (!match?.params) return '';
    return Object.keys(match.params)
      .sort()
      // @ts-ignore
      .map(k => `${k}=${encodeURIComponent(match.params[k])}`)
      .join('&');
  }, [match?.params]);

  const enhancedKey = useMemo(() => 
    paramsSignature ? `${cacheKey}?${paramsSignature}` : cacheKey
  , [cacheKey, paramsSignature]);

  // 缓存清理逻辑（当noCache=false时）
  useEffect(() => {
    if (!noCache && enhancedKey && state[enhancedKey]) {
      dispatch({ type: 'REMOVE_PAGE', payload: { key: enhancedKey } });
    }
  }, [noCache, enhancedKey]);

  // 缓存更新逻辑
  useEffect(() => {
    if (!noCache || !Component || !match) return;

    const updateCache = () => {
      const existing = state[enhancedKey];
      
      // 执行缓存数量限制
      if (cacheLimit) {
        const relatedKeys = Object.keys(state).filter(k => k.startsWith(cacheKey));
        if (relatedKeys.length >= cacheLimit) {
          relatedKeys
            .sort((a, b) => state[b].lastUsed - state[a].lastUsed)
            .slice(cacheLimit)
            .forEach(k => dispatch({ type: 'REMOVE_PAGE', payload: { key: k } }));
        }
      }

      if (!existing) {
        dispatch({
          type: 'CACHE_PAGE',
          payload: {
            key: enhancedKey,
            element: (
              <Component
                history={history}
                location={{ ...history.location, pathname: match.url }}
                match={match}
              />
            ),
            timestamp: Date.now(),
            ttl,
            lastUsed: Date.now()
          }
        });
      } else if (existing.lastUsed < Date.now() - 1000) {
        dispatch({ type: 'UPDATE_LAST_USED', payload: { key: enhancedKey } });
      }
    };

    const timer = setTimeout(updateCache, 50);
    return () => clearTimeout(timer);
  }, [enhancedKey, state[enhancedKey], noCache, Component, match?.url]);

  return noCache ? (
    <Route
      {...rest}
      children={() => (
        <div style={{ display: !!match ? 'block' : 'none' }}>
          {state[enhancedKey]?.element}
        </div>
      )}
    />
  ) : (
    <Route {...rest} component={Component} />
  );
};

export default CacheRoute;