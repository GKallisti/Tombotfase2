'use strict';

// Documentation for writing custom components: https://github.com/oracle/bots-node-sdk/blob/master/CUSTOM_COMPONENT.md

// You can use your favorite http client package to make REST calls, however, the node fetch API is pre-installed with the bots-node-sdk.
// Documentation can be found at https://www.npmjs.com/package/node-fetch
// Un-comment the next line if you want to make REST calls using node-fetch. 
// const fetch = require("node-fetch");
const { MessageFactory, CardLayout } = require('@oracle/bots-node-sdk/typings/lib2');
const keys = require("../data/data.json");
const fetch = require("node-fetch");
const { CustomComponentContext } = require ('@oracle/bots-node-sdk/lib');

module.exports = {
  metadata: () => ({
    name: 'tombotintenthandler',
    properties: {
      json: { required: true, type: 'string' },
    },
    supportedActions: [ 'success']
  }),

 
  /**
   * invoke method gets called when the custom component state is executed in the dialog flow
   * @param {CustomComponentContext} context 
   */
  invoke: async (context) => {
    
    const { json } = context.properties();
    const int = JSON.parse(json);
  
    let intent1 = null;
  
    if (int.intentMatches.summary.length > 0) {
      intent1 = int.intentMatches.summary[0].intent;
    }
  
    // Data de keyphrases
    let key1 = null;
    let keyphrases1 = null;
  
    if (intent1) {
      key1 = `kyp.${intent1}`;
      keyphrases1 = keys[key1];
    }

    context.logger().info("Successful json and keyphrase retrieval");

    // Verificar si keyphrases1 contiene el key1
    if (!keys.hasOwnProperty(key1)) {
      context.logger().warn("Key not found: " + key1);
      context.keepTurn(true);
      context.transition('success');
      return;
    }

    // Función para realizar fetch y manejar la respuesta
    const fetchKeyphrase = async (keyphrase) => {
      const url = `https://docs.oracle.com/apps/ohcsearchclient/api/v1/search/pages?q=${encodeURIComponent(keyphrase)}&showfirstpage=false&size=5&product=en/cloud/saas/transportation/24c`;
  
      try {
        const response = await fetch(url);
        if (response.status === 200) {
          const data = await response.json();
          context.logger().info("Successful data retrieval");
  
          if (data && data.hits && data.hits.length > 0 && data.hits[0].highlight && data.hits[0].highlight.body) {
            const firstHighlight = data.hits[0].highlight.body;
            const title = data.hits[0]._source.title; // Toma el título del primer hit
            const url2 = data.hits[0]._source.url; // Toma la URL del primer hit
           // const decoded = firstHighlight.replace(/\\u([\dA-F]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
            // const decodedHtml = decoded.replace(/&gt;/g, '>')
            //                       .replace(/&lt;/g, '<')
            //                       .replace(/&amp;/g, '&')
            //                       .replace(/&quot;/g, '"')
            //                       .replace(/&apos;/g, "'")
            //                       .replace(/<em>/g, ' ')
            //                       .replace(/<\/em>/g, ' ')
            //                       .replace(/× menu-close☰ menu  Home:/, '');

            const mf = context.getMessageFactory();
            const message = mf.createCardMessage()
              .setLayout(CardLayout.horizontal)
              .addCard(mf.createCard(title) // Usa el título en lugar del keyphrase
                .setDescription('If you want more information about this topic, please follow this link')
                .addAction(mf.createUrlAction('Help link', url2 ))); // Usa la URL en la acción
            
            context.reply(message);
            context.keepTurn(true);
            context.transition('success');

          } else {
            context.logger().warn("No valid data received for keyphrase: " + keyphrase);
            context.transition('failure');
          }
        } else {
          context.logger().warn("HTTP status code: " + response.status + " for keyphrase: " + keyphrase);
          context.transition('failure');
        }
      } catch (error) {
        context.logger().error('Error fetching data for keyphrase: ' + keyphrase, error);
        context.transition('failure');
      }
    };
    context.logger().info("linea despues del fetch")
  
    // Realizar fetch para cada keyphrase
    if (keyphrases1) {
      context.logger().info("linea if call keyphrases1");
      await fetchKeyphrase(keyphrases1);
    }

  }
  
};


 