import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css';
import { Accordion, Panel, ListGroup, ListGroupItem } from 'react-bootstrap';

const EventListGroupItem = (props) => {
  return (
    <ListGroupItem key={props.id}>{props.summary}</ListGroupItem>
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
          prompt={'consent'}
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
      sortedEvents: [],
      auth: false
    };

    axios.get('/events').then((response) => {
      console.log('response: ', response);
      const events = response.data.events;
      return this.setState({ events });
    }).catch(err => console.log(err));
  }

  responseGoogle(response) {
    return axios.post('/auth', response).then((response) => {
      const events = response.data.events;
      const auth = response.data.auth;
      // Group events by day, map into array, sort array by date (for displaying events in day lists)
      const groupedEvents = _.groupBy(events, event => moment(event.start.dateTime || event.start.date).format('MMMM Do, YYYY'));
      const mappedEvents = _.map(groupedEvents, (events, date) => {
        return {
          date,
          events
        };
      });
      const sortedEvents = _.sortBy(mappedEvents, group => group.date);

      return this.setState({ events, sortedEvents, auth });
    }).catch(err => console.log(err));
  }

  renderEvents(authorized) {
    if (authorized) {
      return (
        <Accordion>
          {
            this.state.sortedEvents.map((group, index) => {
              return (
                <Panel key={index} header={group.date} eventKey={index}>
                  <ListGroup key={index} fill>
                    {
                      group.events.map((event, index) => {
                        return (
                           <EventListGroupItem key={index} id={event.id} summary={event.summary}></EventListGroupItem>
                        );
                      })
                    }
                  </ListGroup>
                </Panel>
              );
            })
          }
        </Accordion>
      );
    } else {
      return null;
    }
  }

  render() {
    const authorized = !!this.state.auth;
    return (
      <div className='App'>
        <Auth authorized={authorized} responseGoogle={(response) =>  this.responseGoogle(response)} />
        <div>{ this.renderEvents(authorized) }</div>
      </div>
    );
  }
}

export default App;
