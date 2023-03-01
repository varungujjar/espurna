import { render } from 'preact';
import App from './app';
import './style/style.css';

render(<App />, document.getElementById('app') as HTMLElement);
