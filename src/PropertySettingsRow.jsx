import React from 'react';
import FormControl from 'react-bootstrap/lib/FormControl';
import Button from 'react-bootstrap/lib/Button';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import PropertyPathInput from './PropertyPathInput';

export default class PropertySettingsRow extends React.Component {
  onContentChange = (e) => {
    if (this.props.onChange) {
      this.props.onChange(this.props.index, 'settings.content', e.target.value);
    }
  };

  onPropertyChange = (propertyValue) => {
    if (this.props.onChange) {
      this.props.onChange(this.props.index, 'id', propertyValue);
    }
  };

  onDelete = () => {
    if (this.props.onDelete) {
      this.props.onDelete(this.props.index);
    }
  };

  render() {
    const { index, property, service } = this.props;
    const content = property?.settings?.content || 'literal';

    return (
      <div key={index} className="mapping-card" style={{ marginBottom: "20px", border: "1px solid #e0e0e0", borderLeft: "3px solid #e0e0e0", padding: "15px", position: "relative" }}>
        <Button
          onClick={this.onDelete}
          bsStyle="link"
          title="Delete property"
          style={{ position: "absolute", top: "0", right: "0", padding: "8px", color: "#9ca3af" }}
        >
          <span className="glyphicon glyphicon-remove"></span>
        </Button>

        <div style={{ marginBottom: "10px", paddingRight: "30px" }}>
          <PropertyPathInput
            service={service}
            id={"dataExtensionProperty-" + index}
            value={property?.id}
            onChange={this.onPropertyChange}
          />
        </div>

        <div style={{ marginLeft: "20px" }}>
          <ControlLabel htmlFor={"dataExtensionContent-" + index} style={{ fontSize: "12px", color: "#666" }}>Content:</ControlLabel>
          <FormControl
            id={"dataExtensionContent-" + index}
            componentClass="select"
            value={content}
            onChange={this.onContentChange}
            style={{ width: "120px" }}
          >
            <option value="literal">literal</option>
            <option value="id">id</option>
            <option value="expand">expand</option>
          </FormControl>
        </div>
      </div>
    );
  }
}