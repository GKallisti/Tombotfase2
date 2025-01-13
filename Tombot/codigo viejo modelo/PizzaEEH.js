'use strict';

// node fetch API can be used to make REST calls, see https://www.npmjs.com/package/node-fetch
const fetch = require("node-fetch");
let PAGE_SIZE;

module.exports = {
    metadata: {
        name: 'PizzaEEH',
        eventHandlerType: 'ResolveEntities',
        supportedActions: ["nextPage","previousPage"] // string array of transition actions that might be set by the event handler
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

                // if pizza crust is not explicitly specified, default it to 'regular'
                let pizzaCrust = context.getItemValue("PizzaCrust");
                if (pizzaCrust == null || pizzaCrust == undefined) {
                    // since the skill is multi-lingual get the translated value from resource bundles
                    let rbKey = 'eeh.PizzaEEH.pizzaCrust.regular';
                    let crustValue = setEntityValue('list.pizzaCrust', 'regular');
                    //let crustValue = setEntityValue('list.pizzaCrust',context.translate(rbKey));
                    // the above the primaryLanguageValue to the translated value, so change it to english
                    //crustValue.primaryLanguageValue = 'regular';

                    context.setItemValue("PizzaCrust", crustValue);
                }

                // save order
                let cartItems = context.getVariable('skill.cartItems') || [];
                cartItems.push(context.getEntity());
                context.setVariable('cartItems', cartItems);
                // send confirmation message, second argument to addMessage is set to true so we do not release the turn        
                context.addMessage(context.translate('eeh.PizzaEEH.confirmation.text', 'pizzaSize,pizzaType,pizzaCrust', context.getItemValue('PizzaSize').value, context.getItemValue('PizzaType').value, context.getItemValue('PizzaCrust').value));
            },

            /**
             * Handler that gets called when the composite bag entity resolution is started. You can use this handler to perform custom initialization logic,
             * for example to set a default value for a bag item. 
             *
             * @param {object} event - event object contains no properties for this handler
             * @param {object} context - entity resolution context, see https://oracle.github.io/bots-node-sdk/EntityResolutionContext.html
             */
            init: async (event, context) => {
                // get the pizza list from the context variable. In reality, this would come from a REST API. 
                // this is to support proper enumeration and pagination
                // having enumeration 4 and filtering results will return a subset but the enumeration does not change, so if the first 4 items are
                // not a match with the filter, empty cards are rendered for the enumeration size. Since it is not possible to update the enumeration range dynamically,
                // we will use a list with CRC to render cards

                let pizzaList = context.getVariable("pizzaList");

                // get the vegetarian parameter
                let showVegetarian = context.getVariable('showVegetarian');

                // get the pizza info
                let pizzaInfo = getPizzaInfo();

                let filteredList = [];
                // filter vegetarian pizzas or show all the pizzas
                pizzaList.forEach(pizza => {
                    if (!showVegetarian || pizzaInfo[pizza].vegetarian) {
                        let descriptionKey = 'eeh.PizzaEEH.pizzaDescription.' + pizza;
                        let nameKey = 'eeh.PizzaEEH.pizzaName.' + pizza;
                        let pizzaObject = {
                            "name": context.translate(nameKey),
                            "description": context.translate(descriptionKey),
                            "image": pizzaInfo[pizza].image
                        }
                        filteredList.push(pizzaObject);
                    }
                });
                context.variable('pizzaList', filteredList);

            },
        },

        items: {

            PizzaType: {

                /**
                 * Handler that can be used to replace or extend the bot message generated by ResolveEntities (RE) or Common Response Component (CRC) to prompt for the item. 
                 * RE/CRC takes the prompt from the prompts registered in the edit composite bag item screen. 
                 * To use the RE/CRC generated messages, you can call context.addCandidateMessages().
                 * 
                 * @param {object} event - event object contains the following properties:
                 * - promptCount: number of times the user is prompted for current item.
                 * @param {object} context - entity resolution context, see https://oracle.github.io/bots-node-sdk/EntityResolutionContext.html
                 */
                publishPromptMessage: async (event, context) => {
                    let candidateMessage = context.getCandidateMessages()[0];

                    // get the config parameter for max number of items in a single carousel
                    PAGE_SIZE = context.getVariable("system.config.da.PageSize");
                    let pizzas = context.getVariable("pizzaList");
                    let offset = parseInt(context.getVariable("offset"));

                    let messageModel = context.getMessageModel();

                    let cards = [];

                    // construct cards based on the page size
                    paginate(pizzas, offset).forEach(pizza => {
                        const actionKeywords = [pizza.name];
                        let orderButton = messageModel.postbackActionObject(`Order ${pizza.name}`,
                            null, {
                                variables: {
                                    pizza: pizza.name
                                }
                            }, actionKeywords);
                        let pizzaCard = messageModel.cardObject(pizza.name, pizza.description, pizza.image, null, [orderButton]);
                        cards.push(pizzaCard);
                    })

                    //get the default message prompt for this bag item
                    const globalActions = [];

                    // add pagination buttons if needed.
                    globalActions.push(...addPaginationButtons(context, offset, pizzas));

                    // get the prompt from dialog engine and construct a message bubble
                    let newPrompt = messageModel.textConversationMessage(candidateMessage.text);

                    // construct the cards for response
                    let cardMessage = messageModel.cardConversationMessage("horizontal", cards);

                    //add global actions to the carousel
                    cardMessage = messageModel.addGlobalActions(cardMessage, globalActions);

                    // // send the text message
                    context.addMessage(newPrompt);

                    // // send the card message
                    context.addMessage(cardMessage);
                }

            }

        }

    }
};

function getPizzaInfo() {
    let pizzas = {
        "Cheese Basic": {
            "image": "https://cdn.pixabay.com/photo/2017/09/03/10/35/pizza-2709845__340.jpg",
            "vegetarian": true
        },
        "Pepperoni": {
            "image": "https://cdn.pixabay.com/photo/2017/08/02/12/38/pepperoni-2571392__340.jpg",
            "vegetarian": false
        },
        "Meat Lover": {
            "image": "https://cdn.pixabay.com/photo/2017/07/22/22/51/big-2530144__340.jpg",
            "vegetarian": false
        },
        "Supreme": {
            "image": "https://cdn.pixabay.com/photo/2017/07/22/22/57/pizza-2530169__340.jpg",
            "vegetarian": false
        },
        "Premium Garden Veggie": {
            "image": "https://cdn.pixabay.com/photo/2017/07/22/22/57/pizza-2530169__340.jpg",
            "vegetarian": true
        },
        "Ultimate Cheese Lover": {
            "image": "https://cdn.pixabay.com/photo/2017/08/02/12/38/pepperoni-2571392__340.jpg",
            "vegetarian": true
        },
        "Hawaiian Chicken": {
            "image": "https://cdn.pixabay.com/photo/2017/07/22/22/51/big-2530144__340.jpg",
            "vegetarian": false
        },
        "Bacon Spinach Alfredo": {
            "image": "https://cdn.pixabay.com/photo/2017/09/03/10/35/pizza-2709845__340.jpg",
            "vegetarian": false
        }
    }
    return pizzas;
}

/**
 * Helper function to show acknowledgement message when a bag item value is updated.
 */
function updatedItemsMessage(context) {
    for (let itemName of context.getItemsUpdated()) {
        let message = "${rb('eeh.common.itemUpdatedMessage','itemName,value',rb('pizza." + itemName.toLowerCase() + ".description'), '" + context.getDisplayValue(itemName) + "')}";
        context.addMessage(message);
    }
}

/**
 * Helper function to show acknowledgement message when a bag item value is provided when user was prompted for another bag item.
 */
function outOfOrderItemsMessage(context) {
    for (let itemName of context.getItemsMatchedOutOfOrder()) {
        let message = "${rb('eeh.common.itemExtractedOutOfOrder','itemName,value',rb('pizza." + itemName.toLowerCase() + ".description'), '" + context.getDisplayValue(itemName) + "')}";
        context.addMessage(message);
    }
}

/*
 * Helper function to construct and return a full entity object.
 */

function setEntityValue(type, value) {
    let updatedEntity = {};
    updatedEntity.entityName = type;
    updatedEntity.canonicalName = value;
    updatedEntity.originalString = value;
    updatedEntity.type = type;
    updatedEntity.value = value;
    updatedEntity.primaryLanguageValue = value;
    return updatedEntity;
}


/*
 * generic function to add a global action to a prompt
 * returns: message object
 */
function addGlobalActionButton(message, action) {
    const globalActions = message.globalActions || [];
    globalActions.push(action);
    message.globalActions = globalActions;
    return message;
}

function paginate(dataset, offset) {
    const length = dataset.length;
    let endIndex = offset * PAGE_SIZE;
    let startIndex;
    if (endIndex <= length) {
        startIndex = endIndex - PAGE_SIZE;
    } else if (endIndex > length && dataset[endIndex - PAGE_SIZE]) {
        startIndex = endIndex - PAGE_SIZE;
        endIndex = length;
    }
    return dataset.slice(startIndex, endIndex)
}

// Add pagination buttons if needed
function addPaginationButtons(context, offset, dataset) {

    // Pagination Global Actions
    const globalActions = [];

    // Get MessageModel
    const messageModel = context.getMessageModel();

    // Add "Next Action" if there are more items to display
    if (offset * PAGE_SIZE < dataset.length) {
        const nextAction = messageModel.postbackActionObject(context.translate('eeh.PizzaEEH.showMore.label'), null, {
            action: 'nextPage',
            variables: {
                offset: offset + 1
            }
        });
        globalActions.push(nextAction);
    }

    // Add "Previous Action" if there are items to navigate back too
    if (offset * PAGE_SIZE - PAGE_SIZE > 0) {
        const previousAction = messageModel.postbackActionObject(context.translate('eeh.PizzaEEH.showPrevious.label'), null, {
            action: 'previousPage',
            variables: {
                offset: offset - 1
            }
        });
        globalActions.push(previousAction);
    }

    return globalActions;
}