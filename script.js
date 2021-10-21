const BASE_URL = "http://localhost:3000"
const DEFAULT_CITY = "Москва"

function loadForecastByName(city, onLoad) {
	const url = `${BASE_URL}/weather/city?q=${city}`
    return loadForecastByUrl(url, onLoad)
}

function loadForecastByCoords(lat, lon, onLoad) {
	const url = `${BASE_URL}/weather/coordinates?lat=${lat}&lon=${lon}`
    return loadForecastByUrl(url, onLoad)
}

function loadForecastByUrl(url, onLoad) {
    const request = new XMLHttpRequest()
    request.open('GET', url)
    request.onload = function() {
        onLoad(request.status, JSON.parse(request.response))
    }
    request.onerror = function() {
        onLoad(400, JSON.parse('{"message": "When using API an error occured."}'))
    }
    request.send(null)
}

function convertWind(wind) {
    const speed = `${wind.speed} м/с`
    if (wind.deg > 337.5) return `N ${speed}`
    if (wind.deg> 292.5) return `NW ${speed}`
    if (wind.deg > 247.5) return `W ${speed}`
    if (wind.deg > 202.5) return `SW ${speed}`
    if (wind.deg > 157.5) return `S ${speed}`
    if (wind.deg> 122.5) return `SE ${speed}`
    if (wind.deg > 67.5) return `E ${speed}`
    if (wind.deg > 22.5) return `NE ${speed}`
    return `N ${speed}`
}

function createFavoriteCity() {
    let list = document.querySelector('.favorites')

    let newFavorite = tempCity.content.cloneNode(true).childNodes[1]
    list.appendChild(newFavorite)
    return newFavorite
}

function fillFavoriteCity(weatherState, newFavoriteCity){
    newFavoriteCity.name = weatherState.name
	newFavoriteCity.getElementsByClassName("delete")[0].addEventListener("click", function(){
        removeCityFromStorage(newFavoriteCity.name, (status, response) => {
			if(status != 200){
				alert(response.message)
				return
			}
			else{
				document.getElementsByClassName("favorites")[0].removeChild(newFavoriteCity)
			}
		})
	    }
    )
	newFavoriteCity.querySelector('h3').textContent = weatherState.name
	newFavoriteCity.querySelector('.temperature').textContent = Math.round(weatherState.main.temp) + "°C"
	newFavoriteCity.querySelector('.wind .normal').textContent = convertWind(weatherState.wind)
	newFavoriteCity.querySelector('.cloud .normal').textContent = weatherState.clouds.all + "%"
	newFavoriteCity.querySelector('.pressure .normal').textContent = weatherState.main.pressure + " hPa"
	newFavoriteCity.querySelector('.humidity .normal').textContent = weatherState.main.humidity + "%"
	newFavoriteCity.querySelector('.cords .normal').textContent = `[${weatherState.coord.lat}, ${weatherState.coord.lon}]`
	
	newFavoriteCity.querySelector('img').src = `https://openweathermap.org/img/wn/${weatherState.weather[0].icon}.png`
}

function fillFavoriteCities(cities){
	for (var city of cities){
		let newFavoriteCity = createFavoriteCity()
		loadForecastByName(city.name, (status, cityResponse) => {
			fillFavoriteCity(cityResponse, newFavoriteCity)
		})
	}
}

function fillMainCity(weatherState){
	let mainCity = document.getElementsByClassName("yourCity")[0]

	mainCity.querySelector('h2').textContent = weatherState.name
	mainCity.querySelector('.temperature').textContent = Math.round(weatherState.main.temp) + "°C"
	mainCity.querySelector('.wind .normal').textContent = convertWind(weatherState.wind)
	mainCity.querySelector('.cloud .normal').textContent = weatherState.clouds.all + "%"
	mainCity.querySelector('.pressure .normal').textContent = weatherState.main.pressure + " hPa"
	mainCity.querySelector('.humidity .normal').textContent = weatherState.main.humidity + "%"
	mainCity.querySelector('.cords .normal').textContent = `[${weatherState.coord.lat}, ${weatherState.coord.lon}]`
	
	mainCity.querySelector('img').src = `https://openweathermap.org/img/wn/${weatherState.weather[0].icon}@4x.png`
}


function getCitiesFromStorage(){
    const request = new XMLHttpRequest()
	request.open('GET', `${BASE_URL}/favorites`)
	request.onload = function() {
		if (request.status == 200){
			fillFavoriteCities(JSON.parse(request.response))
		}
    }
    request.send(null)
}

function addCityToStorage(city, onLoad){
	const request = new XMLHttpRequest()
	request.open('POST', `${BASE_URL}/favorites?q=${city}`)
	request.onload = function(){onLoad(request.status, JSON.parse(request.response))}
	request.send(null)
}

function removeCityFromStorage(city, onLoad){
	const request = new XMLHttpRequest()
	request.open('DELETE', `${BASE_URL}/favorites?q=${city}`)
	request.onload = function(){onLoad(request.status, JSON.parse(request.response))}
	request.send(null)
}

function addCity(city){
	if (city.trim() === ""){
		return
	}
	var newFavoriteCity = createFavoriteCity()
	addCityToStorage(city, (status, response) => {
		if(status != 200){
			document.getElementsByClassName("favorites")[0].removeChild(newFavoriteCity)
			alert(response.message)
			return
		}
		loadForecastByName(city, (loadStatus, cityResponse) => {
		    if (loadStatus != 200){
			    document.getElementsByClassName("favorites")[0].removeChild(newFavoriteCity)
			    alert(cityResponse.message)
        	    return
		    }    
			fillFavoriteCity(cityResponse, newFavoriteCity)   
	    })
    })
}

function resetMainCity(){
	let mainCity = document.getElementsByClassName("yourCity")[0]
	let cityName = mainCity.querySelector('h2').textContent
	mainCity.querySelector('h2').textContent = "Данные загружаются"
	mainCity.querySelector('.temperature').textContent = ""
	mainCity.querySelector('.wind .normal').textContent = "..."
	mainCity.querySelector('.cloud .normal').textContent = "..."
	mainCity.querySelector('.pressure .normal').textContent = "..."
	mainCity.querySelector('.humidity .normal').textContent = "..."
	mainCity.querySelector('.cords .normal').textContent = "..."
	mainCity.querySelector('img').src = `./images/loading.gif`

	loadForecastByName(cityName, (status, cityResponse) => {
		fillMainCity(cityResponse)
	})
}

function updateLocation(){
	navigator.geolocation.getCurrentPosition(
		pos => {
			loadForecastByCoords(pos.coords.latitude, pos.coords.longitude, (status, cityResponse) => {
				fillMainCity(cityResponse)
			})	
		},
		pos => {
			loadForecastByName(DEFAULT_CITY, (status, cityResponse) => {
				fillMainCity(cityResponse)
			})
		}
	)
}

window.onload = function(){ 
	document.getElementsByClassName("add_form")[0].addEventListener('submit', event => {
        event.preventDefault()
    })

	document.getElementsByClassName("add_button")[0].addEventListener("click", function(){
		addCity(document.getElementsByClassName("search_city")[0].value)
		document.getElementsByClassName("search_city")[0].value = ""
	})

	updateLocation()
	
	document.getElementsByClassName("update_btn")[0].addEventListener("click", function(){
		resetMainCity()
	})
	
    getCitiesFromStorage()
}

window.addEventListener('offline', function() {
	alert("Соединение потеряно. Перезагрузите страницу")
	document.getElementsByClassName("add_button")[0].disabled = true
	document.getElementsByClassName("update_btn")[0].disabled = true
    for (var removeButton of document.getElementsByClassName("delete")){
		removeButton.disabled = true
	}
})