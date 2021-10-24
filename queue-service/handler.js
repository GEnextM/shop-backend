const AWS = require('aws-sdk');

module.exports = {
    userSubmit: function(event, context, callback) {
        const sqs = new AWS.SQS(); 
        const users = JSON.parse(event.body);
        const test = "TEST TEXT SQS";
        users.forEach(user => {
            sqs.sendMessage({
                QueueUrl: ProcessingInstruction.env.SQS_URL,
                MessageBody: user
            }, () => {
                console.log('Send message for: ' + user);
            });
        });

        callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        });
    },

    catalogItemsQueue: function(event) { //читает из очереди
        const users = event.Records.map(({ body }) => body);
        const sns = new AWS.SNS({ region: 'us-west-1' });
        const test = "TEST TEXT SNS";
        sns.publish({
            Subject: 'You are invited',
            Message: JSON.stringify(users),
            TopicArn: process.env.SNS_ARN
        }, () => {
            console.log('Send email for: ' + JSON.stringify(users));
        })

        console.log(users);
    }

}