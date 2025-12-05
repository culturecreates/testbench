
import React from 'react';
import { Form, Col } from 'react-bootstrap';
import fetchJsonp from 'fetch-jsonp';
import ReconciliationService from './ReconciliationService.js';

export default class ReconciliationServiceInput extends React.Component {

  state = {
    service: this.props.initialService
  };

  componentDidMount() {
    this.timer = null;
    console.log('hey do we need to validate');
    console.log(this.props.initialService);
    if (this.props.initialService.endpoint && !this.props.initialService.manifest) {
      console.log('validating endpoint at start');
      this.validateEndpoint();
    }
  }

  setService(service) {
     this.setState({
	service: service
     });
  }

  handleChange(e) {
     clearTimeout(this.timer);

     this.setState({
	service: new ReconciliationService(e.target.value, undefined, undefined),
        error: undefined
     });
 
     this.timer = setTimeout(() => this.validateEndpoint(), 1000);
  }

  validateEndpoint() {
     let endpoint = this.state.service.endpoint;
     fetch(endpoint)
      .then(result => result.json())
      .then(result => this._setService(endpoint, result, true))
      .catch(e =>
	     fetchJsonp(endpoint)
	      .then(result => result.json())
	      .then(result => this._setService(endpoint, result, false))
	      .catch(e => this._setError(endpoint, e)));
  }

  _setService(endpoint, manifest, cors) {
    if(this.state.service.endpoint === endpoint) {
	let service = new ReconciliationService(endpoint, manifest, cors);
        this.setState({
	  service: service 
        });
        if(this.props.onChange !== undefined) {
           this.props.onChange(service);
        }
    }
  }

  _setError(endpoint, error) {
    if(this.state.service.endpoint === endpoint) {
        this.setState({manifest: undefined, error: error})
        if(this.props.onChange !== undefined) {
           this.props.onChange(undefined, undefined);
        }
    }
  }
  
  getValidationState() {
     if (this.state.service !== undefined && this.state.service.manifest !== undefined) {
        return 'success';
     } else if(this.state.error !== undefined) {
        return 'error';
     }
     return null;
  }

  getMessage() {
     let message = '';
     if (this.getValidationState() === 'error') {
        message = 'The endpoint MUST return a JSON document describing the service, accessible vîa CORS or JSONP.';
        let endpoint = this.state.service.endpoint;
        if (endpoint !== undefined && (
                endpoint.startsWith('http://')
                && !endpoint.startsWith('http://localhost')
                && !endpoint.startsWith('http://127.0.0.1'))) {
           message += ' The endpoint SHOULD be available over HTTPS. Depending on your browser, this test bench might not be able to test reconciliation services over HTTP.';
        }
        return message;
     }
  }

  handleSubmit(e) {
     clearTimeout(this.timer);
     this.validateEndpoint();
     e.preventDefault();
  }

  render() {
     const validationState = this.getValidationState();
     const isValid = validationState === 'success';
     const isInvalid = validationState === 'error';

     return (
        <Form onSubmit={(e) => this.handleSubmit(e)}>
          <Form.Group controlId="endpointField" className="mb-3">
            <Form.Label column sm={1}>Endpoint:</Form.Label>
            <Col sm={11}>
                <Form.Control
                  type="text"
                  value={this.state.service.endpoint}
                  placeholder="URL of the reconciliation service endpoint"
                  onChange={e => this.handleChange(e)}
                  isValid={isValid}
                  isInvalid={isInvalid}
                />
                {isInvalid && <Form.Control.Feedback type="invalid">{this.getMessage()}</Form.Control.Feedback>}
            </Col>
          </Form.Group>
        </Form>
     );
  }
}
