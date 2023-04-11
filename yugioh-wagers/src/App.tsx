import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import InformationPane from './components/InformationPane';
import { Pane } from './components/InformationPane';
import './App.css';

function App() {
  const [count, setCount] = useState(0)
  const testPane: Pane = {
    name: "Test",
    id: "id-test",
    count: 24,
  }
  return (
    <div className="App">
      <div className="left-column">
        <InformationPane 
          name="Test"
          id="id-test"
          count={25}
        />
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className = "main-content">
        <p>Main Content</p>
      </div>
      <div className="card right-column">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div className="bottom-nav">
        <p>Bottom Nav</p>
      </div>
    </div>
  )
}

export default App
