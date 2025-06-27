import React from 'react';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import ListGroup from 'react-bootstrap/lib/ListGroup';
import GenericInput from './GenericInput.js';
import DataExtensionValue from './DataExtensionValue.js';
import JSONTree from 'react-json-tree';
import {jsonTheme} from './utils.js';
import { getSchema } from './JsonValidator.js';

export default class DataExtensionTab extends React.Component {

  constructor() {
      super();
      this.state = {
        entity: undefined,
        property: undefined,
        extendResults: undefined,
        validationErrors: [],
        proposeTypeInput: ''
      };
  }

  onEntityChange = (newValue) => {
      this.setState({
          entity: newValue,
          extendResults: undefined,
          validationErrors: []
      });
  }

  onPropertyChange = (newValue) => {
      this.setState({
          property: newValue,
          extendResults: undefined,
          validationErrors: []
      });
  }

  handleProposeTypeInput = (newValue) => {
    this.setState({ proposeTypeInput: newValue?.name });
  }

  openProposeWindow = () => {
    let baseUrl = this.props.service.endpoint;
    let proposeUrl = baseUrl.replace(/\/?$/, '/extend/propose');
    let url = new URL(proposeUrl);
    if (this.state.proposeTypeInput) {
      url.searchParams.append('type', this.state.proposeTypeInput);
    }
    window.open(url.toString(), '_blank');
  }

  formulateQuery() {
      if (this.state.entity !== undefined && this.state.property !== undefined) {
          return {
            ids: [this.state.entity.id],
            properties: [{id: this.state.property.name}]
          };
      } else {
          return {};
      }
  }

  formulateQueryUrl() {
      let baseUrl = this.props.service.endpoint;
      if (!baseUrl) {
         return '#';
      }
      baseUrl = `${baseUrl.replace(/\/$/, '')}/extend`;
      let params = {
        extend: JSON.stringify(this.formulateQuery())
      };
      let url = new URL(baseUrl);
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
      return url.toString();
  }

  resetQuery = (e) => {
        e.preventDefault();
        this.setState({
                entity: undefined,
                property: undefined,
                extendResults: undefined,
                validationErrors: undefined
        });
  }

  submitQuery = (e) => {
        e.preventDefault();
        this.setState({extendResults: 'fetching'});
         let fetcher = this.props.service.postFetcher();
         let url = this.props.service.endpoint;
         url = `${url.replace(/\/$/, '')}/extend`;
        fetcher({url,queries:JSON.stringify(this.formulateQuery())},{timeout: 20000})
           .then(result => result.json())
           .then(result =>
               this.setState({
                  extendResults: result,
                  validationErrors: this.validateServiceResponse(result)
               })
           )
           .catch(e => {
              this.setState({
                exdentResults: 'failed',
                extendError: e.message
              });
           });
  }

  renderResponseValidationErrors() {
        return <div/>;
  }

  renderQueryResults() {
        if (this.state.extendResults === 'fetching') {
             return (<div className="resultsPlaceholder">Querying the service...</div>);
        } else if (this.state.extendResults === 'failed') {
             return (<div className="resultsPlaceholder">Error: {this.state.extendError}</div>);
        } else if (this.state.extendResults === undefined || this.state.entity === undefined || this.state.property === undefined) {
             return (<div />);
        } else {
             if (!Array.isArray(this.state.extendResults.rows)) {
                  return (<span className="resultsPlaceholder">No <code>rows</code> array in the response.</span>);
             }
             const entityRow = this.state.extendResults.rows.find(row => row.id === this.state.entity.id);
             if (!entityRow) {
                  return (<span className="resultsPlaceholder">Missing row for entity <code>{this.state.entity.id}</code> in the response.</span>);
             }
             const propertyObj = entityRow.properties.find(prop => prop.id === this.state.property.name);
             if (!propertyObj) {
                  return (<span className="resultsPlaceholder">Missing property <code>{this.state.property.id}</code> for entity <code>{this.state.entity.id}</code> in the response.</span>);
             }
             const values = propertyObj.values || [];
             if (values.length === 0) {
                  return (<span className="noResults">No results</span>);
             }
             return (
                <ListGroup>
                   {values.map((value, idx) =>
                        <DataExtensionValue value={value} key={"data-extension-result-"+idx} />)}
                </ListGroup>);
        }
  }

  validateServiceResponse(response) {
	let schema = getSchema(this.props.service.latestCompatibleVersion, 'data-extension-response'); 
        let valid = schema(response);
        if (!valid) {
             return schema.errors.map(error => error.dataPath+' '+error.message);
        } else {
             return [];
        }
  }

  render() {
    return (
     <div>
        <Col sm={5}>
            <Form horizontal>
                <FormGroup controlId="dataExtensionEntity">
                    <Col componentClass={ControlLabel} sm={2}>Entity:</Col>
                    <Col sm={10}>
                        <GenericInput
                            service={this.props.service}
                            placeholder="Entity to fetch data from"
                            value={this.state.entity}
                            entityClass="entity"
                            onChange={this.onEntityChange} />
                    </Col>
                </FormGroup>
                <FormGroup controlId="dataExtensionProperty">
                    <Col componentClass={ControlLabel} sm={2}>Property:</Col>
                    <Col sm={10}>
                            <GenericInput
                                service={this.props.service}
                                placeholder="Property to fetch on the entity"
                                value={this.state.property}
                                entityClass="property"
                                onChange={this.onPropertyChange} />
                    </Col>
                </FormGroup>
                <FormGroup controlId="submitGroup">
                        <Col sm={10} />
                        <Col sm={2}>
                            <InputGroup>
                                <InputGroup.Button><Button onClick={this.resetQuery} type="submit" bsStyle="default">Reset</Button></InputGroup.Button>
                                <InputGroup.Button><Button onClick={this.submitQuery} type="submit" bsStyle="primary">Submit</Button></InputGroup.Button>
                            </InputGroup>
                        </Col>
                </FormGroup>
                <FormGroup controlId="proposeTypeGroup">
                    <Col componentClass={ControlLabel} sm={2}>Type:</Col>
                    <Col sm={7}>
                    <GenericInput
                                service={this.props.service}
                                placeholder="Type to fetch on the entity"
                                value={this.state.proposeTypeInput}
                                entityClass="type"
                                onChange={this.handleProposeTypeInput} /> 
                    </Col>
                    <Col sm={3}>
                        <Button onClick={this.openProposeWindow} bsStyle="info" disabled={!this.state.proposeTypeInput}>Propose</Button>
                    </Col>
                </FormGroup>
            </Form>
        </Col>
        <Col sm={3}>
            <JSONTree
                    theme={jsonTheme}
                    data={this.formulateQuery()}
                    getItemString={(type, data, itemType, itemString) => ''}
                    shouldExpandNode={(keyName, data, level) => true}
                    hideRoot={true} />
            <br />
            {this.renderResponseValidationErrors()}
        </Col>
        <Col sm={4}>
            {this.renderQueryResults()}
        </Col>

     </div>
    );
  }
}

