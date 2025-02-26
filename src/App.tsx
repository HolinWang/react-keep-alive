import React from 'react';
import { Route, Link, Switch } from 'react-router-dom';
import { KeepAliveProvider, withKeepAlive } from './keep-alive';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
let KeepAliveHome = withKeepAlive(Home, {});
let KeepAliveUserList = withKeepAlive(About, { cacheId: 'UserList', scroll: true });
let KeepAliveUserAdd = withKeepAlive(Contact, { cacheId: 'UserAdd' });
const App: React.FC = () => {
  return (
    <KeepAliveProvider>
      <ul>
        <li><Link to="/">首页</Link></li>
        <li><Link to="/list">用户列表</Link></li>
        <li><Link to="/add">添加用户</Link></li>
      </ul>
      <Switch>
        <Route path="/" component={KeepAliveHome} exact />
        <Route path="/list" component={KeepAliveUserList} />
        <Route path="/add" component={KeepAliveUserAdd} />
      </Switch>
    </KeepAliveProvider>
  );
};

export default App;