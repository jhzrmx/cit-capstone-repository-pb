/* @refresh reload */
import { render } from 'solid-js/web';
import { initTheme } from './stores/themeStore';
import './index.css';
import App from './App.tsx';

initTheme();

const root = document.getElementById('root');
if (root) render(() => <App />, root);
