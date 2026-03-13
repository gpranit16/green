const http = require('http');

const data = JSON.stringify({
  location: "Silk Board Junction, Bangalore",
  condition: "critical",
  contact: "+91 98765 43210",
  patientName: "Full name of patient",
  hospital: "Apollo Hospital, Bannerghatta Road"
});

const options = {
  hostname: 'localhost',
  port: 5050,
  path: '/api/request',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
