import { ReactElement } from 'react';
import * as cacheTypes from './cache-types';

// 定义缓存项的接口
interface CacheItem {
  cacheId: string;
  reactElement: ReactElement;
  doms?: HTMLElement[];
  status: string;
  scrolls: Record<string, number>;
}

// 定义缓存状态的类型
type CacheStates = Record<string, CacheItem>;

// 定义 action 的接口
interface CacheAction {
  type: string;
  payload: {
    cacheId: string;
    reactElement?: ReactElement;
    doms?: HTMLElement[];
  };
}

/**
 * 缓存状态的 reducer 函数
 * @param cacheStates - 当前缓存状态
 * @param action - 改变状态的动作
 */
function CacheReducer(cacheStates: CacheStates = {}, action: CacheAction): CacheStates {
  const { payload } = action;
  const { cacheId } = payload;

  switch (action.type) {
    case cacheTypes.CREATE:
      return {
        ...cacheStates,
        [cacheId]: {
          cacheId, // 缓存ID
          reactElement: payload.reactElement!, // 要渲染的虚拟DOM
          doms: undefined, // 此虚拟DOM对应的真实DOM
          status: cacheTypes.CREATE, // 缓存的状态是创建
          scrolls: {} // 滚动信息保存对象，默认为是key滚动的DOM 值是滚动的位置
        }
      };

    case cacheTypes.CREATED:
      return {
        ...cacheStates,
        [cacheId]: {
          ...cacheStates[cacheId],
          doms: payload.doms, // 真实DOM
          status: cacheTypes.CREATED // 缓存的状态是创建成功
        }
      };

    case cacheTypes.DESTROY:
      return {
        ...cacheStates,
        [cacheId]: {
          ...cacheStates[cacheId],
          status: cacheTypes.DESTROY // 缓存的状态是销毁
        }
      };

    default:
      return cacheStates;
  }
}

export default CacheReducer;