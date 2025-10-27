import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DetailedResult } from '../types';
import { format } from 'date-fns';

export const exportToPDF = (result: DetailedResult, input: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(6, 182, 212);
  doc.text('HydroTech Prediction Report', 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 28);
  
  // Divider
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);
  
  // Main Prediction
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('Prediction Result', 14, 42);
  
  doc.setFontSize(12);
  doc.setTextColor(6, 182, 212);
  doc.text(`${result.predicted_level_meters.toFixed(2)} meters`, 14, 50);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Confidence: ${(result.confidence_score * 100).toFixed(1)}%`, 14, 56);
  doc.text(`Zone: ${result.zone_name} (${result.aquifer_zone})`, 14, 62);
  
  // Input Parameters Table
  autoTable(doc, {
    startY: 70,
    head: [['Parameter', 'Value']],
    body: [
      ['Latitude', `${input.latitude}°`],
      ['Longitude', `${input.longitude}°`],
      ['Rainfall', `${input.rainfall} mm`],
      ['Temperature', `${input.temperature} °C`],
      ['Month', input.month],
    ],
    theme: 'grid',
    headStyles: { fillColor: [6, 182, 212] },
  });
  
  // Prediction Interval
  const finalY = (doc as any).lastAutoTable.finalY || 120;
  autoTable(doc, {
    startY: finalY + 10,
    head: [['Metric', 'Value']],
    body: [
      ['Lower Bound (95% CI)', `${result.prediction_interval.lower.toFixed(2)} m`],
      ['Upper Bound (95% CI)', `${result.prediction_interval.upper.toFixed(2)} m`],
      ['Range', `${(result.prediction_interval.upper - result.prediction_interval.lower).toFixed(2)} m`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [6, 182, 212] },
  });
  
  // Feature Contributions
  const finalY2 = (doc as any).lastAutoTable.finalY || 160;
  autoTable(doc, {
    startY: finalY2 + 10,
    head: [['Feature', 'Contribution (m)']],
    body: [
      ['Rainfall Impact', result.feature_contributions.rainfall_impact.toFixed(2)],
      ['Temperature Impact', result.feature_contributions.temperature_impact.toFixed(2)],
      ['Location Baseline', result.feature_contributions.location_baseline.toFixed(2)],
      ['Seasonal Effect', result.feature_contributions.seasonal_effect.toFixed(2)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [6, 182, 212] },
  });
  
  // Seasonal Analysis
  const finalY3 = (doc as any).lastAutoTable.finalY || 200;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Seasonal Analysis', 14, finalY3 + 15);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  const splitText = doc.splitTextToSize(result.seasonal_trend, 180);
  doc.text(splitText, 14, finalY3 + 22);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('HydroTech © 2025 | AI-Powered Groundwater Prediction', 14, 285);
  
  // Save
  doc.save(`hydrotech-prediction-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
};

export const exportToCSV = (result: DetailedResult, input: any) => {
  const csvContent = [
    ['HydroTech Prediction Report'],
    ['Generated', format(new Date(), 'PPpp')],
    [''],
    ['Prediction Result'],
    ['Predicted Level (m)', result.predicted_level_meters.toFixed(2)],
    ['Confidence Score', `${(result.confidence_score * 100).toFixed(1)}%`],
    ['Zone', result.zone_name],
    ['Zone Code', result.aquifer_zone],
    [''],
    ['Input Parameters'],
    ['Latitude', input.latitude],
    ['Longitude', input.longitude],
    ['Rainfall (mm)', input.rainfall],
    ['Temperature (°C)', input.temperature],
    ['Month', input.month],
    [''],
    ['Prediction Interval (95% Confidence)'],
    ['Lower Bound (m)', result.prediction_interval.lower.toFixed(2)],
    ['Upper Bound (m)', result.prediction_interval.upper.toFixed(2)],
    [''],
    ['Feature Contributions'],
    ['Rainfall Impact (m)', result.feature_contributions.rainfall_impact.toFixed(2)],
    ['Temperature Impact (m)', result.feature_contributions.temperature_impact.toFixed(2)],
    ['Location Baseline (m)', result.feature_contributions.location_baseline.toFixed(2)],
    ['Seasonal Effect (m)', result.feature_contributions.seasonal_effect.toFixed(2)],
    [''],
    ['Seasonal Analysis'],
    [result.seasonal_trend],
  ]
    .map(row => row.join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `hydrotech-prediction-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`;
  link.click();
};
