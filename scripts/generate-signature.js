const crypto = require('crypto');

const payload = JSON.stringify({resource:{status:'SUCCEEDED'},jobId:'6b6e3074-878f-4674-bef5-795af973fe4b'});
const secret = 'test-webhook-secret-12345';
const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

console.log('Payload:', payload);
console.log('Signature:', signature);
