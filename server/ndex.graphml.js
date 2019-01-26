const { exec } = require('child_process');
const temp = require('temp').track();
const fs = require('fs');
const app = require('express')();
const morgan = require('morgan');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/ndex-graphml');

const NDEX_API_ROOT = process.env.NDEX_API_ROOT || 'http://www.ndexbio.org/v2';
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.use(morgan('common', { immediate: true }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function getNetwork(networkid) {
  return axios.get(`${NDEX_API_ROOT}/network/${networkid}`);
}

function runNdexExportersPy(cxpath) {
  return new Promise((resolve, reject) => {
    const cmd = `cat ${cxpath} | ndex_exporters.py graphml`;
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

function getTemporaryFile() {
  return new Promise((resolve, reject) => {
    temp.open('ndex.graphml', (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve(info);
      }
    });
  });
}

function writeTemporaryFile(file, cxdata) {
  return new Promise((resolve, reject) => {
    fs.write(file.fd, JSON.stringify(cxdata), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function closeTemporaryFile(file) {
  return new Promise((resolve, reject) => {
    fs.close(file.fd, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function getGraphML(cxdata) {
  return new Promise(async (resolve, reject) => {
    try {
      const file = await getTemporaryFile();
      await writeTemporaryFile(file, cxdata);
      const graphml = await runNdexExportersPy(file.path);
      await closeTemporaryFile(file);
      resolve(graphml);
    } catch (error) {
      reject(error);
    }
  });
}

app.get('/network/:networkid', async (req, res) => {
  const { networkid } = req.params;
  let cxdata;
  try {
    const response = await getNetwork(networkid);
    cxdata = response.data;
  } catch (error) {
    const { response, request } = error;
    if (response) {
      res.status(response.status);
      res.send(response.data);
    } else if (request) {
      res.status(500);
      res.send(`Could not reach ${NDEX_API_ROOT}/network/${networkid}.`);
    } else {
      res.status(500);
      res.send('Internal server error.');
    }
  }
  try {
    const graphml = await getGraphML(cxdata);
    res.status(200);
    res.send(graphml);
  } catch (error) {
    res.status(500);
    res.send('Internal server error.');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Listening at http://${HOST}:${PORT}`);
});
