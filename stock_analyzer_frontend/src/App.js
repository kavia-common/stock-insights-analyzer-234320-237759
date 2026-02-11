import React from 'react';
export default function App(){
  return React.createElement('div',{className:'App',style:{fontFamily:'sans-serif',padding:20}},
    React.createElement('h1',null,'Stock Insights Analyzer (dev)'),
    React.createElement('div',null,'Chart placeholder - install chart.js to render charts')
  );
}
