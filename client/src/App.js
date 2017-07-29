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
    
    const extendedProperties = _.defaults(this.props.extendedProperties, {
      private: {
        why: '',
        result: ''
      }
    });

    this.state = {
      id: this.props.id,
      end: this.props.endTime,
      start: this.props.startTime,
      extendedProperties,
      buttonClass: 'btn btn-default btn-block'
    };
  }

  handleSubmit(e) {
    e.preventDefault();

    return axios.put('/event', this.state).then((response) => {
      return this.setState({buttonClass: 'btn btn-success btn-block'});
    }).catch((err) => {
      console.log(err);
      return this.setState({buttonClass: 'btn btn-danger btn-block'});
    });
  }

  updatedInputValue(e, type) {
    let update = _.clone(this.state.extendedProperties);
    update.private[type] = e.target.value;
    
    return this.setState({
      extendedProperties: update
    });
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
                value={this.state.extendedProperties.private.why}
                placeholder="Why?"
              />
            </Col>
            <Col sm={3}>
              <FormControl
                ref="result"
                onChange={(e) => this.updatedInputValue(e, 'result')}
                type="text"
                label="Result?"
                value={this.state.extendedProperties.private.result}
                placeholder="Result?"
              />
            </Col>
            <Col sm={2}>
              <Button className={this.state.buttonClass} block type="submit" bsStyle="default">Save</Button>
            </Col>
          </Form>
        </Row>
      </ListGroupItem>
    );
  }
}

class Auth extends Component {
  render() {
    if (this.props.initializing) {
      return (
        <div className="login-content">
          <img src={logo} alt="Sun Shen" className="img img-responsive"/>
        </div>
      );
    } else {
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
    }
  }
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      events: [],
      sortedEvents: [],
      auth: false,
      initializing: true
    };

    axios.get('/init').then((response) => {
      const state = _.extend(response.data, {initializing: false});
      return this.setState(state);
    }).catch(err => console.log(err));
  }

  responseGoogle(response) {
    return axios.post('/auth', response).then((response) => {      
      return this.setState(response.data);
    }).catch(err => console.log(err));
  }

  renderEvents() {
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
                           extendedProperties={event.extendedProperties} 
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
  }

  render() {
    if (this.state.authorized) {
      return (
        <div className='App'>
          <div>{this.renderEvents()}</div>
        </div>
      );
    } else {
      return (
        <div className='App'>
          <Auth initializing={this.state.initializing} responseGoogle={(response) =>  this.responseGoogle(response)} />
        </div>
      );
    }
  }
}

export default App;
