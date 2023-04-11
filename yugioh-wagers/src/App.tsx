import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import InformationPane from './components/InformationPane';
import { Pane } from './components/InformationPane';
import './App.css';
import Card from './components/Card';

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
        <Card
          isLarge={false}
          name="Nimble Momonga"
          id="22567609"
          desc="test description"
        />
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
