const AWS = require('aws-sdk');
const BUCKET = 'import-service-genext';
const csv = require('csv-parser');
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const generatePolicy = (principalId, resource, effect = 'Allow') => {
    return {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
}

module.exports = {
    basicAuthorizer: async function(event) {
        console.log("Event: ", JSON.stringify(event));

        if(event['type'] != 'TOKEN')
            cb('Unauthorized');
        
        try {
            const authorizationToken = event.authorizationToken;

            const encodedCreds = authorizationToken.split(' ')[1];
            const buff = Buffer.from(encodedCreds, 'base64');
            const plainCreds = buff.toString('utf-8').split(':');
            const username = plainCreds[0];
            const password = plainCreds[1];

            console.log(`username: ${username} and password: ${password}`);

            const storedUserPassword = process.env[username];
            const effect = !storedUserPassword || storedUserPassword != password ? 'Deny' : 'Allow';

            const policy = generatePolicy(encodedCreds, event.methodArn, effect);

            cb(null,policy);
        } catch (e) {
            cb(`Unauthorized: ${e.message}`);
        }
    },

    catalogsList: async function() {
        const s3 = new AWS.S3({ region: 'eu-west-1', signatureVersion: 'v4'});
        const params = {
            Bucket: BUCKET,
            Prefix: 'uploaded/',
            Delimiter: '/'
        };

        const catalogs = await s3.listObjects(params).promise()
        const response = {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify(catalogs.Contents.map(catalog => catalog.Key.replace(catalogs.Prefix, '')))
        };
        return response

    },

    catalogUpload: async function(event) {
        const catalogName = event.queryStringParameters.name;
        const catalogPath = `uploaded/${catalogName}`;

        const s3 = new AWS.S3({ region: 'eu-west-1' , signatureVersion: 'v4'});
        const params = {
            Bucket: BUCKET,
            Key: catalogPath,
            Expires: 60,
            ContentType: 'text/csv'
        };

        return new Promise((resolve, reject) => {
            s3.getSignedUrl('putObject', params, (error, url) => {
                if (error) {
                    return reject(err);
                }

                resolve({
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Credentials': true,
                      },
                    body:url
                });
            })
        });
    },

    catalogParse: function(event) {
        const s3 = new AWS.S3({ region: 'eu-west-1'});
        const SERVICE_ENDPOINT ='https://fkwo5idvi2.execute-api.eu-west-1.amazonaws.com/dev/users'; // сюда кидаю пост
        const sqs = new AWS.SQS(); 
        
        event.Records.forEach(record => {
            const s3Stream = s3.getObject({
                Bucket: BUCKET,
                Key: record.s3.object.key
            }).createReadStream();

            s3Stream.pipe(csv())
                .on('data', (data) => {
                    console.log(data);
                    // Тест
                    const newdata = JSON.stringify(data);
                    sqs.sendMessage({
                        QueueUrl: process.env.SQS_URL,
                        MessageBody: newdata
                    }, () => {
                        console.log('Send message for: ' + newdata);
                    });
                    // Конец теста
                })
                .on('end', async () => {
                    console.log('Copy from' + BUCKET + '/' + record.s3.object.key);

                    await s3.copyObject({
                        Bucket: BUCKET,
                        CopySource: BUCKET + '/' + record.s3.object.key,
                        Key: record.s3.object.key.replace('uploaded', 'parsed')
                    }).promise();

                    console.log('Copied into ' + BUCKET + '/' + record.s3.object.key.replace('uploaded', 'parsed'))
                });
        });
    },

    
    // SNS SQS
    catalogBatchProcess: async function(event) { //читает из очереди
        const products = event.Records.map(({ body }) => body);
        const jsonProducts = JSON.stringify(products);
        console.log('DATA: ' + jsonProducts);
        const snsClient = new SNSClient({});
        const publishCommand = new PublishCommand({
            TopicArn: 'arn:aws:sns:eu-west-1:180491745427:sqs-sns-topic-task6', //proccess.env.SNS_ARN,
            Subject: 'Import Service - Product import',
            Message:'<h1>Hello</h1>\n' + jsonProducts
        });
    

        const result = await snsClient.send(publishCommand);


        // const result = await snsClient.send(publishCommand);
        // console.log("RESULT:" + result);
        // console.log("EVENT" + event.body);
        // console.log("DATA: " + JSON.parse(event.body));
        
        // const users = event.Records.map(({ body }) => body);
        // const sns = new AWS.SNS({ region: 'us-west-1' });
        // const test = "TEST TEXT SNS";
        // sns.publish({
        //     Subject: 'HELLO FROM SNS',
        //     Message: 'TEST TEXT SEND VIA EMAIL',
        //     TopicArn: process.env.SNS_ARN
        // }, () => {
        //     console.log('Send email for: ' + process.env.SNS_ARN);
        // })

        // console.log(users);
    }
    // userSubmit: function(event, context, callback) {
    //     const sqs = new AWS.SQS(); 
    //     const users = JSON.parse(event.body);
    //     const test = "TEST TEXT SQS";
    //     users.forEach(user => {
    //         sqs.sendMessage({
    //             QueueUrl: process.env.SQS_URL,
    //             MessageBody: user
    //         }, () => {
    //             console.log('Send message for: ' + user);
    //         });
    //     });

    //     callback(null, {
    //         statusCode: 200,
    //         headers: {
    //             'Access-Control-Allow-Origin': '*'
    //         }
    //     });
    // },



}