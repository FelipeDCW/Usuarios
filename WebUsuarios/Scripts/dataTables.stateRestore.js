/*! StateRestore 1.0.0
 * 2019-2020 SpryMedia Ltd - datatables.net/license
 */
(function () {
    'use strict';

    var $$1;
    var dataTable$1;
    function setJQuery$1(jq) {
        $$1 = jq;
        dataTable$1 = jq.fn.dataTable;
    }
    var StateRestore = /** @class */ (function () {
        function StateRestore(settings, opts, identifier, state, isPreDefined) {
            if (state === void 0) { state = undefined; }
            if (isPreDefined === void 0) { isPreDefined = false; }
            // Check that the required version of DataTables is included
            if (!dataTable$1 || !dataTable$1.versionCheck || !dataTable$1.versionCheck('1.10.0')) {
                throw new Error('StateRestore requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            // eslint-disable-next-line no-extra-parens
            if (!dataTable$1.Buttons) {
                throw new Error('StateRestore requires Buttons');
            }
            var table = new dataTable$1.Api(settings);
            this.classes = $$1.extend(true, {}, StateRestore.classes);
            // Get options from user
            this.c = $$1.extend(true, {}, StateRestore.defaults, opts);
            this.s = {
                dt: table,
                identifier: identifier,
                isPreDefined: isPreDefined,
                savedState: null
            };
            this.dom = {
                background: $$1('<div class="' + this.classes.background + '"/>'),
                confirmation: $$1('<div class="' + this.classes.confirmation + '"/>'),
                confirmationTitleRow: $$1('<div class="' + this.classes.confirmationTitleRow + '"></div>'),
                dtContainer: $$1(this.s.dt.table().container()),
                duplicateError: $$1('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError) +
                    '</span>'),
                emptyError: $$1('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError) +
                    '</span>'),
                removeContents: $$1('<div class="' + this.classes.confirmationText + '"><span>' +
                    this.s.dt
                        .i18n('stateRestore.removeConfirm', this.c.i18n.removeConfirm)
                        .replace(/%s/g, this.s.identifier) +
                    '</span></div>'),
                removeError: $$1('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.removeError', this.c.i18n.removeError) +
                    '</span>'),
                removeTitle: $$1('<h2 class="' + this.classes.confirmationTitle + '">' +
                    this.s.dt.i18n('stateRestore.removeTitle', this.c.i18n.removeTitle) +
                    '</h2>'),
                renameContents: $$1('<div class="' + this.classes.confirmationText + ' ' + this.classes.renameModal + '">' +
                    '<label class="' + this.classes.confirmationMessage + '">' +
                    this.s.dt
                        .i18n('stateRestore.renameLabel', this.c.i18n.renameLabel)
                        .replace(/%s/g, this.s.identifier) +
                    '</label>' +
                    '</div>'),
                renameInput: $$1('<input class="' + this.classes.input + '" type="text"></input>'),
                renameTitle: $$1('<h2 class="' + this.classes.confirmationTitle + '">' +
                    this.s.dt.i18n('stateRestore.renameTitle', this.c.i18n.renameTitle) +
                    '</h2>')
            };
            // When a StateRestore instance is created the current state of the table should also be saved.
            this.save(state);
        }
        /**
         * Removes a state from storage and then triggers the dtsr-remove event
         * so that the StateRestoreCollection class can remove it's references as well.
         *
         * @param skipModal Flag to indicate if the modal should be skipped or not
         */
        StateRestore.prototype.remove = function (skipModal) {
            var _a;
            var _this = this;
            if (skipModal === void 0) { skipModal = false; }
            // Check if removal of states is allowed
            if (!this.c.remove) {
                return false;
            }
            var removeFunction;
            var ajaxData = {
                action: 'remove',
                stateRestore: (_a = {},
                    _a[this.s.identifier] = this.s.savedState,
                    _a)
            };
            // If the remove is not happening over ajax remove it from local storage and then trigger the event
            if (!this.c.ajax) {
                removeFunction = function () {
                    try {
                        localStorage.removeItem('DataTables_stateRestore_' + _this.s.identifier + '_' + location.pathname);
                        _this.dom.confirmation.trigger('dtsr-remove');
                    }
                    catch (e) {
                        return 'remove';
                    }
                    return true;
                };
            }
            // Ajax property has to be a string, not just true
            // Also only want to save if the table has been initialised and the states have been loaded in
            else if (typeof this.c.ajax === 'string' && this.s.dt.settings()[0]._bInitComplete) {
                removeFunction = function () {
                    _this.dom.confirmation.trigger('dtsr-remove');
                    $$1.ajax({
                        data: ajaxData,
                        type: 'POST',
                        url: _this.c.ajax
                    });
                    return true;
                };
            }
            else if (typeof this.c.ajax === 'function') {
                removeFunction = function () {
                    _this.dom.confirmation.trigger('dtsr-remove');
                    if (typeof _this.c.ajax === 'function') {
                        _this.c.ajax.call(_this.s.dt, ajaxData);
                    }
                    return true;
                };
            }
            // If the modal is to be skipped then remove straight away
            if (skipModal) {
                this.dom.confirmation.appendTo(this.dom.dtContainer);
                $$1(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
                removeFunction();
                this.dom.confirmation.remove();
            }
            // Otherwise display the modal
            else {
                this._newModal(this.dom.removeTitle, this.s.dt.i18n('stateRestore.removeSubmit', this.c.i18n.removeSubmit), removeFunction, this.dom.removeContents);
            }
            return true;
        };
        /**
         * Compares the state held within this instance with a state that is passed in
         *
         * @param state The state that is to be compared against
         * @returns boolean indicating if the states match
         */
        StateRestore.prototype.compare = function (state) {
            // Order
            if (!this.c.saveState.order) {
                state.order = undefined;
            }
            // Search
            if (!this.c.saveState.search) {
                state.search = undefined;
            }
            // Columns
            if (this.c.saveState.columns && state.columns) {
                for (var i = 0, ien = state.columns.length; i < ien; i++) {
                    // Visibility
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.visible) {
                        state.columns[i].visible = undefined;
                    }
                    // Search
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.search) {
                        state.columns[i].search = undefined;
                    }
                }
            }
            else if (!this.c.saveState.columns) {
                state.columns = undefined;
            }
            // SearchBuilder
            if (!this.c.saveState.searchBuilder) {
                state.searchBuilder = undefined;
            }
            // SearchPanes
            if (!this.c.saveState.searchPanes) {
                state.searchPanes = undefined;
            }
            // Select
            if (!this.c.saveState.select) {
                state.select = undefined;
            }
            // ColReorder
            if (!this.c.saveState.colReorder) {
                state.ColReorder = undefined;
            }
            // Scroller
            if (!this.c.saveState.scroller) {
                state.scroller = undefined;
                if (dataTable$1.Scroller !== undefined) {
                    state.start = 0;
                }
            }
            // Paging
            if (!this.c.saveState.paging) {
                state.start = 0;
            }
            // Need to delete properties that we do not want to compare
            delete state.time;
            var copyState = this.s.savedState;
            delete copyState.time;
            delete copyState.c;
            delete copyState.stateRestore;
            // Perform a deep compare of the two state objects
            return this._deepCompare(state, copyState);
        };
        /**
         * Removes all of the dom elements from the document
         */
        StateRestore.prototype.destroy = function () {
            Object.values(this.dom).forEach(function (node) { return node.off().remove(); });
        };
        /**
         * Loads the state referenced by the identifier from storage
         *
         * @param state The identifier of the state that should be loaded
         * @returns the state that has been loaded
         */
        StateRestore.prototype.load = function () {
            var _this = this;
            var loadedState = this.s.savedState;
            var settings = this.s.dt.settings()[0];
            // Always want the states stored here to be loaded in - regardless of when they were created
            loadedState.time = +new Date();
            settings.oLoadedState = $$1.extend(true, {}, loadedState);
            // Click on a background if there is one to shut the collection
            $$1('div.dt-button-background').click();
            // Call the internal datatables function to implement the state on the table
            $$1.fn.dataTable.ext.oApi._fnImplementState(settings, loadedState, function () {
                _this.s.dt.draw(false);
            });
            return loadedState;
        };
        /**
         * Shows a modal that allows a state to be renamed
         *
         * @param newIdentifier Optional. The new identifier for this state
         */
        StateRestore.prototype.rename = function (newIdentifier, currentIdentifiers) {
            var _this = this;
            if (newIdentifier === void 0) { newIdentifier = null; }
            // Check if renaming of states is allowed
            if (!this.c.rename) {
                return;
            }
            var renameFunction = function () {
                var _a;
                if (newIdentifier === null) {
                    var tempIdentifier = $$1('input.' + _this.classes.input.replace(/ /g, '.')).val();
                    if (tempIdentifier.length === 0) {
                        return 'empty';
                    }
                    else if (currentIdentifiers.includes(tempIdentifier)) {
                        return 'duplicate';
                    }
                    else {
                        newIdentifier = tempIdentifier;
                    }
                }
                var ajaxData = {
                    action: 'rename',
                    stateRestore: (_a = {},
                        _a[_this.s.identifier] = newIdentifier,
                        _a)
                };
                if (!_this.c.ajax) {
                    try {
                        localStorage.removeItem('DataTables_stateRestore_' + _this.s.identifier + '_' + location.pathname);
                    }
                    catch (e) {
                        return false;
                    }
                }
                else if (typeof _this.c.ajax === 'string' && _this.s.dt.settings()[0]._bInitComplete) {
                    _this.dom.confirmation.trigger('dtsr-rename');
                    $$1.ajax({
                        data: ajaxData,
                        type: 'POST',
                        url: _this.c.ajax
                    });
                }
                else if (typeof _this.c.ajax === 'function') {
                    _this.dom.confirmation.trigger('dtsr-rename');
                    _this.c.ajax.call(_this.s.dt, ajaxData);
                }
                _this.s.identifier = newIdentifier;
                _this.dom.removeContents = $$1('<div class="' + _this.classes.confirmationText + '"><span>' +
                    _this.s.dt
                        .i18n('stateRestore.removeConfirm', _this.c.i18n.removeConfirm)
                        .replace(/%s/g, _this.s.identifier) +
                    '</span></div>');
                _this.save(_this.s.savedState, false);
                _this.dom.confirmation.trigger('dtsr-rename');
                return true;
            };
            // Check if a new identifier has been provided, if so no need for a modal
            if (newIdentifier !== null) {
                if (currentIdentifiers.includes(newIdentifier)) {
                    throw new Error(this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError));
                }
                else if (newIdentifier.length === 0) {
                    throw new Error(this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError));
                }
                else {
                    this.dom.confirmation.appendTo(this.dom.dtContainer);
                    $$1(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
                    renameFunction();
                    this.dom.confirmation.remove();
                }
            }
            else {
                this.dom.renameInput.val(this.s.identifier);
                this.dom.renameContents.append(this.dom.renameInput);
                this._newModal(this.dom.renameTitle, this.s.dt.i18n('stateRestore.renameButton', this.c.i18n.renameButton), renameFunction, this.dom.renameContents);
            }
        };
        /**
         * Saves the tables current state using the identifier that is passed in.
         *
         * @param state Optional. If provided this is the state that will be saved rather than using the current state
         */
        StateRestore.prototype.save = function (state, callAjax) {
            var _a;
            if (callAjax === void 0) { callAjax = true; }
            // Check if saving states is allowed
            if (!this.c.save) {
                return;
            }
            // this.s.dt.state.save();
            var savedState;
            // If no state has been provided then create a new one from the current state
            this.s.dt.state.save();
            if (state === undefined) {
                savedState = this.s.dt.state();
            }
            else {
                savedState = state;
            }
            savedState.stateRestore = {
                isPreDefined: this.s.isPreDefined,
                state: this.s.identifier
            };
            this.s.savedState = savedState;
            // Order
            if (!this.c.saveState.order) {
                this.s.savedState.order = undefined;
            }
            // Search
            if (!this.c.saveState.search) {
                this.s.savedState.search = undefined;
            }
            // Columns
            if (this.c.saveState.columns && this.s.savedState.columns) {
                for (var i = 0, ien = this.s.savedState.columns.length; i < ien; i++) {
                    // Visibility
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.visible) {
                        this.s.savedState.columns[i].visible = undefined;
                    }
                    // Search
                    if (typeof this.c.saveState.columns !== 'boolean' && !this.c.saveState.columns.search) {
                        this.s.savedState.columns[i].search = undefined;
                    }
                }
            }
            else if (!this.c.saveState.columns) {
                this.s.savedState.columns = undefined;
            }
            // SearchBuilder
            if (!this.c.saveState.searchBuilder) {
                this.s.savedState.searchBuilder = undefined;
            }
            // SearchPanes
            if (!this.c.saveState.searchPanes) {
                this.s.savedState.searchPanes = undefined;
            }
            // Select
            if (!this.c.saveState.select) {
                this.s.savedState.select = undefined;
            }
            // ColReorder
            if (!this.c.saveState.colReorder) {
                this.s.savedState.ColReorder = undefined;
            }
            // Scroller
            if (!this.c.saveState.scroller) {
                this.s.savedState.scroller = undefined;
                if (dataTable$1.Scroller !== undefined) {
                    this.s.savedState.start = 0;
                }
            }
            // Paging
            if (!this.c.saveState.paging) {
                this.s.savedState.start = 0;
            }
            this.s.savedState.c = this.c;
            var ajaxData = {
                action: 'save',
                stateRestore: (_a = {},
                    _a[this.s.identifier] = this.s.savedState,
                    _a)
            };
            if (!this.c.ajax) {
                try {
                    localStorage.setItem('DataTables_stateRestore_' + this.s.identifier + '_' + location.pathname, JSON.stringify(this.s.savedState));
                    this.dom.confirmation.trigger('dtsr-save');
                }
                catch (e) {
                    return;
                }
            }
            else if (typeof this.c.ajax === 'string' && this.s.dt.settings()[0]._bInitComplete) {
                this.dom.confirmation.trigger('dtsr-save');
                $$1.ajax({
                    data: ajaxData,
                    type: 'POST',
                    url: this.c.ajax
                });
            }
            else if (typeof this.c.ajax === 'function') {
                this.dom.confirmation.trigger('dtsr-save');
                if (callAjax) {
                    this.c.ajax.call(this.s.dt, ajaxData);
                }
            }
        };
        /**
         * Performs a deep compare of two state objects, returning true if they match
         *
         * @param state1 The first object to compare
         * @param state2 The second object to compare
         * @returns boolean indicating if the objects match
         */
        StateRestore.prototype._deepCompare = function (state1, state2) {
            // Put keys and states into arrays as this makes the later code easier to work
            var states = [state1, state2];
            var keys = [Object.keys(state1).sort(), Object.keys(state2).sort()];
            // We want to remove any private properties within the states
            for (var i = 0; i < keys[0].length; i++) {
                if (keys[0][i].indexOf('_') === 0) {
                    keys[0].splice(i, 1);
                    i--;
                }
            }
            for (var i = 0; i < keys[1].length; i++) {
                if (keys[1][i].indexOf('_') === 0) {
                    keys[1].splice(i, 1);
                    i--;
                }
            }
            // If the keys are not the same length
            if (keys[0].length !== keys[1].length) {
                // We first need to check that there are no undefined values lurking
                // If there are then they are most likely present in the longer of the two arrays
                var longer = keys[0].length > keys[1].length ? 0 : 1;
                // Then go through this array and find the key that does not match
                // And the value of the longer set is undefined
                for (var i = 0; i < keys[longer].length; i++) {
                    if (keys[0][i] !== keys[1][i] && states[longer][keys[longer][i]] === undefined) {
                        // remove that key
                        keys[longer].splice(i, 1);
                        i--;
                    }
                }
                // If the length of the keys still do not match at this point then they are different
                if (keys[0].length !== keys[1].length) {
                    return false;
                }
            }
            // Then each key and value has to be checked against each other
            for (var i = 0; i < keys[0].length; i++) {
                // If the keys dont equal, or their corresponding types are different we can return false
                if (keys[0][i] !== keys[1][i] || typeof states[0][keys[0][i]] !== typeof states[1][keys[1][i]]) {
                    return false;
                }
                // If the type is an object then further deep comparisons are required
                if (typeof states[0][keys[0][i]] === 'object') {
                    if (!this._deepCompare(states[0][keys[0][i]], states[1][keys[1][i]])) {
                        return false;
                    }
                }
                // Otherwise we can just check the value
                else if (states[0][keys[0][i]] !== states[1][keys[1][i]]) {
                    return false;
                }
            }
            // If we get all the way to here there are no differences so return true for this object
            return true;
        };
        /**
         * Creates a new confirmation modal for the user to approve an action
         *
         * @param title The title that is to be displayed at the top of the modal
         * @param buttonText The text that is to be displayed in the confirmation button of the modal
         * @param buttonAction The action that should be taken when the confirmation button is pressed
         * @param modalContents The contents for the main body of the modal
         */
        StateRestore.prototype._newModal = function (title, buttonText, buttonAction, modalContents) {
            var _this = this;
            this.dom.background.appendTo(this.dom.dtContainer);
            this.dom.confirmationTitleRow.empty().append(title);
            var confirmationButton = $$1('<button class="' + this.classes.confirmationButton + ' ' + this.classes.dtButton + '">' +
                buttonText +
                '</button>');
            this.dom.confirmation
                .empty()
                .append(this.dom.confirmationTitleRow)
                .append(modalContents)
                .append($$1('<div class="' + this.classes.confirmationButtons + '"></div>')
                .append(confirmationButton))
                .appendTo(this.dom.dtContainer);
            $$1(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
            var inputs = modalContents.children('input');
            // If there is an input focus on that
            if (inputs.length > 0) {
                $$1(inputs[0]).focus();
            }
            // Otherwise focus on the confirmation button
            else {
                confirmationButton.focus();
            }
            var background = $$1('div.' + this.classes.background.replace(/ /g, '.'));
            var keyupFunction = function (e) {
                // If enter same action as pressing the button
                if (e.key === 'Enter') {
                    confirmationButton.click();
                }
                // If escape close modal
                else if (e.key === 'Escape') {
                    background.click();
                }
            };
            // When the button is clicked, call the appropriate action,
            // remove the background and modal from the screen and unbind the keyup event.
            confirmationButton.on('click', function () {
                var success = buttonAction();
                if (success === true) {
                    _this.dom.background.remove();
                    _this.dom.confirmation.remove();
                    $$1(document).unbind('keyup', keyupFunction);
                    confirmationButton.off('click');
                }
                else {
                    _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                    _this.dom.confirmation.append(_this.dom[success + 'Error']);
                }
            });
            this.dom.confirmation.on('click', function (e) {
                e.stopPropagation();
            });
            // When the button is clicked, remove the background and modal from the screen and unbind the keyup event.
            background.one('click', function () {
                _this.dom.background.remove();
                _this.dom.confirmation.remove();
                $$1(document).unbind('keyup', keyupFunction);
            });
            $$1(document).on('keyup', keyupFunction);
        };
        /**
         * Convert from camelCase notation to the internal Hungarian.
         * We could use the Hungarian convert function here, but this is cleaner
         *
         * @param {object} obj Object to convert
         * @returns {object} Inverted object
         * @memberof DataTable#oApi
         */
        StateRestore.prototype._searchToHung = function (obj) {
            return {
                bCaseInsensitive: obj.caseInsensitive,
                bRegex: obj.regex,
                bSmart: obj.smart,
                sSearch: obj.search
            };
        };
        StateRestore.version = '1.0.0';
        StateRestore.classes = {
            background: 'dtsr-background',
            confirmation: 'dtsr-confirmation',
            confirmationButton: 'dtsr-confirmation-button',
            confirmationButtons: 'dtsr-confirmation-buttons',
            confirmationMessage: 'dtsr-confirmation-message dtsr-name-label',
            confirmationText: 'dtsr-confirmation-text',
            confirmationTitle: 'dtsr-confirmation-title',
            confirmationTitleRow: 'dtsr-confirmation-title-row',
            dtButton: 'dt-button',
            input: 'dtsr-input',
            modalError: 'dtsr-modal-error',
            renameModal: 'dtsr-rename-modal'
        };
        StateRestore.defaults = {
            _createInSaved: false,
            ajax: false,
            create: true,
            creationModal: false,
            i18n: {
                creationModal: {
                    button: 'Create',
                    colReorder: 'Column Order:',
                    columns: {
                        search: 'Column Search:',
                        visible: 'Column Visibility:'
                    },
                    name: 'Name:',
                    order: 'Sorting:',
                    paging: 'Paging:',
                    scroller: 'Scroll Position:',
                    search: 'Search:',
                    searchBuilder: 'SearchBuilder:',
                    searchPanes: 'SearchPanes:',
                    select: 'Select:',
                    title: 'Create New State',
                    toggleLabel: 'Includes:'
                },
                duplicateError: 'A state with this name already exists.',
                emptyError: 'Name cannot be empty.',
                emptyStates: 'No saved states',
                removeConfirm: 'Are you sure you want to remove %s?',
                removeError: 'Failed to remove state.',
                removeJoiner: ' and ',
                removeSubmit: 'Remove',
                removeTitle: 'Remove State',
                renameButton: 'Rename',
                renameLabel: 'New Name for %s:',
                renameTitle: 'Rename State'
            },
            remove: true,
            rename: true,
            save: true,
            saveState: {
                colReorder: true,
                columns: {
                    search: true,
                    visible: true
                },
                order: true,
                paging: true,
                scroller: true,
                search: true,
                searchBuilder: true,
                searchPanes: true,
                select: true
            },
            toggle: {
                colReorder: false,
                columns: {
                    search: false,
                    visible: false
                },
                order: false,
                paging: false,
                scroller: false,
                search: false,
                searchBuilder: false,
                searchPanes: false,
                select: false
            }
        };
        return StateRestore;
    }());

    var $;
    var dataTable;
    function setJQuery(jq) {
        $ = jq;
        dataTable = jq.fn.dataTable;
    }
    var StateRestoreCollection = /** @class */ (function () {
        function StateRestoreCollection(settings, opts) {
            var _this = this;
            // Check that the required version of DataTables is included
            if (!dataTable || !dataTable.versionCheck || !dataTable.versionCheck('1.10.0')) {
                throw new Error('StateRestore requires DataTables 1.10 or newer');
            }
            // Check that Select is included
            // eslint-disable-next-line no-extra-parens
            if (!dataTable.Buttons) {
                throw new Error('StateRestore requires Buttons');
            }
            var table = new dataTable.Api(settings);
            this.classes = $.extend(true, {}, StateRestoreCollection.classes);
            if (table.settings()[0]._stateRestore !== undefined) {
                return;
            }
            // Get options from user
            this.c = $.extend(true, {}, StateRestoreCollection.defaults, opts);
            this.s = {
                dt: table,
                hasColReorder: dataTable.ColReorder !== undefined,
                hasScroller: dataTable.Scroller !== undefined,
                hasSearchBuilder: dataTable.SearchBuilder !== undefined,
                hasSearchPanes: dataTable.SearchPanes !== undefined,
                hasSelect: dataTable.select !== undefined,
                states: []
            };
            this.s.dt.on('xhr', function (e, xhrsettings, json) {
                // Has staterestore been used before? Is there anything to load?
                if (json && json.stateRestore) {
                    _this._addPreDefined(json.stateRestore);
                }
            });
            this.dom = {
                background: $('<div class="' + this.classes.background + '"/>'),
                colReorderToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.colReorderToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.colReorder', this.c.i18n.creationModal.colReorder) +
                    '</label>' +
                    '</div>'),
                columnsSearchToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.columnsSearchToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.columns.search', this.c.i18n.creationModal.columns.search) +
                    '</label>' +
                    '</div>'),
                columnsVisibleToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + ' ' + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.columnsVisibleToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.columns.visible', this.c.i18n.creationModal.columns.visible) +
                    '</label>' +
                    '</div>'),
                confirmation: $('<div class="' + this.classes.confirmation + '"/>'),
                confirmationTitleRow: $('<div class="' + this.classes.confirmationTitleRow + '"></div>'),
                createButtonRow: $('<div class="' + this.classes.formRow + ' ' + this.classes.modalFoot + '">' +
                    '<button class="' + this.classes.creationButton + ' ' + this.classes.dtButton + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.button', this.c.i18n.creationModal.button) +
                    '</button>' +
                    '</div>'),
                creation: $('<div class="' + this.classes.creation + '"/>'),
                creationForm: $('<div class="' + this.classes.creationForm + '"/>'),
                creationTitle: $('<div class="' + this.classes.creationText + '">' +
                    '<h2 class="' + this.classes.creationTitle + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.title', this.c.i18n.creationModal.title) +
                    '</h2>' +
                    '</div>'),
                dtContainer: $(this.s.dt.table().container()),
                duplicateError: $('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError) +
                    '</span>'),
                emptyError: $('<span class="' + this.classes.modalError + '">' +
                    this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError) +
                    '</span>'),
                nameInputRow: $('<div class="' + this.classes.formRow + '">' +
                    '<label class="' + this.classes.nameLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.name', this.c.i18n.creationModal.name) +
                    '</label>' +
                    '<input class="' + this.classes.nameInput + '" type="text">' +
                    '</div>'),
                orderToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.orderToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.order', this.c.i18n.creationModal.order) +
                    '</label>' +
                    '</div>'),
                pagingToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.pagingToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.paging', this.c.i18n.creationModal.paging) +
                    '</label>' +
                    '</div>'),
                removeContents: $('<div class="' + this.classes.confirmationText + '"><span></span></div>'),
                removeTitle: $('<div class="' + this.classes.creationText + '">' +
                    '<h2 class="' + this.classes.creationTitle + '">' +
                    this.s.dt.i18n('stateRestore.removeTitle', this.c.i18n.removeTitle) +
                    '</h2>' +
                    '</div>'),
                scrollerToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.scrollerToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.scroller', this.c.i18n.creationModal.scroller) +
                    '</label>' +
                    '</div>'),
                searchBuilderToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.searchBuilderToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.searchBuilder', this.c.i18n.creationModal.searchBuilder) +
                    '</label>' +
                    '</div>'),
                searchPanesToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.searchPanesToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.searchPanes', this.c.i18n.creationModal.searchPanes) +
                    '</label>' +
                    '</div>'),
                searchToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.searchToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.search', this.c.i18n.creationModal.search) +
                    '</label>' +
                    '</div>'),
                selectToggle: $('<div class="' + this.classes.formRow + ' ' + this.classes.checkRow + '">' +
                    '<input type="checkbox" class="' +
                    this.classes.selectToggle + ' ' +
                    this.classes.checkBox +
                    '" checked>' +
                    '<label class="' + this.classes.checkLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.select', this.c.i18n.creationModal.select) +
                    '</label>' +
                    '</div>'),
                toggleLabel: $('<label class="' + this.classes.nameLabel + ' ' + this.classes.toggleLabel + '">' +
                    this.s.dt.i18n('stateRestore.creationModal.toggleLabel', this.c.i18n.creationModal.toggleLabel) +
                    '</label>')
            };
            table.settings()[0]._stateRestore = this;
            this._searchForStates();
            // Has staterestore been used before? Is there anything to load?
            this._addPreDefined(this.c.preDefined);
            var ajaxFunction;
            var ajaxData = {
                action: 'load'
            };
            if (typeof this.c.ajax === 'function') {
                ajaxFunction = function () {
                    if (typeof _this.c.ajax === 'function') {
                        _this.c.ajax.call(_this.s.dt, ajaxData, function (s) { return _this._addPreDefined(s); });
                    }
                };
            }
            else if (typeof this.c.ajax === 'string') {
                ajaxFunction = function () {
                    $.ajax({
                        data: ajaxData,
                        success: function (data) {
                            _this._addPreDefined(data);
                        },
                        type: 'POST',
                        url: _this.c.ajax
                    });
                };
            }
            if (typeof ajaxFunction === 'function') {
                if (this.s.dt.settings()[0]._bInitComplete) {
                    ajaxFunction();
                }
                else {
                    this.s.dt.one('preInit.dtsr', function () {
                        ajaxFunction();
                    });
                }
            }
            this.s.dt.on('destroy.dtsr', function () {
                _this.destroy();
            });
            this.s.dt.on('draw.dtsr buttons-action.dtsr', function () { return _this._findActive(); });
            return this;
        }
        /**
         * Adds a new StateRestore instance to the collection based on the current properties of the table
         *
         * @param identifier The value that is used to identify a state.
         * @returns The state that has been created
         */
        StateRestoreCollection.prototype.addState = function (identifier, currentIdentifiers, options) {
            var _this = this;
            // If creation/saving is not allowed then return
            if (!this.c.create || !this.c.save) {
                return;
            }
            // Check if the state exists before creating a new ones
            var state = this.getState(identifier);
            var createFunction = function (id, toggles) {
                if (id.length === 0) {
                    return 'empty';
                }
                else if (currentIdentifiers.includes(id)) {
                    return 'duplicate';
                }
                _this.s.dt.state.save();
                var newState = new StateRestore(_this.s.dt.settings()[0], $.extend(true, {}, _this.c, toggles, options), id, _this.s.dt.state());
                $(_this.s.dt.table().node()).on('dtsr-modal-inserted', function () {
                    newState.dom.confirmation.one('dtsr-remove', function () { return _this._removeCallback(newState.s.identifier); });
                    newState.dom.confirmation.one('dtsr-rename', function () { return _this._collectionRebuild(); });
                    newState.dom.confirmation.one('dtsr-save', function () { return _this._collectionRebuild(); });
                });
                _this.s.states.push(newState);
                _this._collectionRebuild();
                return true;
            };
            // If there isn't already a state with this identifier
            if (state === null) {
                if (this.c.creationModal || options !== undefined && options.creationModal) {
                    this._creationModal(createFunction, identifier, options);
                }
                else {
                    var success = createFunction(identifier, {});
                    if (success === 'empty') {
                        throw new Error(this.s.dt.i18n('stateRestore.emptyError', this.c.i18n.emptyError));
                    }
                    else if (success === 'duplicate') {
                        throw new Error(this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError));
                    }
                }
            }
            else {
                throw new Error(this.s.dt.i18n('stateRestore.duplicateError', this.c.i18n.duplicateError));
            }
        };
        /**
         * Removes all of the states, showing a modal to the user for confirmation
         *
         * @param removeFunction The action to be taken when the action is confirmed
         */
        StateRestoreCollection.prototype.removeAll = function (removeFunction) {
            // There are no states to remove so just return
            if (this.s.states.length === 0) {
                return;
            }
            var ids = this.s.states.map(function (state) { return state.s.identifier; });
            var replacementString = ids[0];
            if (ids.length > 1) {
                replacementString = ids.slice(0, -1).join(', ') +
                    this.s.dt.i18n('stateRestore.removeJoiner', this.c.i18n.removeJoiner) +
                    ids.slice(-1);
            }
            $(this.dom.removeContents.children('span')).text(this.s.dt
                .i18n('stateRestore.removeConfirm', this.c.i18n.removeConfirm)
                .replace(/%s/g, replacementString));
            this._newModal(this.dom.removeTitle, this.s.dt.i18n('stateRestore.removeSubmit', this.c.i18n.removeSubmit), removeFunction, this.dom.removeContents);
        };
        /**
         * Removes all of the dom elements from the document for the collection and the stored states
         */
        StateRestoreCollection.prototype.destroy = function () {
            for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
                var state = _a[_i];
                state.destroy();
            }
            Object.values(this.dom).forEach(function (node) {
                node.off();
                node.remove();
            });
            this.s.states = [];
            this.s.dt.off('.dtsr');
            $(this.s.dt.table().node()).off('.dtsr');
        };
        /**
         * Gets a single state that has the identifier matching that which is passed in
         *
         * @param identifier The value that is used to identify a state
         * @returns The state that has been identified or null if no states have been identified
         */
        StateRestoreCollection.prototype.getState = function (identifier) {
            for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
                var state = _a[_i];
                if (state.s.identifier === identifier) {
                    return state;
                }
            }
            return null;
        };
        /**
         * Gets an array of all of the states
         *
         * @returns Any states that have been identified
         */
        StateRestoreCollection.prototype.getStates = function (ids) {
            if (ids === undefined) {
                return this.s.states;
            }
            else {
                var states = [];
                for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
                    var id = ids_1[_i];
                    var found = false;
                    for (var _a = 0, _b = this.s.states; _a < _b.length; _a++) {
                        var state = _b[_a];
                        if (id === state.s.identifier) {
                            states.push(state);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        states.push(undefined);
                    }
                }
                return states;
            }
        };
        /**
         * Reloads states that are set via datatables config or over ajax
         *
         * @param preDefined Object containing the predefined states that are to be reintroduced
         */
        StateRestoreCollection.prototype._addPreDefined = function (preDefined) {
            var _this = this;
            var states = Object.keys(preDefined).sort(function (a, b) {
                var aId = +_this._getId(a);
                var bId = +_this._getId(b);
                return aId > bId ?
                    1 :
                    aId < bId ?
                        -1 :
                        0;
            });
            var _loop_1 = function (state) {
                for (var i = 0; i < this_1.s.states.length; i++) {
                    if (this_1.s.states[i].s.identifier === state) {
                        this_1.s.states.splice(i, 1);
                    }
                }
                var loadedState = preDefined[state];
                var newState = new StateRestore(this_1.s.dt, $.extend(true, {}, this_1.c, loadedState.c !== undefined ?
                    { saveState: loadedState.c.saveState } :
                    undefined, true), state, loadedState, true);
                newState.s.savedState = loadedState;
                this_1.s.states.push(newState);
                $(this_1.s.dt.table().node()).on('dtsr-modal-inserted', function () {
                    newState.dom.confirmation.one('dtsr-remove', function () { return _this._removeCallback(newState.s.identifier); });
                    newState.dom.confirmation.one('dtsr-rename', function () { return _this._collectionRebuild(); });
                    newState.dom.confirmation.one('dtsr-save', function () { return _this._collectionRebuild(); });
                });
            };
            var this_1 = this;
            for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
                var state = states_1[_i];
                _loop_1(state);
            }
            this._collectionRebuild();
        };
        /**
         * Rebuilds all of the buttons in the collection of states to make sure that states and text is up to date
         */
        StateRestoreCollection.prototype._collectionRebuild = function () {
            var _this = this;
            var stateButtons = [];
            if (this.c._createInSaved) {
                stateButtons.push('createState');
            }
            // If there are no states display an empty message
            if (this.s.states.length === 0) {
                stateButtons.push('<span class="' + this.classes.emptyStates + '">' +
                    this.s.dt.i18n('stateRestore.emptyStates', this.c.i18n.emptyStates) +
                    '</span>');
            }
            else {
                // Sort the states so that they appear alphabetically
                this.s.states = this.s.states.sort(function (a, b) {
                    var aId = +_this._getId(a.s.identifier);
                    var bId = +_this._getId(b.s.identifier);
                    return aId > bId ?
                        1 :
                        aId < bId ?
                            -1 :
                            0;
                });
                // Construct the split property of each button
                for (var _i = 0, _a = this.s.states; _i < _a.length; _i++) {
                    var state = _a[_i];
                    var split = [];
                    if (this.c.save && state.c.save) {
                        split.push('updateState');
                    }
                    if (this.c.save && state.c.save && this.c.rename && state.c.rename) {
                        split.push('renameState');
                    }
                    if (this.c.remove && state.c.remove) {
                        split.push('removeState');
                    }
                    if (split.length > 0) {
                        split.unshift('<h3>' + state.s.identifier + '</h3>');
                    }
                    stateButtons.push({
                        _stateRestore: state,
                        config: {
                            split: split
                        },
                        extend: 'stateRestore',
                        text: state.s.identifier
                    });
                }
            }
            this.s.dt.button('SaveStateRestore:name').collectionRebuild(stateButtons);
        };
        /**
         * Displays a modal that is used to get information from the user to create a new state.
         *
         * @param buttonAction The action that should be taken when the button is pressed
         * @param identifier The default identifier for the next new state
         */
        StateRestoreCollection.prototype._creationModal = function (buttonAction, identifier, options) {
            var _this = this;
            this.dom.creation.empty();
            this.dom.creationForm.empty();
            this.dom.nameInputRow.children('input').val(identifier);
            this.dom.creationForm.append(this.dom.nameInputRow);
            var tableConfig = this.s.dt.settings()[0].oInit;
            var togglesToInsert = [];
            var toggleDefined = options !== undefined && options.toggle !== undefined;
            // Order toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.order === undefined) && this.c.toggle.order ||
                toggleDefined && options.toggle.order) &&
                this.c.saveState.order &&
                (tableConfig.ordering === undefined || tableConfig.ordering)) {
                togglesToInsert.push(this.dom.orderToggle);
            }
            // Search toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.search === undefined) && this.c.toggle.search ||
                toggleDefined && options.toggle.search) &&
                this.c.saveState.search &&
                (tableConfig.searching === undefined || tableConfig.searching)) {
                togglesToInsert.push(this.dom.searchToggle);
            }
            // Paging toggle - check toggle and saving enabled
            if (((!toggleDefined || options.toggle.paging === undefined) && this.c.toggle.paging ||
                toggleDefined && options.toggle.paging) &&
                this.c.saveState.paging &&
                (tableConfig.paging === undefined || tableConfig.paging)) {
                togglesToInsert.push(this.dom.pagingToggle);
            }
            // ColReorder toggle - check toggle and saving enabled
            if (this.s.hasColReorder &&
                ((!toggleDefined || options.toggle.colReorder === undefined) && this.c.toggle.colReorder ||
                    toggleDefined && options.toggle.colReorder) &&
                this.c.saveState.colReorder) {
                togglesToInsert.push(this.dom.colReorderToggle);
            }
            // Scroller toggle - check toggle and saving enabled
            if (this.s.hasScroller &&
                ((!toggleDefined || options.toggle.scroller === undefined) && this.c.toggle.scroller ||
                    toggleDefined && options.toggle.scroller) &&
                this.c.saveState.scroller) {
                togglesToInsert.push(this.dom.scrollerToggle);
            }
            // SearchBuilder toggle - check toggle and saving enabled
            if (this.s.hasSearchBuilder &&
                ((!toggleDefined || options.toggle.searchBuilder === undefined) && this.c.toggle.searchBuilder ||
                    toggleDefined && options.toggle.searchBuilder) &&
                this.c.saveState.searchBuilder) {
                togglesToInsert.push(this.dom.searchBuilderToggle);
            }
            // SearchPanes toggle - check toggle and saving enabled
            if (this.s.hasSearchPanes &&
                ((!toggleDefined || options.toggle.searchPanes === undefined) && this.c.toggle.searchPanes ||
                    toggleDefined && options.toggle.searchPanes) &&
                this.c.saveState.searchPanes) {
                togglesToInsert.push(this.dom.searchPanesToggle);
            }
            // Select toggle - check toggle and saving enabled
            if (this.s.hasSelect &&
                ((!toggleDefined || options.toggle.select === undefined) && this.c.toggle.select ||
                    toggleDefined && options.toggle.select) &&
                this.c.saveState.select) {
                togglesToInsert.push(this.dom.selectToggle);
            }
            // Columns toggle - check toggle and saving enabled
            if (typeof this.c.toggle.columns === 'boolean' &&
                ((!toggleDefined || options.toggle.order === undefined) && this.c.toggle.columns ||
                    toggleDefined && options.toggle.order) &&
                this.c.saveState.columns) {
                togglesToInsert.push(this.dom.columnsSearchToggle);
                togglesToInsert.push(this.dom.columnsVisibleToggle);
            }
            else if ((!toggleDefined || options.toggle.columns === undefined) && typeof this.c.toggle.columns !== 'boolean' ||
                typeof options.toggle.order !== 'boolean') {
                if (typeof this.c.saveState.columns !== 'boolean' && this.c.saveState.columns) {
                    // Column search toggle - check toggle and saving enabled
                    if ((
                    // columns.search is defined when passed in
                    toggleDefined &&
                        options.toggle.columns !== undefined &&
                        typeof options.toggle.columns !== 'boolean' &&
                        options.toggle.columns.search ||
                        // Columns search is not defined when passed in but is in defaults
                        (!toggleDefined ||
                            options.toggle.columns === undefined ||
                            typeof options.toggle.columns !== 'boolean' && options.toggle.columns.search === undefined) &&
                            typeof this.c.toggle.columns !== 'boolean' &&
                            this.c.toggle.columns.search) &&
                        this.c.saveState.columns.search) {
                        togglesToInsert.push(this.dom.columnsSearchToggle);
                    }
                    // Column visiblity toggle - check toggle and saving enabled
                    if ((
                    // columns.visible is defined when passed in
                    toggleDefined &&
                        options.toggle.columns !== undefined &&
                        typeof options.toggle.columns !== 'boolean' &&
                        options.toggle.columns.visible ||
                        // Columns visible is not defined when passed in but is in defaults
                        (!toggleDefined ||
                            options.toggle.columns === undefined ||
                            typeof options.toggle.columns !== 'boolean' && options.toggle.columns.visible === undefined) &&
                            typeof this.c.toggle.columns !== 'boolean' &&
                            this.c.toggle.columns.visible) &&
                        this.c.saveState.columns.visible) {
                        togglesToInsert.push(this.dom.columnsVisibleToggle);
                    }
                }
                else if (this.c.saveState.columns) {
                    togglesToInsert.push(this.dom.columnsSearchToggle);
                    togglesToInsert.push(this.dom.columnsVisibleToggle);
                }
            }
            // Make sure that the toggles are displayed alphabetically
            togglesToInsert.sort(function (a, b) {
                var aVal = a.children('label.dtsr-check-label')[0].innerHTML;
                var bVal = b.children('label.dtsr-check-label')[0].innerHTML;
                if (aVal < bVal) {
                    return -1;
                }
                else if (aVal > bVal) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            // Append all of the toggles that are to be inserted
            for (var _i = 0, togglesToInsert_1 = togglesToInsert; _i < togglesToInsert_1.length; _i++) {
                var toggle = togglesToInsert_1[_i];
                this.dom.creationForm.append(toggle);
            }
            // Insert the toggle label next to the first check box
            $(this.dom.creationForm.children('div.' + this.classes.checkRow)[0]).prepend(this.dom.toggleLabel);
            // Insert the creation modal and the background
            this.dom.background.appendTo(this.dom.dtContainer);
            this.dom.creation
                .append(this.dom.creationTitle)
                .append(this.dom.creationForm)
                .append(this.dom.createButtonRow)
                .appendTo(this.dom.dtContainer);
            $(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
            var _loop_2 = function (toggle) {
                $(toggle.children('label:last-child')).on('click', function () {
                    toggle.children('input').prop('checked', !toggle.children('input').prop('checked'));
                });
            };
            // Allow the label to be clicked to toggle the checkbox
            for (var _a = 0, togglesToInsert_2 = togglesToInsert; _a < togglesToInsert_2.length; _a++) {
                var toggle = togglesToInsert_2[_a];
                _loop_2(toggle);
            }
            var creationButton = $('button.' + this.classes.creationButton.replace(/ /g, '.'));
            var inputs = this.dom.creationForm.find('input');
            // If there is an input focus on that
            if (inputs.length > 0) {
                $(inputs[0]).focus();
            }
            // Otherwise focus on the confirmation button
            else {
                creationButton.focus();
            }
            var background = $('div.' + this.classes.background.replace(/ /g, '.'));
            var keyupFunction = function (e) {
                if (e.key === 'Enter') {
                    creationButton.click();
                }
                else if (e.key === 'Escape') {
                    background.click();
                }
            };
            creationButton.on('click', function () {
                // Get the values of the checkBoxes
                var saveState = {
                    colReorder: _this.dom.colReorderToggle.children('input').is(':checked'),
                    columns: {
                        search: _this.dom.columnsSearchToggle.children('input').is(':checked'),
                        visible: _this.dom.columnsVisibleToggle.children('input').is(':checked')
                    },
                    order: _this.dom.orderToggle.children('input').is(':checked'),
                    paging: _this.dom.pagingToggle.children('input').is(':checked'),
                    scroller: _this.dom.scrollerToggle.children('input').is(':checked'),
                    search: _this.dom.searchToggle.children('input').is(':checked'),
                    searchBuilder: _this.dom.searchBuilderToggle.children('input').is(':checked'),
                    searchPanes: _this.dom.searchPanesToggle.children('input').is(':checked'),
                    select: _this.dom.selectToggle.children('input').is(':checked')
                };
                // Call the buttons functionality passing in the identifier and what should be saved
                var success = buttonAction($('input.' + _this.classes.nameInput.replace(/ /g, '.')).val(), { saveState: saveState });
                if (success === true) {
                    // Remove the dom elements as operation has completed
                    _this.dom.background.remove();
                    _this.dom.creation.remove();
                    // Unbind the keyup function  - don't want it to run unnecessarily on every keypress that occurs
                    $(document).unbind('keyup', keyupFunction);
                }
                else {
                    _this.dom.creation.children('.' + _this.classes.modalError).remove();
                    _this.dom.creation.append(_this.dom[success + 'Error']);
                }
            });
            background.one('click', function () {
                // Remove the dome elements as operation has been cancelled
                _this.dom.background.remove();
                _this.dom.creation.remove();
                // Unbind the keyup function - don't want it to run unnecessarily on every keypress that occurs
                $(document).unbind('keyup', keyupFunction);
                // Rebuild the collection to ensure that the latest changes are present
                _this._collectionRebuild();
            });
            // Have to listen to the keyup event as `escape` doesn't trigger keypress
            $(document).on('keyup', keyupFunction);
            // Need to save the state before the focus is lost when the modal is interacted with
            this.s.dt.state.save();
        };
        StateRestoreCollection.prototype._findActive = function () {
            // Make sure that the state is up to date
            this.s.dt.state.save();
            var currState = this.s.dt.state();
            // Make all of the buttons inactive so that only any that match will be marked as active
            var buttons = $('button.' + $.fn.DataTable.Buttons.defaults.dom.button.className.replace(/ /g, '.'));
            // Some of the styling libraries use a tags instead of buttons
            if (buttons.length === 0) {
                buttons = $('a.' + $.fn.DataTable.Buttons.defaults.dom.button.className.replace(/ /g, '.'));
            }
            for (var _i = 0, buttons_1 = buttons; _i < buttons_1.length; _i++) {
                var button = buttons_1[_i];
                this.s.dt.button($(button).parent()[0]).active(false);
            }
            // Go through all of the states comparing if their state is the same to the current one
            for (var _a = 0, _b = this.s.states; _a < _b.length; _a++) {
                var state = _b[_a];
                if (state.compare(currState)) {
                    // If so, find the corresponding button and mark it as active
                    for (var _c = 0, buttons_2 = buttons; _c < buttons_2.length; _c++) {
                        var button = buttons_2[_c];
                        if ($(button).text() === state.s.identifier) {
                            this.s.dt.button($(button).parent()[0]).active(true);
                            break;
                        }
                    }
                }
            }
        };
        /**
         * This callback is called when a state is removed.
         * This removes the state from storage and also strips it's button from the container
         *
         * @param identifier The value that is used to identify a state
         */
        StateRestoreCollection.prototype._removeCallback = function (identifier) {
            for (var i = 0; i < this.s.states.length; i++) {
                if (this.s.states[i].s.identifier === identifier) {
                    this.s.states.splice(i, 1);
                    i--;
                }
            }
            this._collectionRebuild();
            return true;
        };
        StateRestoreCollection.prototype._getId = function (identifier) {
            var replaceRegex;
            var language = this.s.dt.settings()[0].oLanguage;
            // Create a replacement regex based on the i18n values
            var defaultString = language.buttons !== undefined && language.buttons.stateRestore !== undefined ?
                language.buttons.stateRestore :
                'State ';
            if (defaultString.indexOf('%d') === defaultString.length - 3) {
                replaceRegex = new RegExp(defaultString.replace(/%d/g, ''));
            }
            else {
                var splitString = defaultString.split('%d');
                replaceRegex = [];
                for (var _i = 0, splitString_1 = splitString; _i < splitString_1.length; _i++) {
                    var split = splitString_1[_i];
                    replaceRegex.push(new RegExp(split));
                }
            }
            var id;
            if (Array.isArray(replaceRegex)) {
                id = identifier;
                for (var _a = 0, replaceRegex_1 = replaceRegex; _a < replaceRegex_1.length; _a++) {
                    var reg = replaceRegex_1[_a];
                    id = id.replace(reg, '');
                }
            }
            else {
                id = identifier.replace(replaceRegex, '');
            }
            // If the id after replacement is not a number, or the length is the same as before,
            //  it has been customised so return 0
            if (isNaN(+id) || id.length === identifier) {
                return 0;
            }
            // Otherwise return the number that has been assigned previously
            else {
                return +id;
            }
        };
        /**
         * Creates a new confirmation modal for the user to approve an action
         *
         * @param title The title that is to be displayed at the top of the modal
         * @param buttonText The text that is to be displayed in the confirmation button of the modal
         * @param buttonAction The action that should be taken when the confirmation button is pressed
         * @param modalContents The contents for the main body of the modal
         */
        StateRestoreCollection.prototype._newModal = function (title, buttonText, buttonAction, modalContents) {
            var _this = this;
            this.dom.background.appendTo(this.dom.dtContainer);
            this.dom.confirmationTitleRow.empty().append(title);
            var confirmationButton = $('<button class="' + this.classes.confirmationButton + ' ' + this.classes.dtButton + '">' +
                buttonText +
                '</button>');
            this.dom.confirmation
                .empty()
                .append(this.dom.confirmationTitleRow)
                .append(modalContents)
                .append($('<div class="' + this.classes.confirmationButtons + '"></div>')
                .append(confirmationButton))
                .appendTo(this.dom.dtContainer);
            $(this.s.dt.table().node()).trigger('dtsr-modal-inserted');
            var inputs = modalContents.children('input');
            // If there is an input focus on that
            if (inputs.length > 0) {
                $(inputs[0]).focus();
            }
            // Otherwise focus on the confirmation button
            else {
                confirmationButton.focus();
            }
            var background = $('div.' + this.classes.background.replace(/ /g, '.'));
            var keyupFunction = function (e) {
                // If enter same action as pressing the button
                if (e.key === 'Enter') {
                    confirmationButton.click();
                }
                // If escape close modal
                else if (e.key === 'Escape') {
                    background.click();
                }
            };
            // When the button is clicked, call the appropriate action,
            // remove the background and modal from the screen and unbind the keyup event.
            confirmationButton.on('click', function () {
                var success = buttonAction(true);
                if (success === true) {
                    _this.dom.background.remove();
                    _this.dom.confirmation.remove();
                    $(document).unbind('keyup', keyupFunction);
                    confirmationButton.off('click');
                }
                else {
                    _this.dom.confirmation.children('.' + _this.classes.modalError).remove();
                    _this.dom.confirmation.append(_this.dom[success + 'Error']);
                }
            });
            this.dom.confirmation.on('click', function (e) {
                e.stopPropagation();
            });
            // When the button is clicked, remove the background and modal from the screen and unbind the keyup event.
            background.one('click', function () {
                _this.dom.background.remove();
                _this.dom.confirmation.remove();
                $(document).unbind('keyup', keyupFunction);
            });
            $(document).on('keyup', keyupFunction);
        };
        /**
         * Private method that checks for previously created states on initialisation
         */
        StateRestoreCollection.prototype._searchForStates = function () {
            var _this = this;
            var keys = Object.keys(localStorage);
            var _loop_3 = function (key) {
                // eslint-disable-next-line no-useless-escape
                if (key.match(new RegExp('^DataTables_stateRestore_.*_' + location.pathname.replace(/\//g, '\/') + '$'))) {
                    var loadedState = JSON.parse(localStorage.getItem(key));
                    if (loadedState.stateRestore.isPreDefined) {
                        return "continue";
                    }
                    var newState_1 = new StateRestore(this_2.s.dt, $.extend(true, {}, this_2.c, { saveState: loadedState.c.saveState }), loadedState.stateRestore.state, loadedState);
                    newState_1.s.savedState = loadedState;
                    this_2.s.states.push(newState_1);
                    $(this_2.s.dt.table().node()).on('dtsr-modal-inserted', function () {
                        newState_1.dom.confirmation.one('dtsr-remove', function () { return _this._removeCallback(newState_1.s.identifier); });
                        newState_1.dom.confirmation.one('dtsr-rename', function () { return _this._collectionRebuild(); });
                        newState_1.dom.confirmation.one('dtsr-save', function () { return _this._collectionRebuild(); });
                    });
                }
            };
            var this_2 = this;
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                _loop_3(key);
            }
            this._collectionRebuild();
        };
        StateRestoreCollection.version = '1.0.0';
        StateRestoreCollection.classes = {
            background: 'dtsr-background',
            checkBox: 'dtsr-check-box',
            checkLabel: 'dtsr-check-label',
            checkRow: 'dtsr-check-row',
            colReorderToggle: 'dtsr-colReorder-toggle',
            columnsSearchToggle: 'dtsr-columns-search-toggle',
            columnsVisibleToggle: 'dtsr-columns-visible-toggle',
            confirmation: 'dtsr-confirmation',
            confirmationButton: 'dtsr-confirmation-button',
            confirmationButtons: 'dtsr-confirmation-buttons',
            confirmationMessage: 'dtsr-confirmation-message dtsr-name-label',
            confirmationText: 'dtsr-confirmation-text',
            confirmationTitle: 'dtsr-confirmation-title',
            confirmationTitleRow: 'dtsr-confirmation-title-row',
            creation: 'dtsr-creation',
            creationButton: 'dtsr-creation-button',
            creationForm: 'dtsr-creation-form',
            creationText: 'dtsr-creation-text',
            creationTitle: 'dtsr-creation-title',
            dtButton: 'dt-button',
            emptyStates: 'dtsr-emptyStates',
            formRow: 'dtsr-form-row',
            leftSide: 'dtsr-left',
            modalError: 'dtsr-modal-error',
            modalFoot: 'dtsr-modal-foot',
            nameInput: 'dtsr-name-input',
            nameLabel: 'dtsr-name-label',
            orderToggle: 'dtsr-order-toggle',
            pagingToggle: 'dtsr-paging-toggle',
            rightSide: 'dtsr-right',
            scrollerToggle: 'dtsr-scroller-toggle',
            searchBuilderToggle: 'dtsr-searchBuilder-toggle',
            searchPanesToggle: 'dtsr-searchPanes-toggle',
            searchToggle: 'dtsr-search-toggle',
            selectToggle: 'dtsr-select-toggle',
            toggleLabel: 'dtsr-toggle-title'
        };
        StateRestoreCollection.defaults = {
            _createInSaved: false,
            ajax: false,
            create: true,
            creationModal: false,
            i18n: {
                creationModal: {
                    button: 'Create',
                    colReorder: 'Column Order',
                    columns: {
                        search: 'Column Search',
                        visible: 'Column Visibility'
                    },
                    name: 'Name:',
                    order: 'Sorting',
                    paging: 'Paging',
                    scroller: 'Scroll Position',
                    search: 'Search',
                    searchBuilder: 'SearchBuilder',
                    searchPanes: 'SearchPanes',
                    select: 'Select',
                    title: 'Create New State',
                    toggleLabel: 'Includes:'
                },
                duplicateError: 'A state with this name already exists.',
                emptyError: 'Name cannot be empty.',
                emptyStates: 'No saved states',
                removeConfirm: 'Are you sure you want to remove %s?',
                removeError: 'Failed to remove state.',
                removeJoiner: ' and ',
                removeSubmit: 'Remove',
                removeTitle: 'Remove State',
                renameButton: 'Rename',
                renameLabel: 'New Name for %s:',
                renameTitle: 'Rename State'
            },
            preDefined: {},
            remove: true,
            rename: true,
            save: true,
            saveState: {
                colReorder: true,
                columns: {
                    search: true,
                    visible: true
                },
                order: true,
                paging: true,
                scroller: true,
                search: true,
                searchBuilder: true,
                searchPanes: true,
                select: true
            },
            toggle: {
                colReorder: false,
                columns: {
                    search: false,
                    visible: false
                },
                order: false,
                paging: false,
                scroller: false,
                search: false,
                searchBuilder: false,
                searchPanes: false,
                select: false
            }
        };
        return StateRestoreCollection;
    }());

    /*! StateRestore 1.0.0
     * 2019-2020 SpryMedia Ltd - datatables.net/license
     */
    // DataTables extensions common UMD. Note that this allows for AMD, CommonJS
    // (with window and jQuery being allowed as parameters to the returned
    // function) or just default browser loading.
    (function (factory) {
        if (typeof define === 'function' && define.amd) {
            // AMD
            define(['jquery', 'datatables.net'], function ($) {
                return factory($, window, document);
            });
        }
        else if (typeof exports === 'object') {
            // CommonJS
            module.exports = function (root, $) {
                if (!root) {
                    root = window;
                }
                if (!$ || !$.fn.dataTable) {
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    $ = require('datatables.net')(root, $).$;
                }
                return factory($, root, root.document);
            };
        }
        else {
            // Browser - assume jQuery has already been loaded
            factory(window.jQuery, window, document);
        }
    }(function ($, window, document) {
        setJQuery$1($);
        setJQuery($);
        var dataTable = $.fn.dataTable;
        $.fn.dataTable.StateRestore = StateRestore;
        $.fn.DataTable.StateRestore = StateRestore;
        $.fn.dataTable.StateRestoreCollection = StateRestoreCollection;
        $.fn.DataTable.StateRestoreCollection = StateRestoreCollection;
        var apiRegister = $.fn.dataTable.Api.register;
        apiRegister('stateRestore()', function () {
            return this;
        });
        apiRegister('stateRestore.state()', function (identifier) {
            var ctx = this.context[0];
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            this[0] = ctx._stateRestore.getState(identifier);
            return this;
        });
        apiRegister('stateRestore.state.add()', function (identifier, options) {
            var ctx = this.context[0];
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            if (!ctx._stateRestore.c.create) {
                return this;
            }
            if (ctx._stateRestore.addState) {
                var states = ctx._stateRestore.s.states;
                var ids = [];
                for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
                    var intState = states_1[_i];
                    ids.push(intState.s.identifier);
                }
                ctx._stateRestore.addState(identifier, ids, options);
                return this;
            }
        });
        apiRegister('stateRestore.states()', function (ids) {
            var ctx = this.context[0];
            if (!ctx._stateRestore) {
                var api = $.fn.DataTable.Api(ctx);
                var src = new $.fn.dataTable.StateRestoreCollection(api, {});
                _stateRegen(api, src);
            }
            this.length = 0;
            this.push.apply(this, ctx._stateRestore.getStates(ids));
            return this;
        });
        apiRegister('stateRestore.state().save()', function () {
            var ctx = this[0];
            // Check if saving states is allowed
            if (ctx.c.save) {
                ctx.save();
            }
            return this;
        });
        apiRegister('stateRestore.state().rename()', function (newIdentifier) {
            var ctx = this.context[0];
            var state = this[0];
            // Check if renaming states is allowed
            if (state.c.save) {
                var states = ctx._stateRestore.s.states;
                var ids = [];
                for (var _i = 0, states_2 = states; _i < states_2.length; _i++) {
                    var intState = states_2[_i];
                    ids.push(intState.s.identifier);
                }
                state.rename(newIdentifier, ids);
            }
            return this;
        });
        apiRegister('stateRestore.state().load()', function () {
            var ctx = this[0];
            ctx.load();
            return this;
        });
        apiRegister('stateRestore.state().remove()', function (skipModal) {
            var ctx = this[0];
            // Check if removal of states is allowed
            if (ctx.c.remove) {
                ctx.remove(skipModal);
            }
            return this;
        });
        apiRegister('stateRestore.states().remove()', function (skipModal) {
            var _this = this;
            var removeAllCallBack = function (skipModalIn) {
                var success = true;
                _this.each(function (set) {
                    if (set !== undefined) {
                        // Check if removal of states is allowed
                        if (set.c.remove) {
                            var tempSuccess = set.remove(skipModalIn);
                            if (tempSuccess !== true) {
                                success = tempSuccess;
                            }
                        }
                    }
                });
                return success;
            };
            if (this.context[0]._stateRestore.c.remove) {
                if (skipModal) {
                    removeAllCallBack(skipModal);
                }
                else {
                    this.context[0]._stateRestore.removeAll(removeAllCallBack);
                }
            }
            return this;
        });
        $.fn.dataTable.ext.buttons.stateRestore = {
            action: function (e, dt, node, config) {
                config._stateRestore.load();
                node.blur();
            },
            config: {
                split: ['updateState', 'renameState', 'removeState']
            },
            text: function (dt) {
                return dt.i18n('buttons.stateRestore', 'State %d', dt.stateRestore.states()[0].length + 1);
            }
        };
        $.fn.dataTable.ext.buttons.updateState = {
            action: function (e, dt, node, config) {
                $('div.dt-button-background').click();
                config.parent._stateRestore.save();
            },
            text: function (dt) {
                return dt.i18n('buttons.updateState', 'Update');
            }
        };
        $.fn.dataTable.ext.buttons.savedStates = {
            buttons: [],
            extend: 'collection',
            init: function (dt, node, config) {
                if (dt.settings()[0]._stateRestore === undefined) {
                    _buttonInit(dt, config);
                }
            },
            name: 'SaveStateRestore',
            text: function (dt) {
                return dt.i18n('buttons.savedStates', 'Saved States');
            }
        };
        $.fn.dataTable.ext.buttons.savedStatesCreate = {
            buttons: [],
            extend: 'collection',
            init: function (dt, node, config) {
                if (dt.settings()[0]._stateRestore === undefined) {
                    if (config.config === undefined) {
                        config.config = {};
                    }
                    config.config._createInSaved = true;
                    _buttonInit(dt, config);
                }
            },
            name: 'SaveStateRestore',
            text: function (dt) {
                return dt.i18n('buttons.savedStates', 'Saved States');
            }
        };
        $.fn.dataTable.ext.buttons.createState = {
            action: function (e, dt, node, config) {
                e.stopPropagation();
                var stateRestoreOpts = dt.settings()[0]._stateRestore.c;
                var language = dt.settings()[0].oLanguage;
                // If creation/saving is not allowed then return
                if (!stateRestoreOpts.create || !stateRestoreOpts.save) {
                    return;
                }
                var prevStates = dt.stateRestore.states().toArray();
                // Create a replacement regex based on the i18n values
                var defaultString = language.buttons !== undefined && language.buttons.stateRestore !== undefined ?
                    language.buttons.stateRestore :
                    'State ';
                var replaceRegex;
                if (defaultString.indexOf('%d') === defaultString.length - 3) {
                    replaceRegex = new RegExp(defaultString.replace(/%d/g, ''));
                }
                else {
                    var splitString = defaultString.split('%d');
                    replaceRegex = [];
                    for (var _i = 0, splitString_1 = splitString; _i < splitString_1.length; _i++) {
                        var split = splitString_1[_i];
                        replaceRegex.push(new RegExp(split));
                    }
                }
                var getId = function (identifier) {
                    var id;
                    if (Array.isArray(replaceRegex)) {
                        id = identifier;
                        for (var _i = 0, replaceRegex_1 = replaceRegex; _i < replaceRegex_1.length; _i++) {
                            var reg = replaceRegex_1[_i];
                            id = id.replace(reg, '');
                        }
                    }
                    else {
                        id = identifier.replace(replaceRegex, '');
                    }
                    // If the id after replacement is not a number, or the length is the same as before,
                    //  it has been customised so return 0
                    if (isNaN(+id) || id.length === identifier) {
                        return 0;
                    }
                    // Otherwise return the number that has been assigned previously
                    else {
                        return +id;
                    }
                };
                // Extract the numbers from the identifiers that use the standard naming convention
                var identifiers = prevStates
                    .map(function (state) { return getId(state.s.identifier); })
                    .sort(function (a, b) { return +a < +b ?
                    1 :
                    +a > +b ?
                        -1 :
                        0; });
                var lastNumber = identifiers[0];
                dt.stateRestore.state.add(dt.i18n('buttons.stateRestore', 'State %d', lastNumber !== undefined ? lastNumber + 1 : 1), config.config);
                var states = dt.stateRestore.states().sort(function (a, b) {
                    var aId = +getId(a.s.identifier);
                    var bId = +getId(b.s.identifier);
                    return aId > bId ?
                        1 :
                        aId < bId ?
                            -1 :
                            0;
                });
                var stateButtons = [];
                if (stateRestoreOpts._createInSaved) {
                    stateButtons.push('createState');
                    stateButtons.push('');
                }
                for (var _a = 0, states_3 = states; _a < states_3.length; _a++) {
                    var state = states_3[_a];
                    var split = [];
                    if (stateRestoreOpts.save) {
                        split.push('updateState');
                    }
                    if (stateRestoreOpts.save && stateRestoreOpts.rename) {
                        split.push('renameState');
                    }
                    if (stateRestoreOpts.remove) {
                        split.push('removeState');
                    }
                    if (split.length > 0) {
                        split.unshift('<h3>' + state.s.identifier + '</h3>');
                    }
                    stateButtons.push({
                        _stateRestore: state,
                        config: {
                            split: split
                        },
                        extend: 'stateRestore',
                        text: state.s.identifier
                    });
                }
                dt.button('SaveStateRestore:name').collectionRebuild(stateButtons);
                node.blur();
            },
            init: function (dt, node, config) {
                if (dt.settings()[0]._stateRestore === undefined && dt.button('SaveStateRestore:name').length > 1) {
                    _buttonInit(dt, config);
                }
            },
            text: function (dt) {
                return dt.i18n('buttons.createState', 'Create State');
            }
        };
        $.fn.dataTable.ext.buttons.removeState = {
            action: function (e, dt, node, config) {
                config.parent._stateRestore.remove();
                node.blur();
            },
            text: function (dt) {
                return dt.i18n('buttons.removeState', 'Remove');
            }
        };
        $.fn.dataTable.ext.buttons.removeAllStates = {
            action: function (e, dt, node) {
                dt.stateRestore.states().remove(true);
                node.blur();
            },
            text: function (dt) {
                return dt.i18n('buttons.removeAllStates', 'Remove All States');
            }
        };
        $.fn.dataTable.ext.buttons.renameState = {
            action: function (e, dt, node, config) {
                var states = dt.settings()[0]._stateRestore.s.states;
                var ids = [];
                for (var _i = 0, states_4 = states; _i < states_4.length; _i++) {
                    var state = states_4[_i];
                    ids.push(state.s.identifier);
                }
                config.parent._stateRestore.rename(undefined, ids);
                node.blur();
            },
            text: function (dt) {
                return dt.i18n('buttons.renameState', 'Rename');
            }
        };
        function _init(settings, options) {
            if (options === void 0) { options = null; }
            var api = new dataTable.Api(settings);
            var opts = options
                ? options
                : api.init().stateRestore || dataTable.defaults.stateRestore;
            var stateRestore = new StateRestoreCollection(api, opts);
            _stateRegen(api, stateRestore);
            return stateRestore;
        }
        /**
         * Initialisation function if initialising using a button
         *
         * @param dt The datatables instance
         * @param config the config for the button
         */
        function _buttonInit(dt, config) {
            var SRC = new $.fn.dataTable.StateRestoreCollection(dt, config.config);
            _stateRegen(dt, SRC);
        }
        function _stateRegen(dt, src) {
            var states = dt.stateRestore.states();
            var stateButtons = [];
            var stateRestoreOpts = dt.settings()[0]._stateRestore.c;
            if (stateRestoreOpts._createInSaved) {
                stateButtons.push('createState');
            }
            if (states === undefined || states.length === 0) {
                stateButtons.push('<span class="' + src.classes.emptyStates + '">' +
                    dt.i18n('stateRestore.emptyStates', src.c.i18n.emptyStates) +
                    '</span>');
            }
            else {
                for (var _i = 0, states_5 = states; _i < states_5.length; _i++) {
                    var state = states_5[_i];
                    var split = [];
                    if (stateRestoreOpts.save) {
                        split.push('updateState');
                    }
                    if (stateRestoreOpts.save && stateRestoreOpts.rename) {
                        split.push('renameState');
                    }
                    if (stateRestoreOpts.remove) {
                        split.push('removeState');
                    }
                    if (split.length > 0) {
                        split.unshift('<h3>' + state.s.identifier + '</h3>');
                    }
                    stateButtons.push({
                        _stateRestore: state,
                        config: {
                            split: split
                        },
                        extend: 'stateRestore',
                        text: state.s.identifier
                    });
                }
            }
            dt.button('SaveStateRestore:name').collectionRebuild(stateButtons);
        }
        // Attach a listener to the document which listens for DataTables initialisation
        // events so we can automatically initialise
        $(document).on('preInit.dt.dtsr', function (e, settings) {
            if (e.namespace !== 'dt') {
                return;
            }
            if (settings.oInit.stateRestore ||
                dataTable.defaults.stateRestore) {
                if (!settings._stateRestore) {
                    _init(settings, null);
                }
            }
        });
    }));

}());
