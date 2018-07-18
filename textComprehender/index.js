console.log('Loading function');

const aws = require('aws-sdk');

const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const comprehend = new aws.Comprehend({ apiVersion: '2017-11-27'});
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));
    
    const bucket = event.Records[0].s3.bucket.name;
    const filename = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  
    //sanity check
    if( (filename.indexOf('.')==0) || (filename.indexOf(".json")==-1) ) {
        var message = "The added file \'"+ filename + "\' won't be send to comprehend API.";
        console.log(message);
        return message;
    }
    
    try {
        const s3Params = {
            Bucket: bucket,
            Key: filename,
            ResponseContentType: "application/json",
        };
        const { Body } = await s3.getObject(s3Params).promise();
        const json = JSON.parse(Body);
        console.log('--> S3 file transcript: ', json["results"]["transcripts"][0]["transcript"]);
        
        var comprehendParams = {
            LanguageCode: "en",
            Text: json["results"]["transcripts"][0]["transcript"]
        }
        console.log('--> Comprehend params: ', comprehendParams);

        const { KeyPhrases } = await comprehend.detectKeyPhrases(comprehendParams).promise();
        console.log('--> KeyPhrases: ', KeyPhrases);          
        
        var dynamoParams = {
            "ReturnItemCollectionMetrics": "SIZE",
            "TableName": "comprehendResults",
            "Item": {
              "ID": filename,
              "entities": KeyPhrases
            }
        }

        const data = await dynamo.putItem(dynamoParams).promise();
        console.log('--> DynamoDB response: ', data);
        return data;
        
    } catch (err) {
        console.log(' Lambda failed: ', err);
        const message = `Error getting object ${filename} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};
