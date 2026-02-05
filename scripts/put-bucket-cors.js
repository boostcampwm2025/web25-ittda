#!/usr/bin/env node
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

function usage() {
  console.error(
    'Usage: node scripts/put-bucket-cors.js <bucket> <cors-xml-path> [region] [endpoint]',
  );
  console.error('Example: node scripts/put-bucket-cors.js ittda-prod-assets cors.xml');
  process.exit(1);
}

const bucket = process.argv[2];
const xmlPath = process.argv[3];
const region = process.argv[4] || 'kr-standard';
const endpoint = process.argv[5] || 'https://kr.object.ncloudstorage.com';

if (!bucket || !xmlPath) usage();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
if (!accessKeyId || !secretAccessKey) {
  console.error('Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY');
  process.exit(1);
}

const body = fs.readFileSync(xmlPath);
const host = endpoint.replace(/^https?:\/\//, '');
const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
const dateStamp = amzDate.slice(0, 8);
const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
const contentMd5 = crypto.createHash('md5').update(body).digest('base64');

const canonicalUri = `/${bucket}`;
const canonicalQueryString = 'cors=';
const canonicalHeaders =
  `content-md5:${contentMd5}\n` +
  'content-type:application/xml\n' +
  `host:${host}\n` +
  `x-amz-content-sha256:${payloadHash}\n` +
  `x-amz-date:${amzDate}\n`;
const signedHeaders =
  'content-md5;content-type;host;x-amz-content-sha256;x-amz-date';
const canonicalRequest = [
  'PUT',
  canonicalUri,
  canonicalQueryString,
  canonicalHeaders,
  signedHeaders,
  payloadHash,
].join('\n');

const stringToSign = [
  'AWS4-HMAC-SHA256',
  amzDate,
  `${dateStamp}/${region}/s3/aws4_request`,
  crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
].join('\n');

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
const kRegion = hmac(kDate, region);
const kService = hmac(kRegion, 's3');
const kSigning = hmac(kService, 'aws4_request');
const signature = crypto
  .createHmac('sha256', kSigning)
  .update(stringToSign, 'utf8')
  .digest('hex');

const authorization =
  `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/${region}/s3/aws4_request, ` +
  `SignedHeaders=${signedHeaders}, Signature=${signature}`;

const options = {
  method: 'PUT',
  host,
  path: `/${bucket}?cors`,
  headers: {
    Host: host,
    'Content-Type': 'application/xml',
    'Content-MD5': contentMd5,
    'Content-Length': String(body.length),
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
    Authorization: authorization,
  },
};

const req = https.request(options, (res) => {
  const chunks = [];
  res.on('data', (d) => chunks.push(d));
  res.on('end', () => {
    const text = Buffer.concat(chunks).toString('utf8');
    console.log(`status=${res.statusCode}`);
    if (text) console.log(text);
  });
});
req.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
req.write(body);
req.end();
