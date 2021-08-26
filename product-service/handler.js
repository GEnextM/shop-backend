'use strict';

module.exports.hello = async (event) => {
  var productslist = [{
    "count": 4,
    "description": "Short Product Description1",
    "id": "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
    "price": 2.4,
    "img": "https://vberloge.by/upload/iblock/fda/fda55401c6091b76da7e16e7a386dce1.jpg",
    "title": "Кот 'Барсик'"
    },
    {
      "count": 6,
      "description": "Short Product Description3",
      "id": "7567ec4b-b10c-48c5-9345-fc73c48a80a0",
      "price": 10,
      "img": "https://www.aleshka.by/upload/iblock/527/ikkvi013%20Pink%20Bunny%201.jpg",
      "title": "Вязаная игрушка Кролик"
    }]

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(productslist)
          
  };
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
