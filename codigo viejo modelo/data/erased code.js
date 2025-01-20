   // if viejo
//  if ( keyphrases1 && keyphrases2 ) {
//   context.reply(` The most rated intent is ${keyphrases1} and ${keyphrases2} `)
//   context.reply( message )
    
// } else {
//   context.reply( `Greetings - ${keyphrases1} ` )
// }

// // condicional para el caso de dos o mas intents
// const keysData = require("../data/data.json");
// const { json } = context.properties();

// const int = JSON.parse(json);

// // Parámetro para el número de intents que quieres manejar
// const numberOfIntents = 2;

// let intents = [];
// let keys = {};
// let keyphrases = {};

// // Asignación de intents y concatenación de 'kyp'
// for (let i = 0; i < numberOfIntents; i++) {
//     if (int.intentMatches.summary.length > i) {
//         let intent = int.intentMatches.summary[i].intent;
//         intents.push(intent);
//         keys[`key${i + 1}`] = `kyp.${intent}`;
//     }
// }

// // Búsqueda de keyphrases en el objeto keysData
// for (let h = 0; h < intents.length; h++) {
//     let key = keys[`key${h + 1}`];
//     if (key) {
//         keyphrases[`keyphrases${h + 1}`] = keysData[key];
//     }
// }


// crear cards

// const mf = context.getMessageFactory();
// const message = mf.createCardMessage()
//   .setLayout(CardLayout.horizontal)
//   .addCard(mf.createCard(` The most rated intent is ${intent1} `)
//   .setDescription(`these are the keyphrases: ${keyphrases1} `)
//     .addAction(mf.createPostbackAction('Help link', { action: 'Help link' })))
//   .addCard(mf.createCard(` The second most rated intent is ${intent2} `)
//     .setDescription(`these are the keyphrases: ${keyphrases2} `)
//     .addAction(mf.createPostbackAction('Help link', { action: 'Help Link' })))

// const mf = context.getMessageFactory();
// const message = mf.createCardMessage()
//   .setLayout(CardLayout.horizontal);

// for (let i = 0; i < intents.length; i++) {
//     let intent = intents[i];
//     let keyphrase = keyphrases[`keyphrases${i + 1}`];
//     message.addCard(mf.createCard(`The most rated intent is ${intent}`)
//       .setDescription(`These are the keyphrases: ${keyphrase}`)
//       .addAction(mf.createPostbackAction('Help link', { action: 'Help link' })));
// }





  //codigo experimental de keyphrases como objeto
  // const fetchHighlight = async (keyphrase) => {
  //   try {
  //     const url = `https://docs.oracle.com/apps/ohcsearchclient/api/v1/search/pages?q=${encodeURIComponent(keyphrase)}&showfirstpage=false&size=5&product=en/cloud/saas/transportation/24c`;
  //     const response = await fetch(url);
      
  //     if (response.status === 200) {
  //       const data = await response.json();
  //       context.logger().info("Successful fetch for keyphrase: " + keyphrase);
        
  //       if (data && data.hits && data.hits.length > 0 && data.hits[0].highlight && data.hits[0].highlight.body) {
  //         return data.hits[0].highlight.body;
  //       } else {
  //         context.logger().warn("No highlight found for keyphrase: " + keyphrase);
  //         return null;
  //       }
  //     } else {
  //       context.logger().warn("HTTP status code: " + response.status + " for keyphrase: " + keyphrase);
  //       return null;
  //     }
  //   } catch (error) {
  //     context.logger().error("Fetch error for keyphrase: " + keyphrase + " - " + error.message);
  //     return null;
  //   }
  // };
  
  // // Función principal para procesar todas las keyphrases
  // const processKeyphrases = async (keyphrases) => {
  //   const highlightPromises = Object.values(keyphrases).map(fetchHighlight);
  //   const highlights = await Promise.all(highlightPromises);
  
  //   // Filtrar nulls y crear las cards
  //   const validHighlights = highlights.filter(h => h !== null);
    
  //   if (validHighlights.length > 0) {
  //     const message = mf.createCardMessage().setLayout(CardLayout.horizontal);
      
  //     validHighlights.forEach((highlight, index) => {
  //       message.addCard(mf.createCard(`Highlight for keyphrase ${index + 1}`)
  //         .setDescription(highlight)
  //         .addAction(mf.createPostbackAction('Help link', { action: 'Help link' })));
  //     });
      
  //     context.reply(message);
  //   } else {
  //     context.logger().warn("No valid highlights found for any keyphrases.");
  //     context.transition('failure');
  //   }
  // };
  
  // // Llamada a la función principal
  // processKeyphrases(keyphrases).then(() => done()).catch(error => {
  //   context.logger().error("Error in processing keyphrases: " + error.message);
  //   context.transition('failure');
  //   done();
  // });






  last version


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
    //let intent2 = null;
  
    if (int.intentMatches.summary.length > 0) {
      intent1 = int.intentMatches.summary[0].intent;
    }
  
    // if (int.intentMatches.summary.length > 1) {
    //   intent2 = int.intentMatches.summary[1].intent;
    // }
  
    // Data de keyphrases
    let key1 = null;
   // let key2 = null;
    let keyphrases1 = null;
    //let keyphrases2 = null;
  
    if (intent1) {
      key1 = `kyp.${intent1}`;
      keyphrases1 = keys[key1];
    }
  
    // if (intent2) {
    //   key2 = `kyp.${intent2}`;
    //   keyphrases2 = keys[key2];
    // }
    context.logger().info("Successful json and keyphrase retrieval");

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
            const decoded = firstHighlight.replace(/\\u([\dA-F]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
            const decodedHtml = decoded.replace(/&gt;/g, '>')
                                  .replace(/&lt;/g, '<')
                                  .replace(/&amp;/g, '&')
                                  .replace(/&quot;/g, '"')
                                  .replace(/&apos;/g, "'")
                                  .replace(/<em>/g, ' ')
                                  .replace(/<\/em>/g, ' ')
                                  .replace(/× menu-close☰ menu  Home:/, '');

            const mf = context.getMessageFactory();
            const message = mf.createCardMessage()
              .setLayout(CardLayout.horizontal)
              .addCard(mf.createCard(title) // Usa el título en lugar del keyphrase
                .setDescription(decodedHtml)
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
    // if (keyphrases2) {
    //   await fetchKeyphrase(keyphrases2);
    // }
  
  }
  
  };
