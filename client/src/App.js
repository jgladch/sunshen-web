import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import moment from 'moment';

const Event = (props) => {
  const format = (time) => {
    return moment(time).format('MMMM Do, h:mm:ss a');
  };
  
  return (
    <li>{`${format(props.start)}: ${props.summary}`}</li>
  );
};

class Auth extends Component {
  render() {
    const authorized = this.props.authorized;
    if (!authorized) {
      return (
        <GoogleLogin
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
          buttonText='Login'
          responseType={'id_token token'}
          offline={true}
          scope={'https://www.googleapis.com/auth/admin.directory.resource.calendar'}
          onSuccess={(response) => this.props.responseGoogle(response)}
          onFailure={(response) => this.props.responseGoogle(response)}
        />
      );
    } else {
      return null;
    }
  }
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      events: [],
      auth: !!localStorage && !!localStorage.sunShenAuth ? JSON.parse(localStorage.sunShenAuth) : false
    };

    if (this.state.auth) {
      axios.get('/events').then((response) => {
        const events = response.data.events;
        this.setState({ events });
      }).catch(err => console.log(err));
    }
  }

  responseGoogle(response) {
    return axios.post('/auth', response).then((response) => {
      const events = response.data.events;
      const auth = response.data.auth;

      if (!!localStorage) {
        localStorage.sunShenAuth = JSON.stringify(auth);
      }

      this.setState({ events, auth });
    }).catch(err => console.log(err));
  }

  renderEvents() {
    return this.state.events.map((event) => {
      const start = event.start.dateTime || event.start.date;
      return (
        <Event key={event.id} start={start} summary={event.summary} />
      );
    })
  }

  render() {
    const authorized = !!this.state.auth;
    return (
      <div className='App'>
        <Auth authorized={authorized} responseGoogle={(response) =>  this.responseGoogle(response)} />
        <ul>{ this.renderEvents() }</ul>
      </div>
    );
  }
}

export default App;
