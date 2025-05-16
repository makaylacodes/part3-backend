// need to use "npm install dotenv" to make sure can access variables in .env file
require('dotenv').config()

const mongoose = require('mongoose')

// Connection string provided by mongodb when created
const url =  process.env.MONGODB_URI

mongoose.set('strictQuery',false) 

mongoose.connect(url)        
    .then(result => {
        console.log('connected to MongoDB')
    })
    .catch(error => {
        console.log("Error connecting to MongoDB: ", error.message)
    })

// Person schema sent to mongodb
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength:3,
    required: true
  },
  number: {   
    type: String,
    minLength:8,
    required: true,
    validate: {
      validator: v => /^\d{2,3}-\d+$/.test(v),
      message: props => `${props.value} is not a valid phone number!`
    } 
  } 
})

// Check on this later, need it to remove the object id and v added auto in mongodb
personSchema.set('toJSON', {   
    transform: (document, returnedObject) => {
      returnedObject.id = returnedObject._id.toString()
      delete returnedObject.__v
      delete returnedObject._id
    }
  })

// Establishes constructor function that creates a new JS object, Person and exports to index.js
module.exports = mongoose.model('Person', personSchema)