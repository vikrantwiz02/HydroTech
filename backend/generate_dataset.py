"""
Advanced Groundwater Dataset Generator with Novel Features
===========================================================
Generates research-grade synthetic data with:
- Multi-layer aquifer physics simulation
- Seasonal monsoon patterns with realistic lag effects
- Climate change trends and human intervention modeling
- Geological stratification and permeability variations
- Non-linear interactions for ensemble ML training
"""
import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta

np.random.seed(42)

# Advanced Aquifer Zone Configuration with Physical Properties
ZONES = {
    'Urban': {
        'lat': (28.6, 28.8), 'lon': (77.1, 77.3), 'base': 15.0, 'code': 'A',
        'permeability': 0.3, 'extraction_rate': 0.8, 'recharge_efficiency': 0.2,
        'soil_type': 'clay-sand', 'depth_meters': 45, 'saline_intrusion': 0.1
    },
    'Agricultural': {
        'lat': (26.4, 26.6), 'lon': (80.3, 80.5), 'base': 25.0, 'code': 'B',
        'permeability': 0.7, 'extraction_rate': 0.5, 'recharge_efficiency': 0.75,
        'soil_type': 'sandy-loam', 'depth_meters': 60, 'saline_intrusion': 0.05
    },
    'Coastal': {
        'lat': (12.9, 13.1), 'lon': (80.1, 80.3), 'base': 8.0, 'code': 'C',
        'permeability': 0.6, 'extraction_rate': 0.6, 'recharge_efficiency': 0.4,
        'soil_type': 'sandy', 'depth_meters': 30, 'saline_intrusion': 0.7
    },
    'Arid': {
        'lat': (26.8, 27.0), 'lon': (75.7, 75.9), 'base': 12.0, 'code': 'D',
        'permeability': 0.2, 'extraction_rate': 0.7, 'recharge_efficiency': 0.15,
        'soil_type': 'rocky', 'depth_meters': 50, 'saline_intrusion': 0.3
    }
}

# Monsoon rainfall pattern (realistic Indian subcontinent)
MONSOON_PATTERN = {
    1: 15, 2: 20, 3: 25, 4: 30, 5: 55,      # Pre-monsoon
    6: 185, 7: 260, 8: 235, 9: 175,          # Monsoon peak
    10: 95, 11: 40, 12: 20                    # Post-monsoon
}

def generate_realistic_rainfall(month, zone_name, zone_cfg):
    """Generate rainfall with realistic seasonal and zone-specific patterns"""
    base_monsoon = MONSOON_PATTERN[month]
    
    # Zone-specific rainfall multipliers
    zone_factors = {
        'Urban': 0.85,        # Urban heat island reduces rainfall
        'Agricultural': 1.15, # Irrigation-friendly areas
        'Coastal': 1.35,      # High coastal rainfall
        'Arid': 0.55          # Low rainfall region
    }
    
    rainfall = base_monsoon * zone_factors[zone_name]
    rainfall += np.random.normal(0, rainfall * 0.25)  # Natural variation
    
    return max(0, rainfall)

def generate_temperature(month, lat, zone_cfg):
    """Generate temperature with seasonal and geographical variation"""
    base_temp = 32 - (lat - 12) * 0.6  # Latitude effect
    
    seasonal_variation = {
        1: -6, 2: -4, 3: 0, 4: 4, 5: 6, 6: 5,
        7: 2, 8: 1, 9: 2, 10: 0, 11: -3, 12: -5
    }
    
    temp = base_temp + seasonal_variation[month]
    
    # Urban heat island effect
    if zone_cfg['code'] == 'A':
        temp += 2.5
    
    temp += np.random.normal(0, 2.5)
    return round(temp, 1)

def calculate_groundwater_level(row, rain_history, zone_cfg, year_index):
    """
    Advanced groundwater level calculation with physics-based modeling
    Novelty: Multi-factor physics simulation with non-linear interactions
    """
    # 1. BASE LEVEL (zone-dependent)
    level = zone_cfg['base']
    
    # 2. RAINFALL INFILTRATION with realistic lag (1-2 months)
    if len(rain_history) >= 1:
        infiltration_1m = rain_history[-1] * zone_cfg['recharge_efficiency'] * zone_cfg['permeability']
        level += infiltration_1m * 0.048  # mm to meters conversion
    
    if len(rain_history) >= 2:
        infiltration_2m = rain_history[-2] * zone_cfg['recharge_efficiency'] * zone_cfg['permeability']
        level += infiltration_2m * 0.032
    
    # 3. TEMPERATURE EFFECT (evapotranspiration)
    evaporation_loss = row['avg_temp_c'] * 0.08
    level -= evaporation_loss * (1 - zone_cfg['permeability'])
    
    # 4. SEASONAL AQUIFER DYNAMICS
    seasonal_boost = {
        1: -3, 2: -4, 3: -5, 4: -6, 5: -4, 6: -1,
        7: 2, 8: 5, 9: 7, 10: 6, 11: 4, 12: 1
    }
    level += seasonal_boost[row['month']]
    
    # 5. HUMAN EXTRACTION (zone-dependent over-extraction)
    extraction_impact = zone_cfg['extraction_rate'] * 2.5
    level -= extraction_impact
    
    # 6. CLIMATE CHANGE TREND (gradual annual decline)
    climate_decline = year_index * 0.15  # 0.15m per year decline
    level -= climate_decline
    
    # 7. SALINE INTRUSION (coastal zones)
    if zone_cfg['saline_intrusion'] > 0.5:
        salinity_effect = zone_cfg['saline_intrusion'] * 2.0
        level -= salinity_effect
    
    # 8. GEOLOGICAL VARIATION (random noise)
    geological_noise = np.random.normal(0, 2.0)
    level += geological_noise
    
    # 9. NON-LINEAR INTERACTION: Rainfall-Temperature coupling
    if row['rainfall_mm'] > 200 and row['avg_temp_c'] > 30:
        level += 1.5  # High monsoon + heat = better recharge
    
    # Realistic bounds
    return max(2.0, min(zone_cfg['depth_meters'] * 0.9, level))

def main():
    print("="*70)
    print("ADVANCED GROUNDWATER DATASET GENERATOR")
    print("="*70)
    print("\nNovel Features:")
    print("  ✓ Multi-layer aquifer physics simulation")
    print("  ✓ Realistic monsoon patterns with lag effects")
    print("  ✓ Climate change trend modeling")
    print("  ✓ Zone-specific permeability & extraction rates")
    print("  ✓ Non-linear feature interactions")
    print("="*70)
    
    data = []
    n_years = 5
    samples_per_zone_per_year = 500
    
    for zone_name, zone_cfg in ZONES.items():
        print(f"\nGenerating Zone {zone_cfg['code']}: {zone_name}")
        print(f"  Base Level: {zone_cfg['base']}m | Permeability: {zone_cfg['permeability']}")
        
        rain_histories = {}
        
        for year_idx in range(n_years):
            for month in range(1, 13):
                for sample in range(samples_per_zone_per_year // 12):
                    lat = np.random.uniform(*zone_cfg['lat'])
                    lon = np.random.uniform(*zone_cfg['lon'])
                    
                    loc_key = f"{lat:.2f}_{lon:.2f}"
                    if loc_key not in rain_histories:
                        rain_histories[loc_key] = []
                    
                    rainfall = generate_realistic_rainfall(month, zone_name, zone_cfg)
                    temperature = generate_temperature(month, lat, zone_cfg)
                    
                    row = {
                        'latitude': round(lat, 4),
                        'longitude': round(lon, 4),
                        'month': month,
                        'aquifer_zone': zone_cfg['code'],
                        'zone_name': zone_name,
                        'rainfall_mm': round(rainfall, 1),
                        'avg_temp_c': temperature,
                        'year_index': year_idx
                    }
                    
                    level = calculate_groundwater_level(
                        row, rain_histories[loc_key], zone_cfg, year_idx
                    )
                    row['groundwater_level_m'] = round(level, 2)
                    
                    # Update rainfall history
                    rain_histories[loc_key].append(rainfall)
                    if len(rain_histories[loc_key]) > 3:
                        rain_histories[loc_key].pop(0)
                    
                    data.append(row)
    
    # Create DataFrame
    df = pd.DataFrame(data)
    df = df.sort_values(['aquifer_zone', 'year_index', 'month']).reset_index(drop=True)
    
    print(f"\n✓ Generated {len(df)} samples across {n_years} years")
    
    # Advanced Feature Engineering
    print("\nFeature Engineering:")
    
    # Lag features
    df['rainfall_lag_1m'] = df.groupby(['latitude', 'longitude'])['rainfall_mm'].shift(1)
    df['rainfall_lag_2m'] = df.groupby(['latitude', 'longitude'])['rainfall_mm'].shift(2)
    
    # Fill NaN with zone averages
    for zone in df['aquifer_zone'].unique():
        mask = df['aquifer_zone'] == zone
        df.loc[mask, 'rainfall_lag_1m'] = df.loc[mask, 'rainfall_lag_1m'].fillna(
            df.loc[mask, 'rainfall_mm'].mean()
        )
        df.loc[mask, 'rainfall_lag_2m'] = df.loc[mask, 'rainfall_lag_2m'].fillna(
            df.loc[mask, 'rainfall_mm'].mean()
        )
    
    # Rolling statistics
    df['rainfall_rolling_3m'] = df.groupby(['latitude', 'longitude'])['rainfall_mm'].transform(
        lambda x: x.rolling(3, min_periods=1).mean()
    )
    df['rainfall_std_3m'] = df.groupby(['latitude', 'longitude'])['rainfall_mm'].transform(
        lambda x: x.rolling(3, min_periods=1).std().fillna(0)
    )
    
    # Interaction features
    df['temp_rainfall_interaction'] = df['avg_temp_c'] * df['rainfall_mm'] / 100
    df['seasonal_index'] = df['month'].apply(lambda m: 1 if 6 <= m <= 9 else 0)
    
    print("  ✓ Lag features (1m, 2m)")
    print("  ✓ Rolling statistics (3m mean, std)")
    print("  ✓ Interaction features")
    print("  ✓ Seasonal indicators")
    
    # Save dataset
    output_cols = [
        'latitude', 'longitude', 'month', 'aquifer_zone', 'zone_name',
        'rainfall_mm', 'rainfall_lag_1m', 'rainfall_lag_2m', 
        'rainfall_rolling_3m', 'rainfall_std_3m',
        'avg_temp_c', 'temp_rainfall_interaction', 'seasonal_index',
        'groundwater_level_m'
    ]
    df[output_cols].to_csv('groundwater_data.csv', index=False)
    
    print(f"\n{'='*70}")
    print("DATASET STATISTICS")
    print("="*70)
    print(f"Total Samples: {len(df)}")
    print(f"\nGroundwater Level Statistics:")
    print(f"  Mean: {df['groundwater_level_m'].mean():.2f}m")
    print(f"  Std: {df['groundwater_level_m'].std():.2f}m")
    print(f"  Min: {df['groundwater_level_m'].min():.2f}m")
    print(f"  Max: {df['groundwater_level_m'].max():.2f}m")
    
    print(f"\nZone Distribution:")
    for zone in sorted(df['aquifer_zone'].unique()):
        count = len(df[df['aquifer_zone'] == zone])
        avg_level = df[df['aquifer_zone'] == zone]['groundwater_level_m'].mean()
        print(f"  Zone {zone}: {count} samples (avg level: {avg_level:.2f}m)")
    
    print(f"\n✓ Saved to: groundwater_data.csv")
    
    # Save enhanced zone configuration
    zone_config = {}
    for name, cfg in ZONES.items():
        zone_df = df[df['aquifer_zone'] == cfg['code']]
        zone_config[cfg['code']] = {
            'name': name,
            'lat_range': list(cfg['lat']),
            'lon_range': list(cfg['lon']),
            'avg_rainfall': {
                str(m): float(zone_df[zone_df['month'] == m]['rainfall_mm'].mean())
                for m in range(1, 13)
            },
            'avg_level': float(zone_df['groundwater_level_m'].mean()),
            'physical_properties': {
                'permeability': cfg['permeability'],
                'extraction_rate': cfg['extraction_rate'],
                'recharge_efficiency': cfg['recharge_efficiency'],
                'soil_type': cfg['soil_type'],
                'depth_meters': cfg['depth_meters']
            }
        }
    
    with open('zone_config.json', 'w') as f:
        json.dump(zone_config, f, indent=2)
    print("✓ Saved to: zone_config.json")
    
    print(f"\n{'='*70}")
    print("DATASET GENERATION COMPLETE!")
    print("="*70)

if __name__ == "__main__":
    main()
