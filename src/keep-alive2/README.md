
以下是整合了缓存控制、内存优化和正确参数处理的完整代码方案：

```tsx
// src/contexts/CacheContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import isEqual from 'lodash/isEqual';

type CacheItem = {
  key: string;
  element: React.ReactElement;
  timestamp: number;
  ttl: number;
  lastUsed: number;
};

type CacheState = Record<string, CacheItem>;

type CacheAction =
  | { type: 'CACHE_PAGE'; payload: CacheItem }
  | { type: 'REMOVE_PAGE'; payload: { key: string } }
  | { type: 'CLEAN_EXPIRED' }
  | { type: 'TRIM_CACHE'; payload?: { limit: number } }
  | { type: 'UPDATE_LAST_USED'; payload: { key: string } };

const CACHE_CONFIG = {
  maxItems: 30,
  trimThreshold: 40,
  keepAliveRatio: 0.7
};

const CacheContext = createContext<{
  state: CacheState;
  dispatch: React.Dispatch<CacheAction>;
}>({ state: {}, dispatch: () => {} });

const cacheReducer = (state: CacheState, action: CacheAction): CacheState => {
  switch (action.type) {
    case 'CACHE_PAGE': {
      const newState = { 
        ...state,
        [action.payload.key]: {
          ...action.payload,
          lastUsed: Date.now()
        }
      };
    
      if (Object.keys(newState).length > CACHE_CONFIG.trimThreshold) {
        const entries = Object.entries(newState).sort((a, b) => 
          b[1].lastUsed - a[1].lastUsed
        );
        return Object.fromEntries(
          entries.slice(0, Math.floor(CACHE_CONFIG.maxItems * CACHE_CONFIG.keepAliveRatio))
        );
      }
      return newState;
    }

    case 'REMOVE_PAGE': {
      const newState = { ...state };
      delete newState[action.payload.key];
      return newState;
    }

    case 'CLEAN_EXPIRED': {
      const now = Date.now();
      return Object.fromEntries(
        Object.entries(state).filter(([_, item]) => 
          now - item.timestamp <= item.ttl
        )
      );
    }

    case 'TRIM_CACHE': {
      const limit = action.payload?.limit || CACHE_CONFIG.maxItems;
      return Object.fromEntries(
        Object.entries(state)
          .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
          .slice(0, limit)
      );
    }

    case 'UPDATE_LAST_USED': {
      const item = state[action.payload.key];
      return item ? { 
        ...state, 
        [action.payload.key]: { ...item, lastUsed: Date.now() } 
      } : state;
    }

    default:
      return state;
  }
};

export const CacheProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(cacheReducer, {});

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'CLEAN_EXPIRED' });
      dispatch({ type: 'TRIM_CACHE' });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <CacheContext.Provider value={{ state, dispatch }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => useContext(CacheContext);
```

```tsx
// src/components/CacheRoute.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { Route, RouteProps, useHistory, useRouteMatch } from 'react-router-dom';
import { useCache } from '../contexts/CacheContext';
import isEqual from 'lodash/isEqual';

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
```

### 主要优化说明：

1. **参数化缓存控制**：

   ```tsx
   <CacheRoute
     path="/admin"
     component={AdminPanel}
     noCache={false} // 禁用缓存
   />

   <CacheRoute
     path="/dashboard"
     component={Dashboard}
     noCache={true} // 启用缓存（默认值）
   />
   ```
2. **内存泄漏防护**：

   - 自动清理过期缓存（每分钟）
   - 全局缓存数量限制（默认30条）
   - 页面级缓存限制（通过cacheLimit属性）

   ```tsx
   <CacheRoute
     path="/product/:id"
     cacheKey="product"
     cacheLimit={20} // 最多缓存20个商品
   />
   ```
3. **性能优化**：

   - 防抖处理缓存更新（50ms延迟）
   - 参数签名生成优化（避免不必要更新）
   - 使用memoization技术稳定缓存键
4. **稳定化处理**：

   ```tsx
   // 使用排序和URI编码生成稳定参数签名
   const paramsSignature = useMemo(() => {
     // ...
   }, [match?.params]);
   ```

### 使用示例：

```tsx
// 需要缓存的动态页面
<CacheRoute
  path="/user/:id"
  cacheKey="user-profile"
  component={UserProfile}
  ttl={15 * 60 * 1000} // 15分钟缓存
  cacheLimit={30}       // 最多缓存30个用户
/>

// 不需要缓存的敏感页面
<CacheRoute
  path="/payment"
  component={PaymentPage}
  noCache={false}       // 完全禁用缓存
/>

// 实时数据页面（短期缓存）
<CacheRoute
  path="/realtime"
  cacheKey="realtime-data"
  component={RealtimeView}
  ttl={5 * 1000}        // 5秒缓存
/>
```

### 注意事项：

1. **属性命名建议**：
   建议将 `noCache`重命名为更直观的 `cacheEnabled`：

   ```tsx
   interface CacheRouteProps extends RouteProps {
     cacheEnabled?: boolean; // true=启用，false=禁用
   }
   ```
2. **内存监控**：
   可在CacheProvider中添加内存监控：

   ```tsx
   useEffect(() => {
     const checkMemory = () => {
       if (window.performance?.memory) {
         const { usedJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
         if (usedJSHeapSize > jsHeapSizeLimit * 0.7) {
           dispatch({ type: 'TRIM_CACHE', payload: { limit: 15 } });
         }
       }
     };
     const timer = setInterval(checkMemory, 5000);
     return () => clearInterval(timer);
   }, [dispatch]);
   ```
3. **动态参数处理**：
   确保路由路径配置正确：

   ```tsx
   // ✅ 正确写法
   path="/product/:id"

   // ❌ 错误写法（缺少斜杠）
   path="/product:id"
   ```

该方案通过多层级缓存控制和内存优化机制，既能满足不同页面的缓存需求，又能确保内存使用安全，同时保持代码的可维护性和扩展性。
