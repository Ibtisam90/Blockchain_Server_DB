const express = require('express');
const parseurl = require('parseurl');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const expressValidator = require('express-validator');
const electionName = require('./models/electionName');
const admin = require('./models/admin')
const Voter = require('./models/voter');
const Candidate = require('./models/candidate');
const md5 = require('md5');
require('./db/mongoose');
const axios = require('axios');

const faceapi = require('face-api.js');

const canvas = require("canvas");

const { Canvas, Image, ImageData } = canvas;
const registeredFaces = [];
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// --------------------------------------------------------------------

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk('./src\\my_models'),
    faceapi.nets.faceLandmark68Net.loadFromDisk('./src\\my_models'),
    faceapi.nets.faceRecognitionNet.loadFromDisk('./src\\my_models'),
    faceapi.nets.faceExpressionNet.loadFromDisk('./src\\my_models'),
    faceapi.nets.ssdMobilenetv1.loadFromDisk('./src\\my_models')
  ]).then(() => {
    console.log('Face recognition models loaded');
  }).catch((error) => {
    console.error('Error loading face recognition models:', error);
  });





// -----------------------------------------------------------------------

app.post('/registerFace', async (req, res) => {
    try {
      const {imageData , firstName, lastName, metamaskAccount}= req.body;
    //   console.log(imageData);
      console.log("Register Face Function called ");
      console.log("data: ", firstName, lastName, metamaskAccount);
  
      const img = await canvas.loadImage(imageData);
      const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
  
  
      // const image = await faceapi.bufferToImage(imageData);
      // const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  
      if (detection) {
        const faceDescriptor = detection.descriptor;

        console.log("Face Detected: ", faceDescriptor);

        const voterData = {
            firstName: firstName,
            lastName: lastName,
            metamaskAccount: metamaskAccount,
            facialBiometricData: Object.values(faceDescriptor)
          };
          const response = await axios.post('http://localhost:8000/api/registerVoter', voterData);
            console.log(response.data); // Response from the API
  
        registeredFaces.push({ imageData, faceDescriptor });
        res.json({ success: true, data: { faceDescriptor } });
      } else {

        console.log("Face Not Detected");
        res.json({ success: false, error: 'Face not detected' });
      }
    } catch (error) {
      console.error('Error during face registration:', error);
      res.status(500).json({ success: false, error: 'Face registration failed' });
    }
  });


  app.post('/registerCandFace', async (req, res) => {
    try {
      const {imageData , firstName, lastName, metamaskAccount, party, description}= req.body;
    //   console.log(imageData);
      console.log("Register Face Function called ");
      console.log("data: ", firstName, lastName, metamaskAccount);
  
      const img = await canvas.loadImage(imageData);
      const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
  
  
      // const image = await faceapi.bufferToImage(imageData);
      // const detection = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor();
  
      if (detection) {
        const faceDescriptor = detection.descriptor;

        console.log("Face Detected: ", faceDescriptor);

        const candData = {
            firstName: firstName,
            lastName: lastName,
            metamaskAccount: metamaskAccount,
            facialBiometricData: Object.values(faceDescriptor),
            party: party,
            description: description
          };
          const response = await axios.post('http://localhost:8000/api/registerCandidate', candData);
            console.log(response.data); // Response from the API
  
        registeredFaces.push({ imageData, faceDescriptor });
        res.json({ success: true, data: { faceDescriptor } });
      } else {

        console.log("Face Not Detected");
        res.json({ success: false, error: 'Face not detected' });
      }
    } catch (error) {
      console.error('Error during face registration:', error);
      res.status(500).json({ success: false, error: 'Face registration failed' });
    }
  });



  app.post('/recognizeCandFace', async (req, res) => {
    try {
      const { metamaskAccount, imageData } = req.body;

      console.log("Login (Recofgnize) Function called ");
      
  
      // Find the voter based on the metamaskAccount
      const candidate = await Candidate.findOne({ metamaskAccount });
  
      // Check if the voter exists
      if (!candidate) {
        console.log("Incorrect metamask account address")
        return res.status(404).json({ success: false, message: 'Candidate metamask not found' });
      }
      console.log("Account address found! ");

      const img = await canvas.loadImage(imageData);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
  
      if (detection) {
        const queryFaceDescriptor = detection.descriptor;

        console.log("Picture taken: ", queryFaceDescriptor.length);
        console.log("DB Pic", candidate.facialBiometricData.length)
  
        let similarity = 0;

        similarity = faceapi.euclideanDistance(candidate.facialBiometricData, queryFaceDescriptor);
        console.log("Similarity is: ", similarity);
        const isMatch = similarity < 0.6;
        // Compare the query face descriptor with registered face descriptors
        // const isMatch = voter.facialBiometricData.some((registeredFace) => {
        //   similarity = faceapi.euclideanDistance(registeredFace, queryFaceDescriptor);
        //   console.log("Similarity is: ", similarity);
        //   return similarity < 0.6;
        // });
  
        if (isMatch) {
          
          console.log("Login successful");
          res.json({ success: true, message: 'Login successful', candAccount: metamaskAccount, candidate });
        } else {
          console.log("Login failed");
          res.json({ success: false, message: 'Login failed, Face not matched any registered users' });
        }
      } else {
        res.json({ success: false, error: 'Face not detected', message: 'Face not detected' });
      }
    } catch (error) {
      console.log('Error during face recognition:', error);
      res.status(500).json({ success: false, error: 'Face recognition failed', message: 'Face recognition failed' });
    }
  });



  app.post('/recognizeFace', async (req, res) => {
    try {
      const { metamaskAccount, imageData } = req.body;

      console.log("Login (Recofgnize) Function called ");
      
  
      // Find the voter based on the metamaskAccount
      const voter = await Voter.findOne({ metamaskAccount });
  
      // Check if the voter exists
      if (!voter) {
        console.log("Incorrect metamask account address")
        return res.status(404).json({ success: false, message: 'Voter metamask not found' });
      }
      console.log("Account address found! ");

      const img = await canvas.loadImage(imageData);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
  
      if (detection) {
        const queryFaceDescriptor = detection.descriptor;

        console.log("Picture taken: ", queryFaceDescriptor.length);
        console.log("DB Pic", voter.facialBiometricData.length)
  
        let similarity = 0;

        similarity = faceapi.euclideanDistance(voter.facialBiometricData, queryFaceDescriptor);
        console.log("Similarity is: ", similarity);
        const isMatch = similarity < 0.6;
        // Compare the query face descriptor with registered face descriptors
        // const isMatch = voter.facialBiometricData.some((registeredFace) => {
        //   similarity = faceapi.euclideanDistance(registeredFace, queryFaceDescriptor);
        //   console.log("Similarity is: ", similarity);
        //   return similarity < 0.6;
        // });
  
        if (isMatch) {
          console.log("Login successful");
          res.json({ success: true, message: 'Login successful', voterAccount: metamaskAccount , voter});
        } else {
          console.log("Login failed");
          res.json({ success: false, message: 'Login failed, Face not matched any registered users' });
        }
      } else {
        console.log("Face not detected");
        res.json({ success: false, error: 'Face not detected',message: 'Face not detected'  });
      }
    } catch (error) {
      console.log('Error during face recognition:', error);
      res.status(500).json({ success: false, error: 'Face recognition failed', message: 'Face not detected' });
    }
  });
  



app.get('/', function(req, res) {
    res.json('Works!');
});

app.get('/api/electionName', function(req, res) {
    var electionNames = []
    var electionOrganizers = []
    var electionIds = []
    var final = []
    electionName.find({}).then(eachOne => {
        for (i = 0; i < eachOne.length; i++){
            electionNames[i] = eachOne[i].election_name ;
            electionOrganizers[i] = eachOne[i].election_organizer;
            electionIds[i] = eachOne[i].election_id;
            final.push({
                'election_id': eachOne[i].election_id,
                'election_organizer': eachOne[i].election_organizer,
                'election_name': eachOne[i].election_name
            })
        }
        res.send(final);
    })
})



app.get('/api/candList', function(req, res) {
  var firstName = []
  var description = []
  var metamaskAccount = []
  var party = []
  var final = []
  Candidate.find({}).then(eachOne => {
      for (i = 0; i < eachOne.length; i++){
        firstName[i] = eachOne[i].firstName ;
        party[i] = eachOne[i].party;
        metamaskAccount[i] = eachOne[i].metamaskAccount;
        description[i] = eachOne[i].description;
          final.push({
              'firstName': eachOne[i].firstName,
              'party': eachOne[i].party,
              'metamaskAccount': eachOne[i].metamaskAccount,
              'description': eachOne[i].description
          })
      }
      res.send(final);
  })
})

app.post('/api/electionName', async function(req, res) {
    electionName.create({
        election_id: Math.floor(Math.random() * 100),
        election_name: req.body.election_name,
        election_organizer: req.body.election_organizer,
        election_password: md5(req.body.election_password),
    }).then(election => {
        res.json(election);
    });
});

app.post('/api/adminLogin', async function(req, res) {
    
    admin.findOne({
        username: req.body.username,
        password: md5(req.body.password),
    }).then(election => {
        if(election === null){
            res.send(false);
        }else{
            res.send(true);
        }
    });
});


// Register a new user
app.post('/api/registerVoter', async (req, res) => {
    try {
      const { firstName, lastName,  metamaskAccount, facialBiometricData } = req.body;
  
      // Check if the voter with the given Metamask account already exists
      const existingVoter = await Voter.findOne({ metamaskAccount });
      if (existingVoter) {
        return res.status(400).json({ error: 'A voter with the provided Metamask account already exists.' });
      }
  
      // Check if the voter with the given facial biometric data already exists
      const existingBiometricData = await Voter.findOne({ facialBiometricData });
      if (existingBiometricData) {
        return res.status(400).json({ error: 'A voter with the provided facial biometric data already exists.' });
      }
  
      // Create a new voter
      const newVoter = new Voter({
        firstName,
        lastName,
       
        metamaskAccount,
        facialBiometricData
      });
  
      // Save the new voter in the database
      await newVoter.save();
  
      return res.status(201).json({ message: 'User registration successful.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred during user registration.' });
    }
  });


  app.post('/api/registerCandidate', async (req, res) => {
    try {
      const { firstName, lastName,  metamaskAccount, facialBiometricData, party, description } = req.body;
  
      // Check if the voter with the given Metamask account already exists
      const existingCandidate = await Candidate.findOne({ metamaskAccount });
      if (existingCandidate) {
        return res.status(400).json({ error: 'A candidate with the provided Metamask account already exists.' });
      }
  
      // Check if the voter with the given facial biometric data already exists
      const existingBiometricData = await Candidate.findOne({ facialBiometricData });
      if (existingBiometricData) {
        return res.status(400).json({ error: 'A Candidate with the provided facial biometric data already exists.' });
      }
  
      // Create a new voter
      const newCandidate = new Candidate({
        firstName,
        lastName,
        party,
        description,
        metamaskAccount,
        facialBiometricData
      });
  
      // Save the new voter in the database
      await newCandidate.save();
  
      return res.status(201).json({ message: 'User registration successful.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred during user registration.' });
    }
  });

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log("Server is up on port " + port)
});