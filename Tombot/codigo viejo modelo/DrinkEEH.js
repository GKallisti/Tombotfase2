'use strict';

// node fetch API can be used to make REST calls, see https://www.npmjs.com/package/node-fetch
const fetch = require("node-fetch");

module.exports = {
  metadata: {
    name: 'DrinkEEH',
    eventHandlerType: 'ResolveEntities',
    supportedActions: [] // string array of transition actions that might be set by the event handler
  },
  handlers: {
    entity: {
      /**
       * Generic fallback handler that is called when item-specific prompt or disambiguate handler is not specified for the item currently being resolved.
       * Used here to provide acknowledgements when a bag item is updated or a bag item value is provided while the user was prompted for another item.
       *
       * @param {object} event - event object contains the following properties:
       * - currentItem: name of item currently being resolved
       * - promptCount: number of times the user is prompted for current item (only set in case of prompt event)
       * - disambiguationValues: JSONArray with a list of values for the current item that match the user input only set in case of disambiguate event)
       * @param {object} context - entity resolution context, see https://oracle.github.io/bots-node-sdk/module-Lib.EntityResolutionContext.html
       */
      publishMessage: async (event, context) => {
        updatedItemsMessage(context);
        outOfOrderItemsMessage(context);
        context.addCandidateMessages();
      },

      /**
       * Handler that gets called when the composite bag entity is resolved. You will typically use this function to call some backend API to 
       * complete the transaction which the composite bag entity collected the data for. If the backend API call return some errors, possibly 
       * forcing you to re-prompt for some invalid bag items, you can do so by simply clearing those bag items. The RE/CRC component will notice 
       * the entity is not fully resolved after all, and will resume prompting for missing bag items.
       *
       * @param {object} event - event object contains no properties for this handler
       * @param {object} context - entity resolution context, see https://oracle.github.io/bots-node-sdk/EntityResolutionContext.html
       */
      resolved: async (event, context) => {
        // save order
        let cartItems = context.getVariable('skill.cartItems') || [];
        cartItems.push(context.getEntity());
        context.setVariable('cartItems', cartItems);          
        // send confirmation message, second argument to addMessage is set to true so we do not release the turn        
        context.addMessage(context.translate('eeh.DrinkEEH.confirmation.text','drinkQuantity,drinkType,drinkSize', context.getItemValue('DrinkQuantity').number, context.getItemValue('DrinkType').value, context.getItemValue('DrinkSize').value), true);
      } 

    },

    items: {

      DrinkQuantity: {

        /**
         * Handler for item-level validations. This handler is only called when the item value is set or updated. If the validity also depends 
         * on other bag item values, the validation rule should be implemented in the validate handler at entity level.
         * Item validation errors can be registered by calling context.addValidationError(itemName,errorMessage). 
         * These validations are in addition to the validations specified using freemarker in the edit composite bag item screen. If a freemarker 
         * validation has already failed for the item, the validate event handler is not called. 
         * Validation fails by calling context.addValidationError, or by returning false. 
         * 
         * Both the item-level validate handler and the entity-level validate handler must succeed for the new item value to be stored in 
         * the composite bag entity.
         * 
         * @param {object} event - event object contains the following properties:
         * - newValue:  the new value entered by the user
         * - oldValue: the old valid value of the bag item (not present when the value was not set yet)
         * - currentItem: name of item currently being resolved
         * @param {object} context - entity resolution context, see https://oracle.github.io/bots-node-sdk/EntityResolutionContext.html
         */
        validate: async (event, context) => {
          if (event.newValue.number < 1) {
            // when ordering a "Cola Zero" the number of drinks is set to 0 :-), we don't want that to happen, so return false here
            return false;
          }
          
        }

      }

    }

  }
};


/**
 * Helper function to show acknowledgement message when a bag item value is updated.
 */
function updatedItemsMessage(context) {
  for (let itemName of context.getItemsUpdated()) {
    let message = "${rb('eeh.common.itemUpdatedMessage',rb('drink." + itemName.toLowerCase() + ".description'), '" + context.getDisplayValue(itemName) + "')}";
    context.addMessage(message);
  }
}

/**
 * Helper function to show acknowledgement message when a bag item value is provided when user was prompted for another bag item.
 */
function outOfOrderItemsMessage(context) {
  for (let itemName of context.getItemsMatchedOutOfOrder()) {
    let message = "${rb('eeh.common.itemExtractedOutOfOrder',rb('drink." + itemName.toLowerCase() + ".description'), '" + context.getDisplayValue(itemName) + "')}";
    context.addMessage(message);
  }
}
