console.log('Loading function');

const aws = require('aws-sdk');
var transcribeservice = new aws.TranscribeService({apiVersion: '2017-10-26'});

exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    const awsRegion = event.Records[0].awsRegion;
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    
    const url = "https://s3-" + awsRegion + ".amazonaws.com/" + bucket + "/" + key;

    const params = {
      LanguageCode: "en-US",
      Media: { 
        MediaFileUri: url
      },
      MediaFormat: "mp3",
      TranscriptionJobName: key,
      OutputBucketName: "io-webnostic-transcription"
    };
    
    try {
        console.log('--> Transcribe params: ', JSON.stringify(params));
        const { TranscriptionJob } = await transcribeservice.startTranscriptionJob(params).promise();
        console.log('--> Job: ', JSON.stringify(TranscriptionJob));
        return TranscriptionJob;
    } catch (err) {
        console.log(err);
        throw new Error(err);
    }
};


