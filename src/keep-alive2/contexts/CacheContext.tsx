// src/contexts/CacheContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

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