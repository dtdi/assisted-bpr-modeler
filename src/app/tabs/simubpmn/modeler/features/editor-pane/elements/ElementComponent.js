import React, { Component } from "react";
import { ModdleContext } from "./context";

export default class ElementComponent extends Component {
  constructor(props) {
    super(props);
  }

  _getProperty(property, type) {
    const moddle = this.context;

    if (!type) {
      type = this.elemStr;
    }

    if (!property) {
      return moddle.getTypeDescriptor(type);
    }
    const Type = moddle.getType(type);
    return moddle.getPropertyDescriptor(Type, property);
  }

  _getDescr(property, type) {
    return this._getMetaProp(property, type, "description");
  }

  _getMetaProp(property, type, value) {
    const meta = this._getProperty(property, type)?.meta || {};
    return meta[value] || null;
  }

  _getName(property, type) {
    return (
      this._getProperty(property, type)?.meta?.displayName ||
      property // insert a space before all caps
        .replace(/([A-Z])/g, " $1")
        // uppercase the first character
        .replace(/^./, function (str) {
          return str.toUpperCase();
        })
    );
  }
}

ElementComponent.contextType = ModdleContext;
