import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import InformationPane from './components/InformationPane';
import { Pane } from './components/InformationPane';
import './App.css';
import Card from './components/Card';
import Button from './Button';

function App() {
  const [screen, setScreen] = useState("Wager");

  const testPane: Pane = {
    name: "Test",
    id: "id-test",
    count: 24,  
  }

  function changeScreen(){
    if (screen == "Wager"){
      setScreen("Liquidate");
    } else {
      setScreen("Wager");
    }
  }

  return (
    <div className="App">
      <div className="left-column">
        <p>{screen}</p>
        <InformationPane 
          name="Test"
          id="id-test"
          count={25}
        />
        <Card
          isLarge={false}
          name="Nimble Momonga"
          id="22567609"
          desc=""
        />
        <Button onClick={changeScreen}>
          Test
        </Button>
        
      </div>
      <div className = "main-content">
        <p>Main Content</p>
      </div>
      <div className="card right-column">
      </div>
      <div className="bottom-nav">
        <p>Bottom Nav</p>
      </div>
    </div>
  )
}

export default App
