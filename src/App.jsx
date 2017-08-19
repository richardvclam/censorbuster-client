import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import './bootstrap.min.css';

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>CensorBuster</h2>
        </div>
        <form onSubmit={this.handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">
              First, we'll need your email
              <input className="form-control" type="text" id="email" />
            </label>
          </div>
          <input className="btn btn-default" type="submit" value="Submit" />
        </form>
      </div>
    );
  }
}
