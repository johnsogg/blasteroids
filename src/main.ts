import './style.css';

console.log('Blasteroids initializing...');

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
}

console.log('Canvas initialized:', canvas.width, 'x', canvas.height);
console.log('Ready to build Blasteroids!');