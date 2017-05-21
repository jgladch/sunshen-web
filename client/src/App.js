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

class App extends Component {
  constructor() {
    super();

    this.state = {
      events: []
    };
  }

  renderEvents() {
    return this.state.events.map((event) => {
      const start = event.start.dateTime || event.start.date;
      return (
        <Event key={event.id} start={start} summary={event.summary} />
      );
    })
  }

  responseGoogle(response) {
    return axios.post('/auth', response).then((response) => {
      const events = response.data;
      return this.setState({ events });
    }).catch(err => console.log(err));
  }

  render() {
    return (
      <div className='App'>
        <GoogleLogin
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
          buttonText='Login'
          responseType={'id_token token'}
          offline={true}
          scope={'https://www.googleapis.com/auth/admin.directory.resource.calendar'}
          onSuccess={(response) => this.responseGoogle(response)}
          onFailure={(response) => this.responseGoogle(response)}
        />
        <ul>{ this.renderEvents() }</ul>
      </div>
    );
  }
}

export default App;
