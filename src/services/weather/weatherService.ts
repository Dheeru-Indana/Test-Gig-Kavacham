/**
 * Weather Service
 * Fetches real-time environmental data from OpenWeatherMap API
 */

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  rainfall24h: number;
  condition: string;
  icon: string;
  cityName: string;
  timestamp: string;
}

export async function fetchLiveWeather(city: string): Promise<WeatherData | null> {
  if (!API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY_HERE') {
    console.warn('[WeatherService] API key missing. Returning mock data.');
    return getMockWeather(city);
  }

  try {
    const response = await fetch(
      `${BASE_URL}/weather?q=${city},IN&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) throw new Error(`Weather API Error: ${response.statusText}`);

    const data = await response.json();

    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      rainfall24h: data.rain ? (data.rain['1h'] || 0) * 24 : 0, // Simplified extrap
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      cityName: data.name,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[WeatherService] Failed to fetch live weather:', error);
    return getMockWeather(city);
  }
}

function getMockWeather(city: string): WeatherData {
  return {
    temp: 32,
    humidity: 65,
    pressure: 1012,
    windSpeed: 12,
    rainfall24h: 0,
    condition: 'Clear',
    icon: '01d',
    cityName: city,
    timestamp: new Date().toISOString()
  };
}
