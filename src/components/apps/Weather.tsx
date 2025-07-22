"use client";
import React, { useState, useEffect } from "react";
import { Search, MapPin, Sun, CloudRain, Cloud, Snowflake, Thermometer, Wind, Droplets, Loader } from "lucide-react";
import styles from '../../../styles/Weather.module.css';

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  Clear: <Sun size={32} />,
  Clouds: <Cloud size={32} />,
  Rain: <CloudRain size={32} />,
  Snow: <Snowflake size={32} />,
  Drizzle: <CloudRain size={32} />,
  Thunderstorm: <CloudRain size={32} />,
  Mist: <Cloud size={32} />,
  Smoke: <Cloud size={32} />,
  Haze: <Cloud size={32} />,
  Dust: <Cloud size={32} />,
  Fog: <Cloud size={32} />,
  Sand: <Cloud size={32} />,
  Ash: <Cloud size={32} />,
  Squall: <CloudRain size={32} />,
  Tornado: <CloudRain size={32} />,
};

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

function getWeatherIcon(main: string) {
  return WEATHER_ICONS[main] || <Cloud size={32} />;
}

interface WeatherData {
  name: string;
  sys: { country: string; sunrise: number; sunset: number };
  weather: Array<{ main: string }>;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  wind: { speed: number };
  visibility: number;
  clouds?: { all: number };
}

export default function Weather() {
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchWeather = async (q: string) => {
    setLoading(true);
    setError("");
    if (!API_KEY) {
      setError("Missing OpenWeather API key");
      setLoading(false);
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Location not found");
      }
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error fetching weather");
      } else {
        setError("Error fetching weather");
      }
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError("");
    if (!API_KEY) {
      setError("Missing OpenWeather API key");
      setLoading(false);
      return;
    }
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Location not found");
      }
      const data: WeatherData = await res.json();
      setWeather(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error fetching weather");
      } else {
        setError("Error fetching weather");
      }
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) fetchWeather(query.trim());
  };

  const handleLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          setError("Location access denied: " + (err.message || ""));
        }
      );
    } else {
      setError("Geolocation not supported");
    }
  };

  useEffect(() => {
    // Optionally, fetch weather for default location on mount
    // fetchWeather("Berlin");
  }, []);

  return (
    <div className={styles.container}>
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search location..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} title="Search">
          <Search size={20} />
        </button>
        <button type="button" className={styles.locationButton} title="Use my location" onClick={handleLocation}>
          <MapPin size={20} />
        </button>
      </form>

      {loading && <div className={styles.loading}><Loader size={20} /></div>}
      {error && <div className={styles.error}>{error}</div>}

      {weather && (
        <div className={styles.weatherCardScrollable}>
          <div className={styles.weatherMain}>
            <div className={styles.weatherIconBg}>{getWeatherIcon(weather.weather[0].main)}</div>
            <div className={styles.weatherInfo}>
              <div className={styles.locationName}>{weather.name}, {weather.sys.country}</div>
              <div className={styles.tempAccent}>{Math.round(weather.main.temp)}°C</div>
              <div className={styles.weatherDesc}>{weather.weather[0].main}</div>
            </div>
          </div>
          <hr className={styles.divider} />
          <div className={styles.weatherDetails}>
            <div className={styles.detail}><Thermometer size={16} /> Feels like: {Math.round(weather.main.feels_like)}°C</div>
            <div className={styles.detail}><Wind size={16} /> Wind: {Math.round(weather.wind.speed)} m/s</div>
            <div className={styles.detail}><Droplets size={16} /> Humidity: {weather.main.humidity}%</div>
            <div className={styles.detail}>Pressure: {weather.main.pressure} hPa</div>
            <div className={styles.detail}>Visibility: {weather.visibility / 1000} km</div>
            <div className={styles.detail}>Min Temp: {Math.round(weather.main.temp_min)}°C</div>
            <div className={styles.detail}>Max Temp: {Math.round(weather.main.temp_max)}°C</div>
            <div className={styles.detail}>Cloudiness: {weather.clouds?.all ?? 0}%</div>
            <div className={styles.detail}><Sun size={16} color="#FFD700" /> Sunrise: {new Date(weather.sys.sunrise * 1000).toLocaleTimeString()}</div>
            <div className={styles.detail}><Sun size={16} color="#FFA500" /> Sunset: {new Date(weather.sys.sunset * 1000).toLocaleTimeString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
