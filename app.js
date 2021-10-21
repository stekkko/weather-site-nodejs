const API_KEY = "785ed4f210142854757ac62846e64d5d"
const URL = "https://api.openweathermap.org/data/2.5"
const PORT = 3000

const express = require('express')
const https = require('https')
const cors = require('cors')
const MongoClient = require('mongodb').MongoClient
const app = express()
var db = null
var collection = null

const uri = "mongodb+srv://dbUser:ninjan14123555@cluster0.lh1oq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
	if (err) {
		console.error(err)
	}
    db = client.db('main')
    collection = db.collection("favorites")
});

app.use(cors())

function getCityData(url, response){
	https.get(url, (httpResponse) => {
		if (httpResponse.statusCode === 404) {
			response.status(404).send('{"message": "City not found"}')
		} else {
			let data = ''
			httpResponse.on('data', (newData) => {
				data = newData
			})
			httpResponse.on('end', () => {
				data = JSON.parse(data)
				response.status(200).send(data)
			})
		}
	}).on("error", (error) => {
		response.status(400).send('{"message": "Something wrong with the weather API"}')
	})
}

app.get('/weather/coordinates', (request, response) => {
	if (Object.keys(request.query).includes('lat') & Object.keys(request.query).includes('lon')) {
		getCityData(`${URL}/weather?lon=${request.query.lon}&lat=${request.query.lat}&appid=${API_KEY}&units=metric`, response)
	} else {
		response.status(401).send('{"message": "Not enough data in query"}')		
	}
})

app.get('/weather/city', (request, response) => {
	if (Object.keys(request.query).includes('q')) {
		getCityData(`${URL}/weather?q=${request.query.q}&appid=${API_KEY}&units=metric`, response)
	} else {
		response.status(401).send('{"message": "Not enough data in query"}')		
	}
})


app.get('/favorites', (request, response) => {
	collection.find().toArray((error, result) => {
        response.status(200).send(result)
    })
})

app.post('/favorites', (request, response) => {
	https.get(`${URL}/weather?q=${request.query.q}&appid=${API_KEY}&units=metric`, (ext_response) => {
		if (ext_response.statusCode == 404) {
			response.status(404).send('{"message": "City not found in external API"}')
		} else {
			let data = ''
			ext_response.on('data', (chunk) => {
				data += chunk
			})
			ext_response.on('end', () => {
				data = JSON.parse(data)
				collection.find({_id: parseInt(data.id)}).toArray((error, result) => {
					if (result.length > 0) {
						response.status(400).send(`{"message": "City ${request.query.q} is already in favorites"}`)
					} else {
						collection.insertOne({_id: data.id, name: data.name})
						response.status(200).send('{"message": "Successfully added city to favorites"}')
					}
				})
			})
		}
	})
})

app.delete('/favorites', (request, response) => {
	https.get(`${URL}/weather?q=${request.query.q}&appid=${API_KEY}&units=metric`, (ext_response) => {
		let data = ''
		ext_response.on('data', (chunk) => {
			data += chunk
		})
		ext_response.on('end', () => {
			data = JSON.parse(data)
			collection.remove({_id: data.id}, function(error, result) {
			if (error) {
				response.status(400).send('{"message": "Error when removing city from db occured"}')
			} else {
				response.status(200).send('{"message": "Successfully removed city from db"}')
			}
			})			
		})
	})
})



app.listen(PORT, () => console.log(`server is listening`))