"""
Advanced ML Model Training Pipeline
====================================
Features:
- Ensemble Random Forest with optimized hyperparameters
- Comprehensive cross-validation
- Feature importance analysis for explainability
- Uncertainty quantification
- Publication-ready metrics and visualization data
"""
import pandas as pd
import numpy as np
import joblib
import json
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

# All available features (updated to match advanced dataset)
FEATURES = [
    'latitude', 'longitude', 'month', 'aquifer_zone', 
    'rainfall_mm', 'rainfall_lag_1m', 'rainfall_lag_2m', 
    'rainfall_rolling_3m', 'rainfall_std_3m',
    'avg_temp_c', 'temp_rainfall_interaction', 'seasonal_index'
]
TARGET = 'groundwater_level_m'
RANDOM_STATE = 42

def create_preprocessor():
    """Create advanced preprocessing pipeline"""
    categorical = ['month', 'aquifer_zone', 'seasonal_index']
    numerical = [f for f in FEATURES if f not in categorical]
    
    preprocessor = ColumnTransformer([
        ('num', StandardScaler(), numerical),
        ('cat', OneHotEncoder(drop='first', sparse_output=False), categorical)
    ], remainder='drop')
    
    return preprocessor

def train_ensemble_model(X_train, y_train, X_test, y_test):
    """Train optimized Random Forest with advanced configuration"""
    print("\nTraining Ensemble Random Forest...")
    print("  Hyperparameters:")
    print("    - n_estimators: 250 (high ensemble diversity)")
    print("    - max_depth: 25 (capture non-linear interactions)")
    print("    - min_samples_split: 4")
    print("    - min_samples_leaf: 2")
    print("    - max_features: sqrt (reduce overfitting)")
    
    model = RandomForestRegressor(
        n_estimators=250,
        max_depth=25,
        min_samples_split=4,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=RANDOM_STATE,
        n_jobs=-1,
        warm_start=False,
        oob_score=True  # Out-of-bag score for uncertainty estimation
    )
    
    preprocessor = create_preprocessor()
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('model', model)
    ])
    
    # Train
    pipeline.fit(X_train, y_train)
    print("  ✓ Training complete")
    
    # Get feature importance for explainability
    feature_names_num = [f for f in FEATURES if f not in ['month', 'aquifer_zone', 'seasonal_index']]
    feature_names_cat = [f'month_{i}' for i in range(2, 13)] + ['zone_B', 'zone_C', 'zone_D', 'seasonal_1']
    all_feature_names = feature_names_num + feature_names_cat
    
    importances = model.feature_importances_
    feature_importance = {
        name: float(imp) 
        for name, imp in zip(all_feature_names[:len(importances)], importances)
    }
    
    # Sort by importance
    sorted_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))
    
    return pipeline, sorted_importance, model.oob_score_

def evaluate_model(pipeline, X_train, y_train, X_test, y_test, X, y):
    """Comprehensive model evaluation"""
    print("\n" + "="*70)
    print("MODEL EVALUATION")
    print("="*70)
    
    # Training metrics
    y_train_pred = pipeline.predict(X_train)
    train_r2 = r2_score(y_train, y_train_pred)
    train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
    train_mae = mean_absolute_error(y_train, y_train_pred)
    
    print("\nTraining Set Performance:")
    print(f"  R² Score: {train_r2:.4f}")
    print(f"  RMSE: {train_rmse:.4f} meters")
    print(f"  MAE: {train_mae:.4f} meters")
    
    # Test metrics
    y_test_pred = pipeline.predict(X_test)
    test_r2 = r2_score(y_test, y_test_pred)
    test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
    test_mae = mean_absolute_error(y_test, y_test_pred)
    mape = np.mean(np.abs((y_test - y_test_pred) / y_test)) * 100
    
    print("\nTest Set Performance:")
    print(f"  R² Score: {test_r2:.4f}")
    print(f"  RMSE: {test_rmse:.4f} meters")
    print(f"  MAE: {test_mae:.4f} meters")
    print(f"  MAPE: {mape:.2f}%")
    
    # Cross-validation for robustness
    print("\nPerforming 5-Fold Cross-Validation...")
    kfold = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(pipeline, X, y, cv=kfold, scoring='r2', n_jobs=-1)
    cv_rmse_scores = cross_val_score(
        pipeline, X, y, cv=kfold, 
        scoring='neg_root_mean_squared_error', n_jobs=-1
    )
    
    print(f"  CV R² Scores: {[f'{s:.4f}' for s in cv_scores]}")
    print(f"  Mean CV R²: {cv_scores.mean():.4f} (±{cv_scores.std()*2:.4f})")
    print(f"  Mean CV RMSE: {-cv_rmse_scores.mean():.4f} meters")
    
    # Calculate prediction intervals for uncertainty quantification
    residuals = y_test - y_test_pred
    prediction_std = np.std(residuals)
    
    metrics = {
        'train': {
            'r2': float(train_r2),
            'rmse': float(train_rmse),
            'mae': float(train_mae)
        },
        'test': {
            'r2': float(test_r2),
            'rmse': float(test_rmse),
            'mae': float(test_mae),
            'mape': float(mape)
        },
        'cross_validation': {
            'mean_r2': float(cv_scores.mean()),
            'std_r2': float(cv_scores.std()),
            'mean_rmse': float(-cv_rmse_scores.mean()),
            'scores': [float(s) for s in cv_scores]
        },
        'uncertainty': {
            'prediction_std': float(prediction_std),
            'confidence_interval_95': float(1.96 * prediction_std)
        }
    }
    
    return metrics

def main():
    print("="*70)
    print("ADVANCED ML TRAINING PIPELINE")
    print("="*70)
    
    # Load data
    print("\nLoading dataset...")
    df = pd.read_csv('groundwater_data.csv')
    
    # Verify all features exist
    missing_features = set(FEATURES) - set(df.columns)
    if missing_features:
        print(f"Warning: Missing features {missing_features}")
        # Use only available features
        available_features = [f for f in FEATURES if f in df.columns]
        X = df[available_features]
    else:
        X = df[FEATURES]
    
    y = df[TARGET]
    
    print(f"  ✓ Loaded {len(df)} samples")
    print(f"  ✓ Features: {len(X.columns)}")
    print(f"  ✓ Target: {TARGET}")
    
    # Split data
    print("\nSplitting data (80/20 train/test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE
    )
    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")
    
    # Train model
    pipeline, feature_importance, oob_score = train_ensemble_model(
        X_train, y_train, X_test, y_test
    )
    print(f"  ✓ Out-of-Bag Score: {oob_score:.4f}")
    
    # Evaluate
    metrics = evaluate_model(pipeline, X_train, y_train, X_test, y_test, X, y)
    
    # Feature importance
    print("\n" + "="*70)
    print("TOP 10 FEATURE IMPORTANCES (Explainability)")
    print("="*70)
    for i, (feat, imp) in enumerate(list(feature_importance.items())[:10], 1):
        print(f"  {i:2d}. {feat:30s} {imp:.4f}")
    
    # Save model
    print("\n" + "="*70)
    print("SAVING MODEL")
    print("="*70)
    joblib.dump(pipeline, 'groundwater_model.joblib')
    print("  ✓ Model: groundwater_model.joblib")
    
    # Save metadata
    metadata = {
        'model_type': 'RandomForestRegressor',
        'model_config': {
            'n_estimators': 250,
            'max_depth': 25,
            'min_samples_split': 4,
            'oob_score': float(oob_score)
        },
        'features': FEATURES if not missing_features else available_features,
        'target': TARGET,
        'dataset_size': {
            'train': len(X_train),
            'test': len(X_test),
            'total': len(df)
        },
        'metrics': metrics,
        'feature_importance': dict(list(feature_importance.items())[:15]),
        'training_date': pd.Timestamp.now().isoformat()
    }
    
    with open('model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    print("  ✓ Metadata: model_metadata.json")
    
    # Final summary
    print("\n" + "="*70)
    print("TRAINING COMPLETE!")
    print("="*70)
    print(f"\n📊 Model Performance Summary:")
    print(f"  Test R² Score: {metrics['test']['r2']:.4f}")
    print(f"  Test RMSE: {metrics['test']['rmse']:.4f} meters")
    print(f"  CV Mean R²: {metrics['cross_validation']['mean_r2']:.4f}")
    print(f"\n✓ Model ready for deployment!")
    print(f"✓ Uncertainty quantification enabled")
    print(f"✓ Feature importance available for explainability")

if __name__ == "__main__":
    main()
