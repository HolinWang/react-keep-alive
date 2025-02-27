/**
 * 本组件核心思路是
 * 我们要通过缓存容器去创建OldComponent对应的真实DOM，并且进行缓存
 * 即使这个OldComponent被销毁了，缓存还可以保留
 * 以后这个OldComponent再次渲染的时候，可以复用上次的缓存就可以了
 */
import React, { useRef, useContext, useEffect, ComponentType } from 'react';
import CacheContext from './CacheContext';
import * as cacheTypes from './cache-types';
import { v4 as uuidv4 } from 'uuid';

interface KeepAliveOptions {
  cacheId?: string;
  scroll?: boolean;
}

interface CacheContextType {
  cacheStates: Record<string, {
    doms: HTMLElement[];
    status: string;
    scrolls: Record<string, number>;
  }>;
  dispatch: Function;
  mount: (options: { cacheId: string; reactElement: React.ReactElement }) => void;
  handleScroll: (cacheId: string, event: Event) => void;
}

function withKeepAlive<P extends object>(
  OldComponent: ComponentType<P>, 
  { cacheId = uuidv4(), scroll }: KeepAliveOptions = {}
) {
  return function KeepAliveComponent(props: P) {
    const { cacheStates, dispatch, mount, handleScroll } = useContext<CacheContextType>(CacheContext);
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const onScroll = handleScroll.bind(null, cacheId);
      if (scroll && divRef.current) {
        divRef.current.addEventListener('scroll', onScroll, true);
        return () => {
          divRef.current?.removeEventListener('scroll', onScroll);
        };
      }
    }, [handleScroll]);

    useEffect(() => {
      const cacheState = cacheStates[cacheId];
      if (cacheState?.doms && cacheState.status !== cacheTypes.DESTROY) {
        const doms = cacheState.doms;
        doms.forEach(dom => divRef.current?.appendChild(dom));
        
        if (scroll) {
          doms.forEach(dom => {
            const key = dom.toString();
            if (cacheState.scrolls[key]) {
              dom.scrollTop = cacheState.scrolls[key];
            }
          });
        }
      } else {
        mount({
          cacheId,
          reactElement: <OldComponent {...props} dispatch={dispatch} />
        });
      }
    }, [cacheStates, dispatch, mount, props]);

    return (
      <div id={`withKeepAlive-${cacheId}`} ref={divRef}>
        {/* 此处需要一个OldComponent渲染出来的真实DOM */}
      </div>
    );
  };
}

export default withKeepAlive;

