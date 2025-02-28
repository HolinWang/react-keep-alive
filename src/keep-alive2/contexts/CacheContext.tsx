// src/contexts/CacheContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

interface CacheItem {
  key: string;
  element: React.ReactElement;
  timestamp: number;
  ttl: number;
}

interface CacheState {
  [key: string]: CacheItem;
}

type CacheAction =
  | { type: 'CACHE_PAGE'; payload: CacheItem }
  | { type: 'REMOVE_PAGE'; payload: { key: string } }
  | { type: 'CLEAN_EXPIRED' };

const CacheContext = createContext<{
  state: CacheState;
  dispatch: React.Dispatch<CacheAction>;
}>({ state: {}, dispatch: () => {} });

const cacheReducer = (state: CacheState, action: CacheAction): CacheState => {
  switch (action.type) {
    case 'CACHE_PAGE':
      return { ...state, [action.payload.key]: action.payload };
    case 'REMOVE_PAGE':
      const newState = { ...state };
      delete newState[action.payload.key];
      return newState;
    case 'CLEAN_EXPIRED':
      const cleanedState = { ...state };
      const now = Date.now();
      Object.keys(cleanedState).forEach(key => {
        if (now - cleanedState[key].timestamp > cleanedState[key].ttl) {
          delete cleanedState[key];
        }
      });
      return cleanedState;
    default:
      return state;
  }
};

export const CacheProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(cacheReducer, {});

  useEffect(() => {
    const timer = setInterval(() => {
      dispatch({ type: 'CLEAN_EXPIRED' });
    }, 60000); // 每分钟清理一次过期缓存
    return () => clearInterval(timer);
  }, []);

  return (
    <CacheContext.Provider value={{ state, dispatch }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => useContext(CacheContext);