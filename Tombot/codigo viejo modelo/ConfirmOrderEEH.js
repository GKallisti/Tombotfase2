"use strict";

// node fetch API can be used to make REST calls, see https://www.npmjs.com/package/node-fetch
const fetch = require("node-fetch");

module.exports = {
    metadata: {
        name: "ConfirmOrderEEH",
        eventHandlerType: "ResolveEntities",
        supportedActions: [], // string array of transition actions that might be set by the event handler
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
                let userResponse = context.getItemValue('confirmation');
                let userType = context.getVariable('skill.userType');
                context.logger().info(`Received user response: ${JSON.stringify(userResponse)}`);
                let transition;
                if (userResponse.primaryLanguageValue == 'Yes') {
                    let orderNumber = Math.floor((Math.random() * 100000) + 100000).toString();
                    context.setVariable('skill.orderNumber', orderNumber);
                    let repeatOrderFlag = context.getVariable('repeatOrderFlag');
                    context.logger().info(`Repeat order flag: ${JSON.stringify(repeatOrderFlag)}`)
                    if (repeatOrderFlag == true) {
                        context.setVariable('skipOrderConfirmation', true);
                    }
                    context.setVariable('user.pizza', context.getVariable('pizza'))
                    transition = 'placeOrder';
                } else {
                    if (userType == 'returning') {
                        // changing the user type to avoid infinite looping
                        context.setVariable('skill.userType', 'new');
                        transition = 'newOrder';
                    } else {
                        transition = 'cancelOrder';
                    }
                }
                if (transition) {
                    context.logger().info("confirmOrderEEH :: transitioning to \"" + transition + "\"");
                    context.getResponse().transitionAction = transition;
                }
            }

        }
    },
};