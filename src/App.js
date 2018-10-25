import React, { Component } from 'react';
import Three from './Three'
import WebMidi from 'webmidi'
import './App.css';

class App extends Component {

  constructor() {
    super();
  }
  
  componentDidMount() {
  }


  render() {
    return (
      <div className="App">
        <Three />
      </div>
    );
  }
}

export default App;
