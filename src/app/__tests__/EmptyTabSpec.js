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

import {
  shallow
} from 'enzyme';

import EmptyTab from '../EmptyTab';

import Flags, { DISABLE_DMN } from '../../util/Flags';

/* global sinon */


describe('<EmptyTab>', function() {

  describe('disabling dmn', function() {

    afterEach(sinon.restore);

    it('should NOT display dmn diagram on flag', function() {

      // given
      sinon.stub(Flags, 'get').withArgs(DISABLE_DMN).returns(true);

      // when
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text() === 'DMN diagram').first().exists()).to.be.false;
    });


    it('should display dmn diagram without flag', function() {

      // given
      const {
        tree
      } = createEmptyTab();

      // then
      expect(tree.findWhere(
        wrapper => wrapper.text() === 'DMN diagram').first().exists()).to.be.true;
    });
  });

});


// helpers /////////////////////////////////////

function noop() {}

function createEmptyTab(options = {}, mountFn=shallow) {

  if (typeof options === 'function') {
    mountFn = options;
    options = {};
  }

  const tree = mountFn(
    <EmptyTab
      onAction={ options.onAction || noop }
      onShown={ options.onShown || noop }
    />
  );

  const instance = tree.instance();

  return {
    tree,
    instance
  };

}
