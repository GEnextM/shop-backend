'use strict'

let massiv = require('./data');

let productslist = massiv.productslist;

const { Client } = require('pg');


const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;
const dbOptions = {
    host: PG_HOST,
    port: PG_PORT,
    database: PG_DATABASE,
    user: PG_USERNAME,
    password: PG_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 5000
};

module.exports.getproduct = async(event) => {
  const client = new Client(dbOptions);
  await client.connect();

  try {
      // make ddl query
    //   const ddlResult = await client.query(`
    //       create table if not exists products (
    //         id uuid primary key default uuid_generate_v4(),
    //         title text not null,
    //         description text,
    //         price integer
    //     )`);

    //   const ddlResult2 = await client.query(`
    //       create table if not exists stocks (
    //         count integer,
    //         product_id uuid primary key,
    //         foreign key("product_id") references "products" ("id")
    //     )`);

    //       // initial dml queries
    //   const dmlResult = await client.query(`
    //       insert into todo_list (list_name, list_description) values
    //       ('Important', 'Important thing to do'),
    //       ('Secondary', 'Minor matters')
    //   `);

    //   const dmlResult2 = await client.query(`
    //       insert into todo_item (list_id, item_name, item_description) values
    //       (1, 'Learn Lambda', 'Learn how to work with Amazon Lambda.'),
    //       (1, 'Learn Lambda2', 'Learn how to work with Amazon Lambda2.'),
    //       (2, 'Learn genext', 'Learn how to work with Amazon Genext.');
    //   `);

      const { rows: products } = await client.query(`select * from products INNER JOIN stocks on product_id = id`);
      console.log(products);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(products)
              
      };

  } catch (err) {
      console.error('Error during database request executing', err);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify("Bad Request <3")
              
      };
  } finally {
      client.end();
  }

  
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
}