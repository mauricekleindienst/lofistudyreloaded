"use client";
import { useState } from 'react';
import { 
  Sun,
  Cloud,
  CloudRain
} from 'lucide-react';
import styles from '../../../styles/WeatherApp.module.css';

interface ForecastDay {
  day: string;
  high: number;
  low: number;
  condition: string;
}

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: ForecastDay[];
}

const WeatherApp: React.FC = () => {
  const [weather] = useState<WeatherData>({
    location: 'Your City',
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    forecast: [
      { day: 'Today', high: 24, low: 18, condition: 'Sunny' },
      { day: 'Tomorrow', high: 26, low: 20, condition: 'Cloudy' },
      { day: 'Monday', high: 23, low: 17, condition: 'Rainy' },
      { day: 'Tuesday', high: 25, low: 19, condition: 'Sunny' },
    ]
  });

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny': return <Sun size={32} style={{ color: '#facc15' }} />;
      case 'cloudy':
      case 'partly cloudy': return <Cloud size={32} style={{ color: '#9ca3af' }} />;
      case 'rainy': return <CloudRain size={32} style={{ color: '#60a5fa' }} />;
      default: return <Sun size={32} style={{ color: '#facc15' }} />;
    }
  };  return (
    <div className={styles.content}>
      {/* Current Weather */}
      <div className={styles.currentWeather}>
        <h3 className={styles.locationTitle}>
          {weather.location}
        </h3>
        <div className={styles.weatherMain}>
          <div className={styles.weatherIcon}>
            {getWeatherIcon(weather.condition)}
          </div>
          <div>
            <div className={styles.temperatureDisplay}>
              {weather.temperature}°C
            </div>
            <div className={styles.conditionText}>
              {weather.condition}
            </div>
          </div>
        </div>
        
        <div className={styles.weatherDetails}>
          <div className={styles.detailCard}>
            <div className={styles.detailLabel}>Humidity</div>
            <div className={styles.detailValue}>{weather.humidity}%</div>
          </div>
          <div className={styles.detailCard}>
            <div className={styles.detailLabel}>Wind</div>
            <div className={styles.detailValue}>{weather.windSpeed} km/h</div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      <div className={styles.forecastSection}>
        <h4 className={styles.forecastTitle}>4-Day Forecast</h4>
        <div className={styles.forecastList}>
          {weather.forecast.map((day, index) => (
            <div key={index} className={styles.forecastItem}>
              <div className={styles.forecastLeft}>
                <div className={styles.weatherIcon}>
                  {getWeatherIcon(day.condition)}
                </div>
                <div className={styles.forecastDetails}>
                  <div className={styles.forecastDay}>{day.day}</div>
                  <div className={styles.forecastCondition}>{day.condition}</div>
                </div>
              </div>
              <div className={styles.forecastTemperatures}>
                <div className={styles.forecastHigh}>{day.high}°</div>
                <div className={styles.forecastLow}>{day.low}°</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherApp;
