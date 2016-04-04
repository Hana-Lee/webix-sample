/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
/* eslint-env browser */

(function () {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
  );

  if ('serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
      .then(function (registration) {
        // Check to see if there's an updated version of service-worker.js with
        // new files to cache:
        // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-registration-update-method
        if (typeof registration.update === 'function') {
          registration.update();
        }

        // updatefound is fired if service-worker.js changes.
        registration.onupdatefound = function () {
          // updatefound is also fired the very first time the SW is installed,
          // and there's no need to prompt for a reload at that point.
          // So check here to see if the page is already controlled,
          // i.e. whether there's an existing service worker.
          if (navigator.serviceWorker.controller) {
            // The updatefound event implies that registration.installing is set:
            // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
            var installingWorker = registration.installing;

            installingWorker.onstatechange = function () {
              switch (installingWorker.state) {
                case 'installed':
                  // At this point, the old content will have been purged and the
                  // fresh content will have been added to the cache.
                  // It's the perfect time to display a "New content is
                  // available; please refresh." message in the page's interface.
                  break;

                case 'redundant':
                  throw new Error('The installing ' +
                    'service worker became redundant.');

                default:
                // Ignore
              }
            };
          }
        };
      }).catch(function (e) {
      console.error('Error during service worker registration:', e);
    });
  }

  window.makeValidator = function (type, source) {
    var baseValidator = {
      source : source,
      validate : function (value) {
        if (this._mandatory) {
          if (!webix.rules.isNotEmpty(value)) {
            webix.message({type : 'error', text : '빈값은 안됩니다' + source});
            return false;
          }
        }
        return true;
      },
      setMandatory : function (_mandatory) {
        this._mandatory = _mandatory;
      }
    };

    console.log(baseValidator, baseValidator.prototype);

    switch(source.config.view) {
      case 'formStringItem':
        var stringValidator = {};
        stringValidator.prototype = Object.create(baseValidator);
        console.log(stringValidator);
        stringValidator.validate = function (value) {
          console.log('base validator', stringValidator.setMandatory);
          if (!stringValidator.prototype.validate(value)) {
            return false;
          }
          if (value.length < 1) {
            webix.message({type : 'error', text : '입력값이 너무 작습니다'});
            return false;
          }
          return true;
        };
        var newValidator = Object.create(stringValidator);
        console.log('new validator', newValidator);
        return newValidator;
        break;
      case 'richselect':
        var validator = Object.create(baseValidator);
        validator.validate = function (value) {
          if (!validator.prototype.validate.call(this, value)) {
            return false;
          }
          if (value === 2) {
            webix.message({type : 'error', text : '2 는 선택 할 수 없습니다'});
            return false;
          }
          return true;
        };

        return validator;
        break;
    }
  };

  webix.protoUI({
    name : 'formBaseItem',
    $init : function () {
      this._b_setup_initial_data = false;
      this._o_value_object = undefined;
      this._b_value_object_changed = false;
      this._s_value_field = undefined;
      this._b_value_field_changed = false;
      this._o_mandatory = undefined;
      this._b_mandatory = false;
      this._b_mandatory_changed = false;
      this._o_input_editable = undefined;
      this._b_input_editable = false;
      this._b_input_editable_changed = false;
      this._o_edit_state = undefined;
      this._n_edit_state = 1;
      this._b_edit_state_changed = false;
      this._b_invalidate_properties_queue = false;
      this._b_validator_enabled = false;
    },
    f_base_init_on_ready : function () {
      this._f_register_default_event();
      this._f_invalidate_properties();
      this.config.name = this.config.id;
      if (this._b_mandatory && this._b_input_editable) {
        this._b_validator_enabled = true;
      }
    },
    _f_register_default_event : function () {
      this.attachEvent('onFocus', this._f_on_focus);
      this.attachEvent('onBlur', this._f_on_change);
      this.attachEvent('onDestruct', this._f_on_destruct);
      this.getFormView().attachEvent('onValidationSuccess', function () {
        console.log('validate success', arguments);
      });

      this.getFormView().attachEvent('onValidationError', function () {
        console.log('validate error', arguments);
      });
    },
    _f_on_focus : function () {
      this._s_old_value = this.getValue();
    },
    _f_on_change : function () {
      console.log('on change by blur event');
      var _b_validation_result, _s_input_value = this.getValue();

      if (this._b_validator_enabled) {
        // TODO 각각의 폼아이템에서 필요로 하는 validator 만들기
        _b_validation_result = this.validate();
        this._f_validate_result_handler({
          result : _b_validation_result,
          new_value : _s_input_value,
          old_value : this._s_old_value
        });

        if (!this._b_value_object_changed) {
          this._f_set_item_update_style();
        }
      }
    },
    _f_on_destruct : function () {
      if (this._o_value_object) {
        Object.unobserve(this._o_value_object, this._f_value_object_observe);
      }

      if (this._o_edit_state) {
        Object.unobserve(this._o_edit_state, this._f_edit_state_observe);
      }

      if (this._o_input_editable) {
        Object.unobserve(this._o_input_editable, this._f_input_editable_observe);
      }

      if (this._o_mandatory) {
        Object.unobserve(this._o_mandatory, this._f_mandatory_observe);
      }
    },
    _f_set_item_update_style : function () {
      console.log('fromBaseItem update style');
    },
    _f_invalidate_properties : function () {
      if (!this._b_invalidate_properties_queue) {
        this._b_invalidate_properties_queue = true;
        setTimeout(function () {
          this._f_commit_properties();
          this._b_invalidate_properties_queue = false;
        }.bind(this), 100);
      }
    },
    valueObject_setter : function (_o_value) {
      Object.observe(_o_value, this._f_value_object_observe.bind(this));
      this._o_value_object = _o_value;

      return _o_value;
    },
    _f_value_object_observe : function (_change_value) {
      this._o_value_object = _change_value[0].object;
      this._b_value_object_changed = true;
      this._b_setup_initial_data = true;
      this._f_invalidate_properties();
    },
    valueField_setter : function (_s_value) {
      this._b_value_field_changed = true;
      this._b_setup_initial_data = true;
      this._s_value_field = _s_value;

      return _s_value;
    },
    setValueField : function (_s_value) {
      if (this._s_value_field !== _s_value) {
        this._s_value_field = _s_value;
        this._b_value_field_changed = true;
        this._b_setup_initial_data = true;
        this._f_invalidate_properties();
      }
    },
    editState_setter : function (_o_value) {
      Object.observe(_o_value, this._f_edit_state_observe.bind(this));

      this._o_edit_state = _o_value;
      this._n_edit_state = _o_value.value;

      return _o_value;
    },
    _f_edit_state_observe : function (_change_value) {
      this._n_edit_state = _change_value[0].object.value;
      this._b_edit_state_changed = true;
      this._f_invalidate_properties();
    },
    inputEditable_setter : function (_d_value) {
      var _b_readonly;
      if (typeof _d_value === 'object') {
        Object.observe(_d_value, this._f_input_editable_observe.bind(this));
        this._o_input_editable = _d_value;
        _b_readonly = !_d_value.value;
      } else {
        _b_readonly = !_d_value;
      }

      this._b_input_editable = !_b_readonly;
      this.config.readonly = _b_readonly;
      this._f_invalidate_properties();

      return _d_value;
    },
    _f_input_editable_observe : function (_change_value) {
      this.setInputEditable(_change_value[0].object.value);
    },
    mandatory_setter : function (_d_value) {
      var _b_required;
      if (typeof _d_value === 'object') {
        Object.observe(_d_value, this._f_mandatory_observe.bind(this));
        this._o_mandatory = _d_value;
        _b_required = _d_value.value;
      } else {
        _b_required = _d_value;
      }

      this._b_mandatory = _b_required;
      this.config.required = _b_required;

      return _d_value;
    },
    _f_mandatory_observe : function (_change_value) {
      this._b_mandatory = _change_value[0].object.value;
      this._b_mandatory_changed = true;
      this._f_invalidate_properties();
    },
    isMandatory : function () {
      return this._b_mandatory;
    },
    getEditState : function () {
      return this._n_edit_state;
    },
    setEditState : function (_n_value) {
      this._n_edit_state = _n_value;
      this._b_edit_state_changed = true;

      this._f_invalidate_properties();
    },
    isInputEditable : function () {
      return this._b_input_editable;
    },
    setInputEditable : function (_b_value) {
      this._b_input_editable = _b_value;
      this._b_input_editable_changed = true;
      this._f_invalidate_properties();
    },
    _f_common_edit_state_change : function () {
      // if (this._n_edit_state === app.enums.editState.NONE) {
      //   this._n_edit_state = app.enums.editState.CREATE;
      // } else if (this._n_edit_state === app.enums.editState.INIT) {
      //   this._n_edit_state = app.enums.editState.UPDATE;
      // }
    },
    // TODO validator 만들어지면 validator 에서 처리하도록 함수 이동
    _f_show_error_message : function (_s_message) {
      webix.message({
        type : 'error', text : _s_message
      });
    }
  });

  webix.protoUI({
    name : 'formBooleanItem',
    $cssName : 'checkbox app-form-boolean-item',
    $init : function () {
      this.$ready.push(this._f_init_on_ready);
    },
    _f_init_on_ready : function () {
      this.f_base_init_on_ready();
    },
    _f_validate_result_handler : function (_m_result) {
      console.log('validate result', _m_result);
      if (_m_result.result) {
        this.callEvent('onDataChange', []);
      }
    },
    _f_commit_properties : function () {
      if (this._b_setup_initial_data) {
        if (this._o_value_object && this._s_value_field) {
          this.setValue(this._o_value_object[this._s_value_field]);
        }

        this._b_value_object_changed = false;
        this._b_value_field_changed = false;
        this._b_setup_initial_data = false;
      }
      if (this._b_input_editable_changed) {
        this._b_input_editable_changed = false;
        this.config.readonly = !this._b_input_editable;

        if (this._b_input_editable) {
          // TODO input style null 로 변경
          if (!this._b_validator_enabled) {
            this._b_validator_enabled = true;
          }
        } else {
          // TODO input style noEditable 로 변경
          if (this._b_validator_enabled) {
            this._b_validator_enabled = false;
          }
        }
      }
    }
  }, webix.ui.checkbox, webix.ui.formBaseItem);

  webix.protoUI({
    name : 'formStringItem',
    $cssName : 'text app-form-string-item',
    $init : function () {
      this.$ready.push(this._f_init_on_ready);
      this._b_display_as_password_changed = false;
      this._b_display_as_password = false;
    },
    _f_init_on_ready : function () {
      this.config.validate = makeValidator('string', this).validate;
      this.f_base_init_on_ready();
    },
    displayAsPassword_setter : function (_b_value) {
      this._b_display_as_password = _b_value;

      if (_b_value) {
        this.config.type = 'password';
      } else {
        this.config.type = 'text';
      }

      return _b_value;
    },
    setDisplayAsPassword : function (_b_value) {
      this._b_display_as_password_changed = true;
      this._b_display_as_password = _b_value;
      this._f_invalidate_properties();
    },
    maxLength_setter : function (_n_value) {
      this.setMaxLength(_n_value);

      return _n_value;
    },
    minLength_setter : function (_n_value) {
      this.setMinLength(_n_value);

      return _n_value;
    },
    setMaxLength : function (_n_value) {
      if (!this.config.attributes) {
        this.config.attributes = {};
      }
      this.config.attributes.maxlength = _n_value;
    },
    setMinLength : function (_n_value) {
      if (!this.config.attributes) {
        this.config.attributes = {};
      }
      this.config.attributes.minlength = _n_value;
    },
    _f_validate_result_handler : function (_m_result) {
      if (_m_result.result) {
        this._o_value_object[this._s_value_field] = _m_result.new_value;

        this._f_common_edit_state_change();

        this.callEvent('onDataChange', []);
      } else {
        // TODO 메세지를 띄우는것은 validator 가 할 일
        this._f_show_error_message('필수값 입력오류 입니다');
        // this.setValue(this._o_value_object[this._s_value_field]);
      }
    },
    _f_commit_properties : function () {
      if (this._b_display_as_password_changed) {
        this._b_display_as_password_changed = false;
        if (this._b_display_as_password) {
          this.config.type = 'password';
        } else {
          this.config.type = 'text';
        }
      }
      if (this._b_setup_initial_data) {
        if (this._o_value_object && this._s_value_field) {
          this.setValue(this._o_value_object[this._s_value_field]);
        }

        this._b_value_object_changed = false;
        this._b_value_field_changed = false;
        this._b_setup_initial_data = false;
      }
      if (this._b_input_editable_changed) {
        this._b_input_editable_changed = false;
        this.config.readonly = !this._b_input_editable;

        if (this._b_input_editable) {
          // TODO input style null 로 변경
          if (!this._b_validator_enabled) {
            this._b_validator_enabled = true;
          }
        } else {
          // TODO input style noEditable 로 변경
          if (this._b_validator_enabled) {
            this._b_validator_enabled = false;
          }
        }
      }

      if (this._b_mandatory_changed) {
        this._b_mandatory_changed = false;
        this.config.required = this._b_mandatory;
        // TODO validator required 설정
      }

      if (this._b_edit_state_changed) {
        this._b_edit_state_changed = false;
      }

      this.refresh();
    }
  }, webix.ui.text, webix.ui.formBaseItem);

  webix.protoUI({
    name : 'formNumberItem',
    $cssName : 'text app-form-number-item',
    $init : function () {
      this.$ready.push(this._f_init_on_ready);
    },
    _f_init_on_ready : function () {
      this.f_base_init_on_ready();
    },
    _f_validate_result_handler : function (_m_result) {
      if (_m_result.result) {
        // TODO number formatter 만들어서 적용 할 것
        this._o_value_object[this._s_value_field] = _m_result.new_value;

        this._f_common_edit_state_change();

        this.callEvent('onDataChange', []);
      } else {
        // TODO 메세지를 띄우는것은 validator 가 할 일
        this._f_show_error_message('입력오류 입니다');
        // TODO number formatter 만들어서 적용 할 것
        this.setValue(this._o_value_object[this._s_value_field]);
      }
    },
    _f_commit_properties : function () {
      if (this._b_setup_initial_data) {
        if (this._o_value_object && this._s_value_field) {
          this.setValue(this._o_value_object[this._s_value_field]);
        }

        this._b_value_object_changed = false;
        this._b_value_field_changed = false;
        this._b_setup_initial_data = false;
      }

      if (this._b_input_editable_changed) {
        this._b_input_editable_changed = false;
        this.config.readonly = !this._b_input_editable;

        if (this._b_input_editable) {
          // TODO input style null 로 변경
          if (!this._b_validator_enabled) {
            this._b_validator_enabled = true;
          }
        } else {
          // TODO input style noEditable 로 변경
          if (this._b_validator_enabled) {
            this._b_validator_enabled = false;
          }
        }
      }
    },
    maxValue_setter : function (_n_value) {
      this.setMaxValue(_n_value);

      return _n_value;
    },
    minValue_setter : function (_n_value) {
      this.setMinValue(_n_value);

      return _n_value;
    },
    setMaxValue : function (_n_value) {
      if (!this.config.attributes) {
        this.config.attributes = {};
      }
      this.config.attributes.max = _n_value;
    },
    setMinValue : function (_n_value) {
      if (!this.config.attributes) {
        this.config.attributes = {};
      }
      this.config.attributes.min = _n_value;
    }
  }, webix.ui.text, webix.ui.formBaseItem);

  webix.protoUI({
    name : 'FormSelectionItem',
    $cssName : 'richselect app-form-selection-item',
    $init : function () {
      this.$ready.push(this._f_init_on_ready);
    },
    _f_init_on_ready : function () {
      this.f_base_init_on_ready();
    },
    _f_validate_result_handler : function (_m_result) {
      console.log('validate result', _m_result);
      if (_m_result.result) {
        this.callEvent('onDataChange', []);
      }
    },
    _f_commit_properties : function () {
      console.log('commit properties', this);
    }
  }, webix.ui.richselect, webix.ui.formBaseItem);

  webix.ready(function () {
    webix.ui({
      type : 'space',
      container : document.getElementById('app'),
      width : 300,
      rows : [{
        view : 'form',
        elements : [{
          id : 'name-text',
          view : 'formStringItem',
          label : '이름',
          inputEditable : true,
          mandatory : true
        }, {
          id : 'name-text2',
          view : 'formStringItem',
          label : '이름',
          inputEditable : true,
          mandatory : true
        }, {
          view : 'richselect',
          name : 'richselect-3',
          label : '선택',
          value : 1,
          options : [{
            id : 1, value : '이하나'
          }, {
            id : 2, value : '구연경'
          }],
          validate : makeValidator('richselect', this).validate,
          on : {
            onChange : function () {
              this.validate();
            },
            onBlur : function () {
              this.validate();
              console.log('rich selector on blur', arguments, this.getValue());
            }
          }
        }, {
          view : 'button',
          type : 'form',
          on : {
            onItemClick : function () {
              if (!$$('name-text').validate()) {
                webix.message({type : 'error', text : '빈값은 안됨'});
              }
            }
          }
        }]
      }]
    });
  });
  // Your custom JavaScript goes here
})();
