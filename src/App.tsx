import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BMSParser } from 'Helpers/bms/parser';
import BMSPlayer from 'Pages/Parser/select';
function App() {
    const parser = new BMSParser();
    console.log(parser);
    return (
        <div className="App">
            <BMSPlayer />
        </div>
    );
}

export default App;
