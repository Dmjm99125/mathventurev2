export * from './colors';
export * from './shapes';
export * from './sequencing';
export * from './addition';
export * from './subtraction';
export * from './numbers';
export * from './measurement';
export * from './comparison';
export * from './clock';

import { colorsData } from './colors';
import { shapesData } from './shapes';
import { sequencingData } from './sequencing';
import { additionData } from './addition';
import { subtractionData } from './subtraction';
import { numbersData } from './numbers';
import { measurementData } from './measurement';
import { comparisonData } from './comparison';
import { clockData } from './clock';

export const allTopics = {
  colors: colorsData,
  shapes: shapesData,
  sequencing: sequencingData,
  addition: additionData,
  subtraction: subtractionData,
  numbers: numbersData,
  measurement: measurementData,
  comparison: comparisonData,
  clock: clockData
};
