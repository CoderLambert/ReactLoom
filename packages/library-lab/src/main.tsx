import React from 'react';
import {createRoot} from 'react-dom/client';
import {RouterProvider} from '@tanstack/react-router';
import {router} from './app/router';
import './styles.css';
const root = document.getElementById('root');
if (!root) throw new Error('Missing root container');
createRoot(root).render(<React.StrictMode><RouterProvider router={router}/></React.StrictMode>);
