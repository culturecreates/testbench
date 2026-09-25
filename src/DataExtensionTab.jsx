import React from 'react';
import Form from 'react-bootstrap/lib/Form';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import FormControl from 'react-bootstrap/lib/FormControl';
import InputGroup from 'react-bootstrap/lib/InputGroup';
import Button from 'react-bootstrap/lib/Button';
import Col from 'react-bootstrap/lib/Col';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import ListGroup from 'react-bootstrap/lib/ListGroup';
import GenericInput from './GenericInput';
import PropertyPathInput from './PropertyPathInput';
import DataExtensionValue from './DataExtensionValue';
import JSONTree from 'react-json-tree';
import {jsonTheme} from './utils';
import { getSchema } from './JsonValidator';

export default class DataExtensionTab extends React.Component {

  constructor() {
      super();
      this.state = {
        entity: undefined,
        property: undefined,
        contentSetting: 'literal',
        proposeType: undefined,
        extendResults: undefined,
        validationErrors: []
      };
  }

  componentDidUpdate(prevProps) {
      if (prevProps.service !== this.props.service && this.state.proposeType !== undefined) {
          this.setState({proposeType: undefined});
      }
  }

  onProposeTypeChange = (e) => {
      this.setState({proposeType: e.target.value});
  }

  proposeTypeName(id) {
      if (/^[A-Za-z][\w.-]*:(?!\/\/)/.test(id)) {
          return id.substring(id.indexOf(':') + 1);
      }
      return id;
  }

  formulateProposeUrl() {
      if (!this.state.proposeType) {
          return null;
      }
      const extend = (this.props.service.manifest && this.props.service.manifest.extend) || {};
      let base;
      const propose = extend.propose_properties;
      if (propose && (propose.service_url || propose.service_path)) {
          base = (propose.service_url || '') + (propose.service_path || '');
      } else if (this.props.service.endpoint) {
          try {
              base = new URL(this.props.service.endpoint).origin + '/extend/propose';
          } catch (e) {
              return null;
          }
      } else {
          return null;
      }
      try {
          const url = new URL(base, this.props.service.endpoint);
          url.searchParams.set('type', this.state.proposeType);
          return url.toString();
      } catch (e) {
          return null;
      }
  }

  openProposeWindow = (e) => {
      e.preventDefault();
      const url = this.formulateProposeUrl();
      if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
      }
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

  formulateQuery() {
      if (this.state.entity !== undefined && this.state.property !== undefined) {
          return {
            ids: [this.state.entity.id],
            properties: [{id: this.state.property.id}]
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
        let fetcher = this.props.service.getFetcher();
        fetcher(this.formulateQueryUrl(), {timeout: 20000})
           .then(result => result.json())
           .then(result =>
               this.setState({
                  extendResults: result,
                  validationErrors: this.validateServiceResponse(result)
               })
           )
           .catch(e => {
              this.setState({
                                extendResults: 'failed',
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
             if (this.state.extendResults.rows === undefined) {
                  return (<span className="resultsPlaceholder">No <code>rows</code> attribute in the response.</span>);
             }
             if (this.state.extendResults.rows[this.state.entity.id] === undefined) {
                  return (<span className="resultsPlaceholder">Missing <code>rows.{this.state.entity.id}</code> object in the response.</span>);
             }
             if (this.state.extendResults.rows[this.state.entity.id][this.state.property.id] === undefined) {
                  return (<span className="resultsPlaceholder">Missing <code>rows.{this.state.entity.id}{this.state.property.id}</code> object in the response.</span>);
             }
             const values = this.state.extendResults.rows[this.state.entity.id][this.state.property.id];
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
                <FormGroup controlId="dataExtensionProposeType">
                    <Col componentClass={ControlLabel} sm={2}>Class:</Col>
                    <Col sm={10}>
                        <InputGroup>
                            <FormControl
                                componentClass="select"
                                value={this.state.proposeType || ''}
                                onChange={this.onProposeTypeChange}>
                                <option value="" disabled>Select a class…</option>
                                {((this.props.service.manifest && this.props.service.manifest.defaultTypes) || []).map(t =>
                                    <option key={t.id} value={this.proposeTypeName(t.id)}>{t.name || t.id}</option>)}
                            </FormControl>
                            <InputGroup.Button>
                                <Button
                                    bsStyle="default"
                                    disabled={!this.formulateProposeUrl()}
                                    onClick={this.openProposeWindow}>View proposed properties</Button>
                            </InputGroup.Button>
                        </InputGroup>
                    </Col>
                </FormGroup>
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
                            <PropertyPathInput
                                service={this.props.service}
                                id="data-extension-property"
                                value={this.state.property}
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
            </Form>
        </Col>
        <Col sm={3}>
            <JSONTree
                    theme={jsonTheme}
                    data={this.formulateQuery()}
                    getItemString={() => ''}
                    shouldExpandNode={() => true}
                    hideRoot={true} />
            <br />
            <a href={this.formulateQueryUrl()} title="See query results on the service" target="_blank" rel="noopener noreferrer">View query results on the service</a>
            {this.renderResponseValidationErrors()}
        </Col>
        <Col sm={4}>
            {this.renderQueryResults()}
        </Col>

     </div>
    );
  }
}

