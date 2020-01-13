const serverless = require('serverless-http');
const express = require('express');
const s3 = require('aws-sdk/clients/s3');
const v5 = require('uuid/v5');
const env = require('env-var');
const bodyParser = require('body-parser');

const app = new express();

const plainTextParser = bodyParser.text();

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500).json({ message: 'Internal Server Error'});
});

function newS3Client() {
    return new s3({ params: { Bucket: env.get('BUCKET').required().asString() } });
}

function getAuthor() {
    return 'anonymous';
}

app.get('/', async (req, res) => {
    const client = newS3Client();
    const maxItems = req.query.maxItems || 20;
    const token = req.query.token;
    res.status(200).json(await getMessages(client, parseInt(maxItems), token));
});

app.post('/', plainTextParser, async ({ body: message }, res) => {
    const client = newS3Client();
    const entry = await writeMessage(client, message, getAuthor());
    res.status(201).json(entry);
});

function ninesComplement(date) {
    return date.toISOString().split('')
        .map(c => {
            const n = parseInt(c);
            if (isNaN(n)) return c;
            else return (9 - n).toString()
        }).join('');
}

async function writeMessage(client, message, author) {
    const namespace = v5(author, v5.URL);
    const id = v5(message, namespace);
    const date = new Date();
    const Key = `${ninesComplement(date)}/${id}`;
    const body = { message, date: date.toISOString(), author };
    await client.putObject({ Key, Body: JSON.stringify(body) }).promise();
    return body;
}

async function getMessages(client, maxItems, token) {
    const { Contents, NextContinuationToken } = await client.listObjectsV2({
        MaxKeys: maxItems,
        ContinuationToken: token || 
            new Buffer(token, 'base64').toString('ascii')
    }).promise();

    const res = await Promise.all(Contents
        .map(({ Key }) => client.getObject({ Key }).promise()));

    return {
        Items: res.map(({ Body }) => JSON.parse(Body)),
        NextToken: NextContinuationToken || 
            new Buffer(NextContinuationToken, 'ascii').toString('base64')
    }
}

module.exports.lambdaHandler = serverless(app);
