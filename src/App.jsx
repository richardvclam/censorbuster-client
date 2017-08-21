import React, { Component } from 'react';
import classNames from 'classnames';
import { validateEmail } from './js/util';
import logo from './img/logo.svg';
import './css/App.css';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: '',
      error: false,
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ email: event.target.value });
  }

  handleSubmit() {
    if (validateEmail(this.state.email)) {
      this.setState({ error: false });
    } else {
      this.setState({ error: true });
    }
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>CensorBuster</h2>
        </div>
        <div className="container">
          <div className="form-group mt-3">
            <label htmlFor="email">
              We'll need your email address
            </label>
            <input
              placeholder="Email address"
              type="text"
              id="email"
              value={this.state.email}
              onChange={this.handleChange}
              className={classNames('form-control', { 'is-invalid': this.state.error })}
            />
            <div className="invalid-feedback">
              Sorry, the email you've entered is invalid. Please try again.
            </div>
          </div>
          <input className="btn btn-primary" type="submit" value="Continue" onClick={this.handleSubmit} />
        </div>
      </div>
    );
  }
}
