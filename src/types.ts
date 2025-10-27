// Shared types for the application

export interface PredictionInput {
  rainfall: string;
  temperature: string;
  latitude: string;
  longitude: string;
  month: string;
}

export interface PredictionResult {
  predicted_level_meters: number;
  confidence_score: number;
}

export interface DetailedResult extends PredictionResult {
  prediction_interval: {
    lower: number;
    upper: number;
  };
  aquifer_zone: string;
  zone_name: string;
  feature_contributions: {
    rainfall_impact: number;
    temperature_impact: number;
    location_baseline: number;
    seasonal_effect: number;
  };
  seasonal_trend: string;
}

export interface Statistics {
  model: {
    type: string;
    performance: {
      r2: number;
      rmse: number;
      mae: number;
    };
  };
  dataset: {
    total_samples: number;
    zones: number;
    avg_groundwater_level: number;
    std_groundwater_level: number;
  };
}

export interface SavedPrediction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  input: {
    rainfall: number;
    temperature: number;
    latitude: number;
    longitude: number;
    month: number;
  };
  result: DetailedResult;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
}
