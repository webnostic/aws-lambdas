console.log('Loading function');

const aws = require('aws-sdk');
const dynamo = new aws.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = (event, context, callback) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const done = (err, response) => { 
        
        var res =  response["Items"][0];
        
        var categories = {}
        for (var it of res.entities["M"]["Entities"]["L"]) {
            var existingVal = categories[it["M"]["Type"]["S"]],
                newVal      = it["M"]["Text"]["S"];
            if(existingVal){
                if(existingVal.indexOf(newVal)==-1){
                    categories[it["M"]["Type"]["S"]] = existingVal + ', '+ newVal; 
                }
            }else{
                categories[it["M"]["Type"]["S"]] = newVal;
            }
        }
        
        var phrases = [];
        for(var it of res.entities["M"]["KeyPhrases"]["L"]) {
            var val = it["M"]["Text"]["S"];
            if(phrases.indexOf(val)==-1){
                phrases.push(val);
            }
        }
        
        var newRes = {
            Entities: categories,
            KeyPhrases: phrases.join(','),
            Sentiment: res.entities["M"]["Sentiment"]["S"]
        }

        callback(null, {
            results: err ? err.message : newRes,
        });
    }

    switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(JSON.parse(event.body), done);
            break;
        case 'GET':
            
            // var params = {
            //   Key: {
            //   "ID": {
            //      S: event.queryStringParameters.id
            //     }
            //   }, 
            //   TableName: event.queryStringParameters.tablename
            //  };
            //  dynamo.getItem(params, done);

            //preferable approach
             var queryParams = {
              ExpressionAttributeValues: {
              ":partitionKeyValue": {
                 S: event.queryStringParameters.id
                }
              }, 
            //   ExpressionAttributeNames: {"#entities": "entities", "#sentiment": "Sentiment", "#keyphrases":"KeyPhrases"},
              KeyConditionExpression: "ID = :partitionKeyValue",
            //   ProjectionExpression: "#entities.#keyphrases", 
            //   FilterExpression: "contains(entities.KeyPhrases, :t)",
            // ProjectionExpression: "contains(entities.KeyPhrases, :t)",
              TableName: event.queryStringParameters.tablename
             }
            
             dynamo.query(queryParams, done);
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
