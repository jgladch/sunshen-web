import React, { Component } from 'react';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import moment from 'moment';
import _ from 'lodash';
import 'bootstrap/dist/css/bootstrap.css';
import logo from './logo.png';
import { 
  Accordion,
  Button,
  Checkbox,
  Col,
  ControlLabel,
  Row,
  Form,
  FormGroup,
  FormControl,
  Modal,
  Panel,
  ListGroup,
  ListGroupItem,
} from 'react-bootstrap';
import './App.css';

class EventListGroupItem extends Component {
  constructor(props) {
    super(props);
    
    const extendedProperties = _.defaults(this.props.extendedProperties, {
      private: {
        why: '',
        result: '',
        where: ''
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

  componentWillReceiveProps(nextProps) {
    const extendedProperties = _.defaults(nextProps.extendedProperties, {
      private: {
        why: '',
        result: '',
        where: ''
      }
    });

    this.setState({
      id: nextProps.id,
      end: nextProps.endTime,
      start: nextProps.startTime,
      extendedProperties
    });  
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

  onInputChange(e) {
    let update = _.clone(this.state.extendedProperties);
    update.private.result = e.target.value;

    return this.setState({
      extendedProperties: update
    })
  }

  render() {
    return (
      <ListGroupItem key={this.props.id}>
        <Row>
          <Col sm={12} className='text-center'>
            <h4 className='title-inline'>{this.props.start}: {this.props.summary}</h4><span id='result-icon' className={`list-group-${this.state.extendedProperties.private.result}`}></span>
          </Col>
        </Row>
        <Panel className="padded-panel">
          <Form horizontal onSubmit={(e) => this.handleSubmit(e)}>
            <Row>
              <Col sm={4}>
                <FormGroup controlId="why">
                  <ControlLabel>Why are you doing this?</ControlLabel>
                  <FormControl
                    ref="why"
                    onChange={(e) => this.updatedInputValue(e, 'why')}
                    type="text"
                    label="Why are you doing this?"
                    value={this.state.extendedProperties.private.why}
                  />
                </FormGroup>
              </Col>
              <Col sm={4}>
                <FormGroup controlId="why">
                  <ControlLabel>Where does it lead you long term?</ControlLabel>
                  <FormControl
                    ref="where"
                    onChange={(e) => this.updatedInputValue(e, 'where')}
                    type="text"
                    label="Where does it lead you long term?"
                    value={this.state.extendedProperties.private.where}
                  />
                </FormGroup>
              </Col>
              <Col sm={4}>
                <FormGroup controlId="why">
                  <ControlLabel>How much did you enjoy it?</ControlLabel>
                  <FormControl componentClass="select" placeholder="select" value={this.state.extendedProperties.private.result} onChange={(e) => this.onInputChange(e)}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </FormControl>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Button className={this.state.buttonClass} block type="submit" bsStyle="default">Save</Button>
            </Row>
          </Form>
        </Panel>
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
      initializing: true,
      calendars: [],
      showModal: false
    };

    this.timeMin = moment();
    this.timeMax = moment().add(1, 'weeks');

    axios.get('/init').then((response) => {
      const state = _.extend(response.data, {initializing: false});
      const settings = JSON.parse(localStorage.calendars || '[]');

      state.calendars = state.calendars.map((cal) => {
        const found = _.find(settings, {id: cal.id});

        if (found) {
          cal.show = found.show;
        } else {
          cal.show = true;
        }

        return cal;
      });

      state.sortedEvents = sortEvents(filterEvents(state.events, state.calendars));

      return this.setState(state);
    }).catch(err => console.log(err));
  }

  responseGoogle(response) {
    return axios.post('/auth', response).then((response) => {
      const state = response.data;
      const settings = JSON.parse(localStorage.calendars || '[]');

      state.calendars = state.calendars.map((cal) => {
        const found = _.find(settings, {id: cal.id});

        if (found) {
          cal.show = found.show;
        } else {
          cal.show = true;
        }

        return cal;
      });

      state.sortedEvents = sortEvents(filterEvents(state.events, state.calendars));

      return this.setState(state);
    }).catch(err => console.log(err));
  }

  changeEvents(direction) {
    if (direction === 'back') {
      this.timeMin.subtract(1, 'weeks');
      this.timeMax.subtract(1, 'weeks');
    } else {
      this.timeMin.add(1, 'weeks');
      this.timeMax.add(1, 'weeks');
    }

    return axios.get(`/events?timeMin=${this.timeMin.toISOString()}&timeMax=${this.timeMax.toISOString()}`)
      .then((response) => {
        const events = response.data.events;
        const sortedEvents = sortEvents(filterEvents(events, this.state.calendars));

        return this.setState({
          events,
          sortedEvents
        });
      })
      .catch(err => console.log(err));
  }

  openModal() {
    return this.setState({showModal: true});
  }

  closeModal() {
    return this.setState({showModal: false});
  }

  updateCheckbox(e, calId) {
    let calendars = _.clone(this.state.calendars);
    calendars = calendars.map((cal) => {
      if (cal.id === calId) {
        cal.show = e.target.checked;
      }
      return cal;
    });

    localStorage.calendars = JSON.stringify(calendars.map(cal => {
      return {
        id: cal.id,
        show: cal.show
      };
    }));

    const sortedEvents = sortEvents(filterEvents(this.state.events, calendars));

    return this.setState({
      calendars,
      sortedEvents
    });
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
          <div className="controls-row">
            <Button className="controls-back" bsStyle="default" onClick={() => this.changeEvents('back')}>Back</Button>
            <Button className="controls-next" bsStyle="default" onClick={() => this.openModal()}>Calendars</Button>
            <Button className="controls-next" bsStyle="default" onClick={() => this.changeEvents('next')}>Next</Button>
          </div>
          <div>{this.renderEvents()}</div>
          <Modal show={this.state.showModal} onHide={() => this.closeModal()}>
            <Modal.Header closeButton>
              <Modal.Title>Calendars</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <ListGroup>
              {
                this.state.calendars.map((cal, index) => {
                  return (
                    <ListGroupItem key={cal.id}>
                      <Checkbox checked={cal.show} onChange={(e) => this.updateCheckbox(e, cal.id)}></Checkbox> {cal.summary}
                    </ListGroupItem>
                  );
                })
              }
              </ListGroup>
            </Modal.Body>
          </Modal>
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

function sortEvents (events) { // Group events by day, map into array, sort array by date (for displaying events in day lists)
  const groupedEvents = _.groupBy(events, event => moment(event.start.dateTime || event.start.date).format('MMMM Do, YYYY'));
  const mappedEvents = _.map(groupedEvents, (events, date) => {
    return {
      date,
      events
    };
  });
  const sortedEvents = _.sortBy(mappedEvents, group => group.date);

  return sortedEvents;
}

function filterEvents (events, calendars) {
  return _.filter(events, (evt) => {
    const found = _.find(calendars, {id: evt.calId, show: true});
    return !!found;
  })
}

export default App;
