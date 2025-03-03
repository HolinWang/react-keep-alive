// src/pages/Home.tsx
import React, { useState } from 'react';

const About: React.FC = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div>
      <h1>Home Page</h1>
      <input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        placeholder="测试输入框状态保持"
      />

      <p 
        onClick={() => {
          // 生成当前时间的时间戳
          const currentTimestamp = Date.now();
          console.log(currentTimestamp);
          window.open('/home/dashboard'+currentTimestamp,'_blank')
        }}
      >
        打开页面
      </p>
    </div>
  );
};

export default About;