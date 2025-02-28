// src/components/TabNav.tsx
import React from 'react';
import { Tabs, TabList, Tab } from 'react-tabs';
import { Link } from 'react-router-dom';

const TabNav: React.FC = () => (
  <Tabs>
    <TabList>
      <Tab>
        <Link to="/home">Home</Link>
      </Tab>
      <Tab>
        <Link to="/about">About</Link>
      </Tab>
      <Tab>
        <Link to="/dashboard">Dashboard</Link>
      </Tab>
    </TabList>
  </Tabs>
);

export default TabNav;