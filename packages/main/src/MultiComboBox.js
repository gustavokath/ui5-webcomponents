import Bootstrap from "@ui5/webcomponents-base/src/Bootstrap.js";
import UI5Element from "@ui5/webcomponents-base/src/UI5Element.js";
import ValueState from "@ui5/webcomponents-base/src/types/ValueState.js";

import MultiComboBoxRenderer from "./build/compiled/MultiComboBoxRenderer.lit.js";

// Styles
import styles from "./themes/MultiComboBox.css.js";

// all themes should work via the convenience import (inlined now, switch to json when elements can be imported individyally)
import "./ThemePropertiesProvider.js";
import Function from "@ui5/webcomponents-base/src/types/Function";

/**
 * @public
 */
const metadata = {
	tag: "ui5-multi-combobox",
	defaultSlot: "description",
	defaultSlot: "items",
	slots: /** @lends sap.ui.webcomponents.main.MultiComboBox.prototype */ {
		items: {
			type: HTMLElement,
			multiple: true,
			listenFor: { include: ["*"] },
		},
	},
	properties: /** @lends sap.ui.webcomponents.main.MultiComboBox.prototype */ {
		/**
		 * Defines the value of the <code>ui5-multi-combobox</code>.
		 * <br><br>
		 * <b>Note:</b> The property is updated upon typing.
		 *
		 * @type {string}
		 * @public
		 */
		value: {
			defaultValue: "",
			type: String,
		},

		/**
		 * Defines a short hint intended to aid the user with data entry when the
		 * <code>ui5-multi-combobox</code> has no value.
		 * <br><br>
		 * <b>Note:</b> The placeholder is not supported in IE. If the placeholder is provided, it won`t be displayed in IE.
		 * @type {string}
		 * @public
		 */
		placeholder: {
			defaultValue: null,
			type: String,
		},

		/**
		 * Defines if the user input will be prevented if no matching item has been found
		 * 
		 * @type {boolean}
		 * @public
		 */
		validateInput: {
			type: Boolean,
		},

		/**
		 * Defines whether <code>ui5-multi-combobox</code> is in disabled state.
		 * <br><br>
		 * <b>Note:</b> A disabled <code>ui5-input</code> is completely uninteractive.
		 *
		 * @type {boolean}
		 * @public
		 */
		disabled: {
			type: Boolean,
		},

		/**
		 * Defines the value state of the <code>ui5-multi-combobox</code>.
		 * Available options are: <code>None</code>, <code>Success</code>, <code>Warning</code>, and <code>Error</code>.
		 *
		 * @type {string}
		 * @public
		 */
		valueState: {
			type: ValueState,
			defaultValue: ValueState.None,
		},

			/**
		 * Defines whether the <code>ui5-multi-combobox</code> is readonly.
		 * <br><br>
		 * <b>Note:</b> A read-only <code>ui5-multi-combobox</code> is not editable,
		 * but still provides visual feedback upon user interaction.
		 *
		 * @type {boolean}
		 * @public
		 */
		readonly: {
			type: Boolean,
		},

		_showMorePopover: { type: Function },
		_tokenDelete: { type: Function },
		_tokenizerFocusOut: { type: Function },
		_showAllItemsPopover: { type: Function },
		_allItemsSelectionChange: { type: Function },
		_selectedItemsSelectionChange: { type: Function },
		_afterAllPopoverClose: { type: Function },
		_afterAllPopoverOpen: { type: Function },
		_inputChage: { type: Function },
		_filteredItems: { type: Object },
		_iconPressed: { type: Boolean },
	},
	events: /** @lends sap.ui.webcomponents.main.MultiComboBox.prototype */ {
		/**
		 * Fired when the value of the <code>ui5-multi-combobox</code> changes at each keystroke,
		 * and when a suggestion item has been selected.
		 *
		 * @event
		 * @public
		 */
		input: {},

		/**
		 * Fired when selection is changed by user interaction
		 * in <code>SingleSelect</code> and <code>MultiSelect</code> modes.
		 *
		 * @event
		 * @param {Array} items an array of the selected items.
		 * @public
		 */
		selectionChange: {
			detail: {
				items: { type: Array },
			},
		}
	},
};

/**
 * @class
 *
 * <h3 class="comment-api-title">Overview</h3>
 *
 * An entry posted on the timeline.
 *
 * @constructor
 * @author SAP SE
 * @alias sap.ui.webcomponents.main.MultiComboBox
 * @extends UI5Element
 * @tagname ui5-timeline
 * @usestextcontent
 * @public
 */
class MultiComboBox extends UI5Element {
	static get metadata() {
		return metadata;
	}

	static get renderer() {
		return MultiComboBoxRenderer;
	}

	static get calculateTemplateContext() {
		return state => {
			return {
				ctr: state,
				editable: !state.readonly,
				selectedItemsListMode: state.readonly ? "None" : "MultiSelect",
				styles: {
					tokenizer: {
						"border": "none",
						"width": "auto",
						"max-width": "100%",
						"min-width": "0px",
						"height": "100%",
					}
				},
				classes: {
					icon: {
						[`ui5-multi-combobox--icon`]: true,
						[`ui5-multi-combobox-icon-pressed`]: state._iconPressed,
					}
				}
			}
		};
	}

	static get styles() {
		return styles;
	}

	constructor() {
		super();

		this._filteredItems = [];
		this._inputLastValue = "";
		this._deleting = false;

		this._showMorePopover = event => {
			this._togglePopover(true);
		}

		this._showAllItemsPopover = event => {
			this._togglePopover(false);
		}

		this._allItemsSelectionChange = event => {
			this._listSelectionChange(event);
		}

		this._selectedItemsSelectionChange = event => {
			this._listSelectionChange(event);
		}

		this._inputChage = event => {
			const input = event.target;
			const value = input.value;
			const filteredItems = this._filterItems(value);

			if (!filteredItems.length && value && this.validateInput) {
				input.value = this._inputLastValue;
				input.valueState = "Error";

				setTimeout(() => {
					input.valueState = "None";
				}, 2000);
				return;
			}

			this._inputLastValue = input.value;
			this.value = input.value;
			this._filteredItems = filteredItems;

			if (filteredItems.length === 0) {
				this._getPopover().close();
			} else {
				this._getPopover().openBy(this);
			}

			this.fireEvent("input");
		}

		this._tokenDelete = event => {
			const token = event.detail.ref;
			const item = this.items.filter(item => item._id === token.getAttribute("data-ui5-id"))[0];

			item.selected = false;
			this._deleting = true;
		}

		this._tokenizerFocusOut = event => {
			const tokenizer = this.shadowRoot.querySelector('ui5-tokenizer');
			const tokensCount = tokenizer.tokens.length - 1;

			tokenizer.tokens.forEach(token => token.selected = false);

			if (tokensCount === 0 && this._deleting) {
				setTimeout(() => {
					this.shadowRoot.querySelector('ui5-input').focus();
				}, 0);
			}

			this._deleting = false;
		}

		this._afterAllPopoverClose = () => {
			this._toggleIcon();
		}

		this._afterAllPopoverOpen = () => {
			this._toggleIcon();
		}
	}

	_filterItems(value) {
		return this.items.filter(item => {
			return item._nodeText.toLowerCase().startsWith(value.toLowerCase());
		});
	}

	_toggleIcon() {
		this._iconPressed = !this._iconPressed
	}

	_getSelectedItems() {
		return this.items.filter(item => item.selected);
	}

	_listSelectionChange(event) {
		event.target.items.forEach(item => {
			this.items.forEach(mcbItem => {
				if (mcbItem._id === item.getAttribute("data-ui5-token-id")) {
					mcbItem.selected = item.selected;
				}
			});
		});

		this.fireEvent("selectionChange", { items: this._getSelectedItems() });
	}

	_getPopover(isMorePopover) {
		return this.shadowRoot.querySelector(`.ui5-multi-combobox-${isMorePopover ? "selected" : "all"}-items--popover`);
	}

	_togglePopover(isMorePopover) {
		const popover = this._getPopover(isMorePopover);
		const otherPopover = this._getPopover(!isMorePopover);

		if (popover && popover._isOpen) {
			return popover.close();
		}

		otherPopover && otherPopover.close();
		popover && popover.openBy(this);
	}

	onBeforeRendering() {
		this._inputLastValue = this.value;

		const hasSelectedItem = this.items.some(item => item.selected);

		if (!hasSelectedItem) {
			const morePopover = this.shadowRoot.querySelector(`.ui5-multi-combobox-selected-items--popover`);

			morePopover.close();
		}
		
		const input = this.shadowRoot.querySelector("ui5-input");

		if (input && !input.value) {
			this._filteredItems = this.items;
		}

		const filteredItems = this._filterItems(this.value);
		this._filteredItems = filteredItems;
	}

	static async define(...params) {
		await Promise.all([]);

		super.define(...params);
	}
}

Bootstrap.boot().then(_ => {
	MultiComboBox.define();
});

export default MultiComboBox;
