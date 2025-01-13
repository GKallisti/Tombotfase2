'use strict';

const Locations = require("../data/locations.json");

module.exports = {
  metadata: {
    name: 'ORhandler',
    eventHandlerType: 'ResolveEntities',
    supportedActions: [] // Definir transiciones si es necesario
  },
  handlers: {
    entity: {
      /**
       * Resolved handler to validate the resolution of all items.
       * @param {EntityBaseEvent} event
       * @param {EntityResolutionContext} context
       */
      resolved: async (event, context) => {
        let SourceLocation = context.getItemValue("SourceLoc");
        let DestinationLocation = context.getItemValue("DestinationLoc");
        let LineItemLE = context.getItemValue("LineItemLE");
        context.logger.info(LineItemLE);





      },
    },
  }

};

