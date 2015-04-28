
//Description:
//  Provides current weather conditions and forecast, courtesy of worldweatheronline.com
//
//Dependencies:
//  "moment": "2.10.x"
//
//Configuration:
//  WWE_API_KEY - your worldweatheronline.com API key
//
//Commands:
//  hubot weather <location> - current weather conditions and detailed 2-day forecast for <location>
//  hubot forecast <location> - seven-day weather forecast for <location>
//
//Author:
//  mcm69
var WEATHER_TEXT = 'Current Weather in %s: %s, %d°C (feels like %d°C)\n' +
                   'Wind %s, %dkm/h. Observed at %s';
var DAILY_TEXT = 'Forecast for %s:\n' +
                 'High %d°C, low %d°C. UV Index %d.' +
                 'Sunrise at %s, sunset at %s.\n' +
                 'Hourly forecast:\n%s';
var HOURLY_TEXT = '%s: %d°C (feels like %d°C), wind %s, %dkm/h. %s';
var WEATHER_URL = 'http://api.worldweatheronline.com/free/v2/weather.ashx?q=%s' +
    '&format=json&num_of_days=2&fx24=yes&showlocaltime=yes&key=%s';
var FORECAST_URL = 'http://api.worldweatheronline.com/free/v2/weather.ashx?q=%s' +
    '&format=json&num_of_days=7&showlocaltime=yes&key=%s';

var API_KEY = process.env.WWE_API_KEY;
var util = require('util'),
    format = util.format;

util.log("Starting hubot-worldweatheronline.");
if (!API_KEY) {
    util.log("No API key set!");
    module.exports = function(){};
    return;
}

module.exports = function(robot) {
    robot.respond(/weather (.*)/i, function(msg) {
        var location = msg.match[1];
        if (!location) {
            return;
        }
        util.log('Got request for weather in ' + location);
        var url = format(WEATHER_URL, escape(location, API_KEY));
        robot.http(url).get()(function(err, res, body) {
            if (err) {
                msg.send('Can\'t get weather for ' + location + ', an error occurred.');
                return;
            }
            if (res.statusCode !== 200) {
                msg.send('Can\'t get weather for ' + location + ', got HTTP code ' + res.statusCode);
                return;
            }
            var data = JSON.parse(body).data;

            if (data.error) {
                msg.send('Can\'t get weather for ' + location + ', the server said: ' + data.error[0].msg);
                return;
            }

            var currentCondition = data.current_condition[0];

            var response = format(WEATHER_TEXT,
                data.request[0].query,
                currentCondition.weatherDesc[0].value,
                currentCondition.temp_C,
                currentCondition.FeelsLikeC,
                currentCondition.winddir16Point,
                currentCondition.windspeedKmph,
                currentCondition.observation_time
            );

            for (var i = 0; i < data.weather.length; i++) {
                var dayWeather = data.weather[i];
                var dayText = format(DAILY_TEXT,
                    dayWeather.date,
                    dayWeather.maxtempC,
                    dayWeather.mintempC,
                    dayWeather.uvIndex,
                    dayWeather.astronomy[0].sunrise,
                    dayWeather.astronomy[0].sunset,
                    dayWeather.hourly
                        .map(function(hrly) {
                            return format(HOURLY_TEXT,
                                hrly.time,
                                hrly.tempC,
                                hrly.FeelsLikeC,
                                hrly.winddir16Point,
                                hrly.windspeedKmph,
                                hrly.weatherDesc[0].value
                            );
                        }).join('\n')
                );

                response += '\n\n' + dayText;
            }

            msg.send(response);
        });
    });
};
