import { useRef, useContext, useEffect } from 'react';
import CacheContext from './CacheContext';
import * as cacheTypes from './cache-types';
import { v4 as uuidv4 } from 'uuid';

// 定义 OldComponent 的类型，这里使用 React.ComponentType 来表示一个 React 组件
type OldComponentType = React.ComponentType<any>;

// 定义 withKeepAlive 函数的第二个参数的类型
interface WithKeepAliveOptions {
  cacheId?: string;
  scroll?: boolean;
}

// withKeepAlive 函数，用于创建一个高阶组件
function withKeepAlive(OldComponent: OldComponentType, { cacheId = uuidv4(), scroll }: WithKeepAliveOptions = {}) {
  // 返回一个新的函数组件
  return function (props: any) {
    // 使用 useContext 钩子获取 CacheContext 中的值
    // @ts-ignore
    const { cacheStates, dispatch, mount, handleScroll } = useContext(CacheContext);
    // 创建一个 ref 用于引用 div 元素
    const divRef = useRef<HTMLDivElement>(null);

    // 监听滚动事件的副作用钩子
    useEffect(() => {
      // 绑定 handleScroll 函数，并传入 cacheId
      const onScroll = handleScroll.bind(null, cacheId);
      if (scroll) {
        // 给 div 元素添加滚动事件监听器
        divRef.current?.addEventListener('scroll', onScroll, true);
      }
      // 组件卸载时移除滚动事件监听器
      return () => {
        divRef.current?.removeEventListener('scroll', onScroll);
      };
    }, [handleScroll]);

    // 处理缓存状态的副作用钩子
    useEffect(() => {
      // 获取当前 cacheId 对应的缓存状态
      const cacheState = cacheStates[cacheId];
      // 如果缓存状态存在，且 doms 存在，且状态不是 DESTROY
      if (cacheState && cacheState.doms && cacheState.status !== cacheTypes.DESTROY) {
        const doms = cacheState.doms;
        // 将缓存的 dom 元素添加到当前 div 元素中
        doms.forEach((dom: Node) => divRef.current?.appendChild(dom));
        if (scroll) {
          // 恢复滚动位置
          doms.forEach((dom: Node & { scrollTop: number }) => {
            if (cacheState.scrolls[dom]) {
              dom.scrollTop = cacheState.scrolls[dom];
            }
          });
        }
      } else {
        // 如果没有缓存，调用 mount 函数创建新的组件实例
        mount({ cacheId, reactElement: <OldComponent {...props} dispatch={dispatch} /> });
      }
    }, [cacheStates, dispatch, mount, props]);

    return (
      <div id={`withKeepAlive-${cacheId}`} ref={divRef}>
        {/* 此处需要一个 OldComponent 渲染出来的真实 DOM */}
      </div>
    );
  };
}

export default withKeepAlive;