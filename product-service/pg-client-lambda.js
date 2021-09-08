'use strict'

const { Client } = require('pg');


const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;
const dbOptions = {
    host: PG_HOST,
    port: PG_PORT,
    database: PG_DATABASE,
    user: PG_USERNAME,
    password: PG_PASSWORD,
    ssl: {
        rejectUnathorized: false
    },
    connectionTimeoutMillis: 5000
};

module.exports.invoke = async event => {
    const client = new Client(dbOptions);
    await client.connect();

    try {
        // make ddl query
        const ddlResult = await client.query(`
            create table if not exists todo_list (
                id serial primary key,
                list_name text,
                list_description text
            )`);

        const ddlResult2 = await client.query(`
            create table if not exists todo_list (
                id serial primary key,
                list_id integer,
                item_name text,
                item_description text,
                foreign key ("list_id") references "todo_list" ("id")
            )`);

            // initial dml queries
        const dmlResult = await client.query(`
            insert into todo_list (list_name, list_description) values
            ('Important', 'Important thing to do'),
            ('Secondary', 'Minor matters')
        `);

        const dmlResult2 = await client.query(`
            insert into todo_item (list_id, item_name, item_description) values
            (1, 'Learn Lambda', 'Learn how to work with Amazon Lambda.'),
            (1, 'Learn Lambda2', 'Learn how to work with Amazon Lambda2.'),
            (2, 'Learn genext', 'Learn how to work with Amazon Genext.');
        `);

        const { rows: todo_items } = await client.query(`select * from todo_item`);
        console.log(todo_items);

    } catch (err) {
        console.error('Error during database request executing', err);
    } finally {
        client.end();
    }




};