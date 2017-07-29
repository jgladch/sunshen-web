import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css';
import './App.css';
import logo from './logo.png';
import { 
  Accordion,
  Button,
  Col,
  Row,
  Form,
  FormControl,
  Panel,
  ListGroup,
  ListGroupItem,
} from 'react-bootstrap';

class EventListGroupItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: this.props.id,
      end: this.props.endTime,
      start: this.props.startTime
    };
  }

  handleSubmit(e) {
    e.preventDefault();

    console.log('submitting!');
    console.log('state: ', this.state);

    return axios.put('/event', this.state).then((response) => {
      console.log('/event response: ', response);
      // return this.setState({ events, sortedEvents, auth });
    }).catch(err => console.log(err));
  }

  updatedInputValue(e, type) {
    let obj = {};
    obj[type] = e.target.value;
    this.setState(obj);
  }

  render() {
    return (
      <ListGroupItem key={this.props.id}>
        <Row>
          <Col sm={4}>{this.props.start}: {this.props.summary}</Col>
          <Form horizontal onSubmit={(e) => this.handleSubmit(e)}>
            <Col sm={3}>
              <FormControl
                ref="why"
                onChange={(e) => this.updatedInputValue(e, 'why')}
                type="text"
                label="Why?"
                placeholder="Why?"
              />
            </Col>
            <Col sm={3}>
              <FormControl
                ref="result"
                type="text"
                label="Result?"
                onChange={(e) => this.updatedInputValue(e, 'result')}
                placeholder="Result?"
              />
            </Col>
            <Col sm={2}>
              <Button block type="submit" bsStyle="default">Save</Button>
            </Col>
          </Form>
        </Row>
      </ListGroupItem>
    );
  }
}

class Auth extends Component {
  render() {
    const authorized = this.props.authorized;
    if (!authorized) {
      return (
        <div className="login-content">
          <img src={logo} alt="Sun Shen" className="img img-responsive"/>
          <GoogleLogin
            clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}
            buttonText='Login with Google'
            className='btn btn-block btn-danger login-button'
            responseType={'id_token token'}
            offline={true}
            scope={'https://www.googleapis.com/auth/admin.directory.resource.calendar https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.readonly'}
            prompt={'consent'}
            onSuccess={(response) => this.props.responseGoogle(response)}
            onFailure={(response) => this.props.responseGoogle(response)}
          />
        </div>
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
                        const start = moment(event.start.dateTime || event.start.date).format('h:mm A');
                        return (
                           <EventListGroupItem 
                             start={start} 
                             key={index} 
                             id={event.id} 
                             summary={event.summary} 
                             privateProps={event.extendedProperties} 
                             startTime={event.start} 
                             endTime={event.end}>
                           </EventListGroupItem>
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
