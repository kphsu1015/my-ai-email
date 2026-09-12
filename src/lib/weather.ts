/**
 * Open-Meteo — https://open-meteo.com/
 * 免 token、免申請即可用的公開天氣 API。預設抓台北市的今日天氣。
 */
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

// 預設地點：嘉義縣阿里山鄉樂野村
const DEFAULT_LOCATION = {
  name: "嘉義縣阿里山鄉樂野村",
  latitude: 23.457287,
  longitude: 120.718919,
};

// WMO Weather Code -> 中文天氣描述
// 對照表: https://open-meteo.com/en/docs#weathercode
const WEATHER_CODE_MAP: Record<number, string> = {
  0: "晴朗",
  1: "晴時多雲",
  2: "多雲時晴",
  3: "陰天",
  45: "有霧",
  48: "霧淞",
  51: "毛毛雨（小）",
  53: "毛毛雨（中）",
  55: "毛毛雨（大）",
  56: "凍雨（小）",
  57: "凍雨（大）",
  61: "陣雨（小）",
  63: "陣雨（中）",
  65: "陣雨（大）",
  66: "凍雨（小）",
  67: "凍雨（大）",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  77: "雪粒",
  80: "陣雨（短暫）",
  81: "陣雨（中）",
  82: "陣雨（劇烈）",
  85: "陣雪（小）",
  86: "陣雪（大）",
  95: "雷雨",
  96: "雷雨夾冰雹（小）",
  99: "雷雨夾冰雹（大）",
};

function describeWeatherCode(code: number): string {
  return WEATHER_CODE_MAP[code] ?? `未知天氣代碼(${code})`;
}

export interface WeatherReport {
  location: string;
  date: string; // 今天日期 YYYY-MM-DD
  currentTemperature: number; // °C
  weatherDescription: string;
  maxTemperature: number;
  minTemperature: number;
  precipitationProbability: number; // %
  windSpeed: number; // km/h
  source: "Open-Meteo";
}

export async function fetchTodayWeather(
  location: { name: string; latitude: number; longitude: number } = DEFAULT_LOCATION,
): Promise<WeatherReport> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("current_weather", "true");
  url.searchParams.set(
    "daily",
    "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
  );
  url.searchParams.set("timezone", "Asia/Taipei");

  const res = await fetch(url, {
    next: { revalidate: 600 }, // 天氣資料快取 10 分鐘
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Open-Meteo API 回應 ${res.status}`);

  const json = (await res.json()) as {
    current_weather: {
      temperature: number;
      windspeed: number;
      weathercode: number;
    };
    daily: {
      time: string[];
      weathercode: number[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_probability_max: number[];
    };
  };

  return {
    location: location.name,
    date: json.daily.time[0],
    currentTemperature: json.current_weather.temperature,
    weatherDescription: describeWeatherCode(json.current_weather.weathercode),
    maxTemperature: json.daily.temperature_2m_max[0],
    minTemperature: json.daily.temperature_2m_min[0],
    precipitationProbability: json.daily.precipitation_probability_max[0],
    windSpeed: json.current_weather.windspeed,
    source: "Open-Meteo",
  };
}
