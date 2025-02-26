import React from 'react';
// 定义一个默认值，类型与传递给 Provider 的 value 类型兼容
const defaultContextValue = {
  cacheStates: {},
  dispatch: () => {},
  mount: () => {},
  handleScroll: () => {}
};

// 创建 Context 并传入默认值
const CacheContext:any = React.createContext(null);

export default CacheContext;