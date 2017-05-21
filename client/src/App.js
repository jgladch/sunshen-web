import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';

const responseGoogle = (response) => {
  console.log(response);
  console.log(process.env.REACT_APP_GOOGLE_CLIENT_ID);
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
          clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
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
