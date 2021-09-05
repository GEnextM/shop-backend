'use strict'

let massiv = require('./data');
let productslist = massiv.productslist;

module.exports.getproductbyid = async(event) => {

    const { id } = event.queryStringParameters;
    var found = productslist.find(product => product.id == id);

    if(found == null) {
      found = "Product not found <3";

      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(found)
  
              
      };
    }

    else {
  
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(found)

            
    };
  }
    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
  }