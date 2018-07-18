console.log('Loading function');

const aws = require('aws-sdk');
const dynamo = new aws.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : res,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(JSON.parse(event.body), done);
            break;
        case 'GET':
            var params = {
              Key: {
               "ID": {
                 S: event.queryStringParameters.id
                }
              }, 
              TableName: event.queryStringParameters.tablename
             };
             dynamo.getItem(params, done);
            break;
        case 'POST':
            dynamo.putItem(event.body, done);
            break;
        case 'PUT':
            dynamo.updateItem(JSON.parse(event.body), done);
            break;
        default:
            done(new Error(`Unsupported method "${event.httpMethod}"`));
    }
};
