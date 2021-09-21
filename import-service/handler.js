const AWS = require('aws-sdk');
const BUCKET = 'import-service-genext';
const csv = require('csv-parser');

module.exports = {
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

        event.Records.forEach(record => {
            const s3Stream = s3.getObject({
                Bucket: BUCKET,
                Key: record.s3.object.key
            }).createReadStream();

            s3Stream.pipe(csv())
                .on('data', (data) => {
                    console.log(data);
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

}