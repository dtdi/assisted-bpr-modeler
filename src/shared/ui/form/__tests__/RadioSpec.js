/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import { shallow } from 'enzyme';

import { Radio } from '..';


describe('<Radio>', function() {

  it('should render', function() {
    createRadio();
  });


  it('should check option', function() {

    // when
    const wrapper = createRadio({
      fieldMeta: {
        value: 'foo'
      },
      values: [
        {
          value: 'foo',
          label: 'bar'
        }
      ]
    });

    const checkedInput = wrapper.find('.custom-control-input');

    // then
    expect(checkedInput).to.have.length(1);
    expect(checkedInput.prop('checked')).to.be.true;
  });

});


// helpers ///////////////

function createRadio(options = {}) {

  const form = options.form || {
    getFieldMeta: () => {
      return options.fieldMeta || {};
    }
  };

  return shallow(<Radio
    field={ options.field || {} }
    form={ form }
    values={ options.values || [] }
  />);
}
