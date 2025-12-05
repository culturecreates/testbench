import React from 'react';
import { Alert, Tabs, Tab, Form, Button, Col, ListGroup } from 'react-bootstrap';
import ReconcileSuggest from './ReconcileSuggest.js';
import Candidate from './Candidate.js';
import GenericInput from './GenericInput.js';
import PreviewRenderer from './PreviewRenderer.js';
import DataExtensionTab from './DataExtensionTab.js';
import { JSONTree } from 'react-json-tree';
import { getSchema } from './JsonValidator.js';
import { jsonTheme } from './utils.js';
import PropertyMappingV2 from './PropertyMappingV2.js';
import PropertyPathInput from './PropertyPathInput.js';
import { Row } from 'react-bootstrap';

export default class TestBench extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
        reconQuery: '',
        reconType: 'no-type',
        reconCustomType: undefined,
        reconProperties: [],
        reconLimit: undefined,
        reconUserLanguage: 'en',
        reconResponseValidationErrors: [],
        previewEntityId : undefined
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps?.service?.endpoint !== this.props.service.endpoint) {
      this.formulateReconQuery();
    }
}

  onReconQueryChange = (e) => {
    this.setState({
        reconQuery: e.currentTarget.value
    });
  }

  onReconTypeChange = (e) => {
    this.setState({
        reconType: e.currentTarget.value
    });
  }

  onCustomTypeChange = (v) => {
    this.setState({
        reconCustomType: v
    });
  }

  onReconPropertiesChange = (values) => {
    this.setState({
        reconProperties: values
    });
  }

  onReconLimitChange = (e) => {
    this.setState({
        reconLimit: e.currentTarget.value
    });
  }

  onReconUserLanguageChange = (e) => {
    this.setState({
        reconUserLanguage: e.currentTarget.value
    });
  }

  onPreviewEntityChange = (value) => {
    this.setState({
        previewEntityId: value !== undefined ? value.id : undefined
    });
  };

  get defaultTypes() {
     if (this.props.service && this.props.service.manifest) {
        return this.props.service.manifest.defaultTypes || [];
    } else {
        return [];
    }
  }

  get hasTypeSuggest() {
     return (this.props.service &&
	     this.props.service.manifest &&
	     this.props.service.manifest.suggest &&
	     this.props.service.manifest.suggest.type);
  }

  get hasPropertySuggest() {
     return (this.props.service &&
	     this.props.service.manifest &&
	     this.props.service.manifest.suggest &&
	     this.props.service.manifest.suggest.property);
  }

  get hasPreviewService() {
     return (this.props.service &&
             this.props.service.manifest &&
             this.props.service.manifest.preview);
  } 

  get hasDataExtension() {
     return (this.props.service &&
             this.props.service.manifest &&
             this.props.service.manifest.extend);
  }

  onSubmitReconciliation = (e) => {
     e.preventDefault();
     if (!this.props.service || !this.props.service.endpoint) {
        return;
     }
     this.setState({reconResults: 'fetching'});
     let fetcher = this.props.service.postFetcher();
     let url = this.props.service.endpoint;
     url = `${url.replace(/\/$/, '')}/match`;
     fetcher({url,queries:JSON.stringify(this.formulateReconQuery()),userLanguage:this.state.reconUserLanguage})
        .then(result => result.json())
        .then(result =>
           this.setState({
              reconResults: result?.results?.[0]?.candidates?? [],
              reconResponseValidationErrors: this.validateServiceResponse('reconciliation-result-batch', result)
        }))
        .catch(e => {
            this.setState({
              reconError: e.message,
              reconResults: 'failed',
        })});
  }

  validateServiceResponse(schemaName, response) {
     let schema = getSchema(this.props.service.latestCompatibleVersion, schemaName);
     let valid = schema(response);
     if (!valid) {
        return schema.errors.map(error => error.dataPath+' '+error.message);
     } else {
        return [];
     }
  }

  renderQueryResults() {
     if (this.state.reconResults === 'fetching') {
        return (<div className="resultsPlaceholder">Querying the service...</div>);
     } else if (this.state.reconResults === 'failed') {
        return (<div className="resultsPlaceholder">Error: {this.state.reconError}</div>);
     } else if (this.state.reconResults === undefined) {
        return (<div />);
     } else {
        if (this.state.reconResults.length === 0) {
           return (<span className="noResults">No results</span>);
        }
        return (
          <ListGroup>
            {this.state.reconResults.map(result =>
              <Candidate candidate={result} manifest={this.props.service.manifest} />
            )}
          </ListGroup>
        );
     }
  }

  renderReconResponseValidationErrors() {
    if (this.state.reconResponseValidationErrors.length === 0) {
        return (<div />);
    } else {
        return (<Alert bsStyle="warning">
           <strong>Validations error for reconcilation response</strong>
           <ul>
           {this.state.reconResponseValidationErrors.map((error, idx) => 
              <li key={idx}>{error}</li>
           )}
          </ul>
        </Alert>);
    }
  }

  renderManifestValidationErrors() {
     let manifest = this.props.service.manifest;
     let errors = this.validateServiceResponse('manifest', manifest);
     if (errors.length === 0) {
        return (<div />);
     } else {
        return (<Alert bsStyle="warning">
           <strong>Validation errors for service manifest</strong>
           <ul>
                {errors.map((error, idx) =>
                  (<li key={idx}>{error}</li>))}
           </ul>
        </Alert>);
     }
  }

  formulateReconQuery() {
    const isCustomType = this.state.reconType === "custom-type" && this.state.reconCustomType !== undefined;
    const isNotNoType = this.state.reconType !== "no-type";
    const hasReconProperties = this.state.reconProperties.length > 0;
    const reconLimit = parseInt(this.state.reconLimit);
    const isLimitValid = !isNaN(reconLimit);

    const buildConditions = () => {
      let conditions =
        this.state.reconQuery && this.state.reconQuery.trim() !== ""
          ? [{ matchType: "name", propertyValue: this.state.reconQuery }]
          : [];

      if (hasReconProperties) {
        const properties = this.state.reconProperties
          .filter((m) => m && m.property && m.value)
          .map((m) => {
            const allValues = [m.value];

            if (m.additionalValues && m.additionalValues?.length > 0) {
              const validAdditionalValues = m.additionalValues.filter(
                (additionalValue) =>
                  additionalValue && additionalValue.trim() !== ""
              );
              allValues.push(...validAdditionalValues);
            }

            const propertyCondition = {
              matchType: "property",
              propertyId: m.property?.id || m.property,
              propertyValue: allValues?.length === 1 ? allValues[0] : allValues,
              required: m.required || false,
              matchQuantifier: m.operator || "any",
              matchQualifier:undefined
            };

            if (m?.qualifier) {
              propertyCondition.matchQualifier = m.qualifier?.id ?? m.qualifier;
            }

            return propertyCondition;
          });

        conditions = conditions.concat(properties);
      }

      return conditions;
    };
        return {
            queries: [{
                ...(isCustomType ? { type: this.state.reconCustomType.id } : isNotNoType ? { type: this.state.reconType } : {}),
                ...(isLimitValid && { limit: Number(this.state.reconLimit) }),
                conditions: buildConditions()
              }]
        };
     
  
}

  formulateQueryUrl() {
     let baseUrl = this.props.service.endpoint;
     if (!baseUrl) {
        return '#';
     }
     
    baseUrl = `${baseUrl.replace(/\/$/, '')}/match`;

     let params = {
        queries: JSON.stringify( this.formulateReconQuery())
     };
     let url = new URL(baseUrl);
     Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
     return url.toString();
  }

  renderTypeChoices() {
    let current = this.state.reconType;
    let choices = this.defaultTypes.map(t =>
       <Form.Check type="radio"
          name="reconcileType"
          key={"key_"+t.id}
          value={t.id}
          checked={current === t.id}
          onChange={this.onReconTypeChange}>
        {t.name}<br />
        {Array.isArray(t.broader) && t.broader.length > 0 && <span className="reconTypeId">{t.broader.map(e => e.id).join(', ')} &gt; </span>}<span className="reconTypeId">{t.id}</span>
      </Form.Check>
    );
    if (this.hasTypeSuggest) {
       choices.push(<Form.Check type="radio"
         name="reconcileType"
         key="custom-type"
         value="custom-type"
         checked={current === 'custom-type'}
         onChange={this.onReconTypeChange}>
           Custom:
           <div>
             <ReconcileSuggest
                service={this.props.service}
                entityClass="type"
                id="recon-custom-type-suggest"
                value={this.state.reconCustomType}
                onChange={this.onCustomTypeChange} />
           </div>
        </Form.Check>);
    }
    choices.push(<Form.Check type="radio"
        name="reconcileType"
        key="no-type"
        value="no-type"
        checked={current === 'no-type'}
        onChange={this.onReconTypeChange}>Reconcile against no particular type</Form.Check>);
    return choices;
  }

  render() {
    return (
       <div>
        {this.renderManifestValidationErrors()}
        <Tabs defaultActiveKey="reconcile" animation={false} id="test-bench-tabs">
            <Tab eventKey="reconcile" title="Match">
                <div className="tabContent">
                <Col sm={5}>
                    <Form horizontal>
                        <Form.Group controlId={"conditions"}>
                            <Col componentClass={Form.Label} sm={2}>{"Conditions:"}</Col>
                           <Col sm={10}>
                           <Row>
                            <Col>
                                <Form.Control
                                    type="text"
                                    placeholder={"Name"}
                                    value={this.state.reconQuery}
                                    onChange={this.onReconQueryChange} />

                                    
                            
                        <PropertyMappingV2
                          service={this.props.service}
                          value={this.state.reconProperties}
                          onChange={this.onReconPropertiesChange}
                        />
                            </Col>
                            </Row>
                            </Col>
                        </Form.Group>
                            
                        <Form.Group controlId="reconcileType">
                            <Col componentClass={Form.Label} sm={2}>Type:</Col>
                            <Col sm={10}>
                                {this.renderTypeChoices()}
                            </Col>
                        </Form.Group>


                        <Form.Group controlId="reconcileLimit">
                            <Col componentClass={Form.Label} sm={2}>Limit:</Col>
                            <Col sm={10}>
                            <Form.Control
                                    type="number"
                                    placeholder="Maximum number of candidates"
                                    value={this.state.reconLimit}
                                    onChange={(v) => this.onReconLimitChange(v)} />
                            </Col>
                        </Form.Group>
                        <Form.Group controlId="reconUserLanguage" style={{ display: "flex",alignItems: "flex-end" }}>
                            <Col sm={2} componentClass={Form.Label}>User interface language:</Col>
                            <Col sm={10}>
                            <Form.Control
                                    type="text"
                                    placeholder="Enter the language of the intended audience"
                                    value={this.state.reconUserLanguage}
                                    onChange={(v) => this.onReconUserLanguageChange(v)} />
                            </Col>
                        </Form.Group>

                     <Col sm={3} smOffset={5}> <Button onClick={this.onSubmitReconciliation} type="submit" bsStyle="primary" disabled={!this.props.service}>Reconcile</Button></Col>
                        
                    </Form>
                </Col>
                <Col sm={3}>
                    <JSONTree
                            theme={jsonTheme}
                            data={this.formulateReconQuery()}
                            getItemString={(type, data, itemType, itemString) => ''}
                            shouldExpandNode={(keyName, data, level) => true}
                            hideRoot={true} />
                    <br />
                    <a href={this.formulateQueryUrl()} title="See query results on the service" target="_blank" rel="noopener noreferrer">View query results on the service</a>
                    {this.renderReconResponseValidationErrors()}
                </Col>
                <Col sm={4}>
                    {this.renderQueryResults()}
                </Col>
                </div>
            </Tab>
            <Tab eventKey="suggest" title="Suggest">
                <div className="tabContent">
                <Form horizontal>
                    <Form.Group controlId="suggestEntityTestBench">
                        <Col componentClass={Form.Label} sm={1}>Entity:</Col>
                        <Col sm={11}>
                            <ReconcileSuggest service={this.props.service} entityClass="entity" id="entity-suggest-test" />
                        </Col>
                    </Form.Group>
                    <Form.Group controlId="suggestTypeTestBench">
                        <Col componentClass={Form.Label} sm={1}>Type:</Col>
                        <Col sm={11}>
                            <ReconcileSuggest service={this.props.service} entityClass="type" id="type-suggest-test" />
                        </Col>
                    </Form.Group>
                    <Form.Group controlId="suggestPropertyTestBench">
                        <Col componentClass={Form.Label} sm={1}>Property:</Col>
                        <Col sm={11}>
                            <PropertyPathInput service={this.props.service} id="property-suggest-test" />
                        </Col>
                    </Form.Group>
                </Form>
                </div>
            </Tab>
            <Tab eventKey="preview" title="Preview" disabled={!this.hasPreviewService}>
            <div className="tabContent">
                {(this.hasPreviewService ?
                  <div>
                    <Form horizontal>
                        <Form.Group controlId="suggestEntityTestBench">
                            <Col componentClass={Form.Label} sm={1}>Entity:</Col>
                            <Col sm={11}>
                                <GenericInput service={this.props.service} entityClass="entity" id="entity-input-preview" explicitSubmit onChange={this.onPreviewEntityChange} />
                            </Col>
                        </Form.Group>
                    </Form>
                    <PreviewRenderer id={this.state.previewEntityId} settings={this.props.service.manifest.preview} />
                 </div>
                 : <p>Previewing is not supported by the service.</p>)}
            </div>
            </Tab>
            <Tab eventKey="extend" title="Extend" disabled={!this.hasDataExtension}>
            <div className="tabContent">
                {(this.hasDataExtension ?
                    <DataExtensionTab service={this.props.service} />
                 : <p>Data extension is not supported by the service.</p>)}
            </div>
            </Tab>
        </Tabs>
       </div>
    );
  }
}