/**
 * 1. 通过 Context 提供全局的缓存状态管理
使用 reducer 处理缓存的创建、更新和销毁
3. 支持 DOM 节点的缓存和恢复
维护组件的滚动位置
提供了组件生命周期的管理机制
 */

import React, { useReducer, useCallback, ReactNode, ReactElement } from "react";
import CacheReducer from './CacheReducer';
import CacheContext from './CacheContext';
import * as cacheTypes from './cache-types';

interface KeepAliveProviderProps {
  children: ReactNode;
}

// CacheState 定义了每个缓存项的结构
interface CacheState {
  cacheId: string;      // 缓存项的唯一标识
  reactElement: ReactElement;  // 要渲染的 React 元素
  doms?: HTMLElement[];    // 缓存的 DOM 节点数组
  status: string;          // 缓存项的状态（CREATE/CREATED/DESTROY）
  scrolls: Record<string, number>;  // 记录滚动位置的映射表
}

// CacheStates 是整个缓存状态的类型，使用 Record 类型来表示
// key 是 cacheId，value 是对应的 CacheState
type CacheStates = Record<string, CacheState>;

function KeepAliveProvider({ children }: KeepAliveProviderProps) {
  // useReducer 的类型推断已经足够，不需要显式指定泛型参数
  // CacheReducer 的类型定义应该在 reducer 文件中完成
    // 使用 reducer 管理缓存状态，初始值为空对象
  const [cacheStates, dispatch] = useReducer(CacheReducer, {});

  const mount = useCallback(({ cacheId, reactElement }: { cacheId: string; reactElement: ReactElement }) => {
    if (cacheStates[cacheId]) {
      // 如果该组件已经被缓存
      const cacheState = cacheStates[cacheId];
      // 如果缓存状态为 DESTROY，需要清理旧的 DOM 节点
      if (cacheState.status === cacheTypes.DESTROY) {
        const doms = cacheState.doms;
        doms?.forEach(dom => dom.parentNode?.removeChild(dom));
        // 重新创建缓存
        dispatch({ type: cacheTypes.CREATE, payload: { cacheId, reactElement } });
      }
    } else {
      // 如果是首次挂载，创建新的缓存
      dispatch({ type: cacheTypes.CREATE, payload: { cacheId, reactElement } });
    }
  }, [cacheStates]);
 // 处理滚动事件，记录滚动位置
  const handleScroll = useCallback((cacheId: string, event: Event) => {
    if (cacheStates[cacheId]) {
      const target = event.target as HTMLElement;
      const scrolls = cacheStates[cacheId].scrolls;
       // 保存当前元素的滚动位置
      scrolls[target.toString()] = target.scrollTop;
    }
  }, [cacheStates]);

  return (
    <CacheContext.Provider value={{ cacheStates, dispatch, mount, handleScroll }}>
     {/* 渲染传入的子组件 */}
      {children}
      {
        Object.values(cacheStates)
          // 只渲染未被销毁的缓存组件
          .filter(cacheState => cacheState.status !== cacheTypes.DESTROY)
          .map(({ cacheId, reactElement }) => (
            <div id={`cache-${cacheId}`} key={cacheId} ref={
              (divDOM: HTMLDivElement | null) => {
                const cacheState = cacheStates[cacheId];
                if (divDOM && !cacheState.doms) {
                  // 当 DOM 挂载完成且还未缓存时，收集并保存 DOM 节点
                  const doms = Array.from(divDOM.childNodes) as HTMLElement[];
                  dispatch({ type: cacheTypes.CREATED, payload: { cacheId, doms } });
                }
              }
            }>{reactElement}</div>
          ))
      }
    </CacheContext.Provider>
  );
}

export default KeepAliveProvider;