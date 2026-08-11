import { ComponentLoader } from 'adminjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const componentLoader = new ComponentLoader();

const componentDirectory = path.dirname(fileURLToPath(import.meta.url));

export const Components = {
  Dashboard: componentLoader.add(
    'Dashboard',
    path.join(componentDirectory, 'dashboard', 'index.js'),
  ),
  Calculator: componentLoader.add(
    'Calculator',
    path.join(componentDirectory, 'calculator', 'index.js'),
  ),
  Campaign: componentLoader.add(
    'Campaign',
    path.join(componentDirectory, 'campaign', 'index.js'),
  ),
  FollowUp: componentLoader.add(
    'Followup',
    path.join(componentDirectory, 'followUp', 'index.js'),
  ),
  Chat: componentLoader.add(
    'Chat',
    path.join(componentDirectory, 'conversation', 'index.js'),
  ),
};
