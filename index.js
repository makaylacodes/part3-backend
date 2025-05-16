const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')

// need to use "npm install dotenv" to make sure can access variables in .env file
require('dotenv').config()

// Middleware is a function that receives 3 params; it's a function that can 
//be used to handle request and response objects.
// Morgan is a library to simplify process, records details of each RESTful request

// Create a custom token for logging POST data
morgan.token('body', (req) => {
  return req.body && Object.keys(req.body).length > 0
    ? JSON.stringify(req.body)
    : ''
})

// Serves up the static file for the phonebook frontend React application
app.use(express.static(path.join(__dirname, 'dist')))

app.use(cors())
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))



// Establishes constructor function that creates a new JS object, Person
const Person = require('./models/person')


app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Exercise 3.13, returns all person objects in the mongodb database
app.get('/info', (request, response) => {
    const dateTime = () => new Date().toString({})

    // Displays date, time, and number of persons in mongodb database
    Person.find({}).countDocuments({})
    .then(persons => {
      console.log("Success")
      console.log("This is persons count: ", persons)
    
      // What displays in the browser
      response.send(`<h1>Hello World</h1> <p>Phonebook has info for <b>${persons}</b> people</p>
        <p>${dateTime()}</p>`)
      })
    .catch((error) => {
      console.error("Error fetching count:", error)
    })

    
})

// returns the entire list of persons, person objects with names, numbers, and ids
app.get('/api/persons', (request, response, next) => {
  try{
    Person.find({}).then(persons => {
      response.json(persons)

      console.log("phonebook:")
      return persons.forEach(person => {
        console.log(`${person.name} ${person.number} ${person.id}`)
      })
      
    })
  }
  catch (error){
    next(error)
  }
})

// Exercise 3.14, implements functionality to add a new person to the phonebook database in mongodb
app.post('/api/persons', (request, response, next) => {
    
  const body = request.body
  console.log("this is request.body : ", body)
  
  const personObj = new Person({
    name: body.name,
    number: body.number
  })

   /* if (!personObj.name){
      return response.status(400).json({
        error: 'name is missing'
      })
    }

    else if (!personObj.number){
      return response.status(400).json({
        error: 'number is missing'
      })
    }
    */

    // Block below checks whether or not the person's name already exists in the phonebook. If it doesn't
    // then the new person object will be saved to the phonebook
  Person.findOne({name : { $regex: new RegExp('^' + personObj.name + '$', 'i')} })
  .then(person => {
    console.log("This is person found with regex: ", person)

    if(person){
      return response.status(400).json({
        error: 'name must be unique'
      })
    }

    return personObj.save().then(savedPerson => {
      console.log("This name is unique and being saved: ", savedPerson)
      response.json(savedPerson)
    })
  })
  .catch(error => {
    next(error)
  })

  console.log("This is the new person object : ", personObj)

})

app.put('/api/persons/:name', (request, response, next) => {
  // gets rid of the whitespaces in a name
  const name = request.params.name.trim()
  const body = request.body

  const person = {
    number: body.number
  }

  Person.findOneAndUpdate({name}, person, { new: true, runValidators: true, context: 'query' })
  .then(updatedPerson => {
    console.log("Successfully updated person")
    return response.json(updatedPerson)
    
  })
  .catch(error => next(error))
})

// returns one specific person object in the persons list
// Exercise 3.13, implement functionality to display a single entry from the mongodb database
app.get('/api/persons/:id', (request, response, next) => {
    // saves the id of the person being requested in the url
    const id = request.params.id

   //  Save for when the database is redone
    Person.findById(id).then(person => {
      // If no person with the id is found, send error message
      if(person){
        // if person with id is found, then return that object
        console.log("Person was found")
        return response.json(person) 
      }
      
    })
    .catch(error => {
      console.log("Person not found")
      next(error)
    })
})
 
// deletes one specific person object in the persons list
// Exercise 3.4, implement functionality to delete one specific entry in mongodb database
app.delete('/api/persons/:id', (request, response, next) => {
  const id = request.params.id
  // saves the id of the person being requested in the url
  Person.findByIdAndDelete(id)
  .then(result => {
    console.log("Person was found and deleted")
    return response.status(204).end()
  })
  .catch(error => {
    console.log("Person was not successfully deleted")
    next(error)
  })
}) 

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
  
// If the server sends a 404 response, then send the json message it's an unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
   console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })

  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
 
  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
