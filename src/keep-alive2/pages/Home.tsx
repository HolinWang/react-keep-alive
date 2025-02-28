// src/pages/Home.tsx
import React, { useState } from 'react';

const Home: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div>
      <h1>Home Page</h1>
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="测试输入框状态保持"
      />
    </div>
  );
};

export default Home;