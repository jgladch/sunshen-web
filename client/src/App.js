import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';

class App extends Component {
  constructor() {
    super();

    this.state = {
      events: []
    };
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
      </div>
    );
  }
}

export default App;
