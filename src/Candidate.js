import React from "react";
import { Badge, ListGroup } from "react-bootstrap";

export default class Candidate extends React.Component {
  get url() {
    let view = null;
    let manifest = this.props.manifest;
    if (
      "view" in manifest &&
      "url" in this.props.manifest.view &&
      "id" in this.props.candidate
    ) {
      view = this.props.manifest.view.url.replace(
        "{{id}}",
        this.props.candidate.id
      );
    }
    return view;
  }

  renderDescription() {
    const { candidate } = this.props;
    const description = candidate?.description;

    if (!description) return null;

    return (
      <div>
        <div className="candidateField">Description</div>
        <div className="candidateValue">{description}</div>
      </div>
    );
  }

  renderTypes() {
    const types = this.props.candidate?.type;
    if (!types) return null;

    return (
      <div>
        <div className="candidateField">Types</div>
        <div className="candidateValue">
          {types.map((type, idx) => (
            <span key={idx}>
              {idx > 0 && ", "}
              {type.id && type.id.includes("://") ? (
                <a href={type.id} target="_blank" rel="noopener noreferrer">
                  {type.name}
                </a>
              ) : (
                type.name
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  renderFeatures() {
    const features = this.props.candidate?.features;
    if (!features) return null;

    return (
      <div>
        {features.map((feature, idx) => (
          <div key={idx}>
            <div className="candidateField">Feature {feature.id}</div>
            <div className="candidateValue">{feature.value}</div>
          </div>
        ))}
      </div>
    );
  }

  render() {
    const { candidate } = this.props;

    return (
      <ListGroup.Item
        key={candidate.id}
        active={candidate.match}
      >
        <div className="d-flex w-100 justify-content-between">
          <h5 className="mb-1">{candidate.name}</h5>
          <Badge bg="primary">{candidate.score}</Badge>
        </div>
        <div>
          <div className="candidateField">ID</div>
          <div className="candidateValue">
            <a href={this.url}>{candidate.id}</a>
          </div>
          {this.renderDescription()}
          {this.renderTypes()}
          {this.renderFeatures()}
        </div>
      </ListGroup.Item>
    );
  }
}
