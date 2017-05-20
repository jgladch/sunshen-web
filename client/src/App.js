import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';

const responseGoogle = (response) => {
  console.log(response);
  axios.post('/auth', response).then(response => console.log('response: ', response)).catch(err => console.log(err));
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      events: []
    };
  }
  render() {
    return (
      <div className='App'>
        <GoogleLogin
          clientId='19384924645-o5equrcis2e7oo46scvlgpn7fe8e6t4g.apps.googleusercontent.com'
          buttonText='Login'
          responseType={'id_token token'}
          offline={true}
          scope={'https://www.googleapis.com/auth/admin.directory.resource.calendar'}
          onSuccess={responseGoogle}
          onFailure={responseGoogle}
        />
      </div>
    );
  }
}

export default App;
