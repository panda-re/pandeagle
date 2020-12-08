import { Axes } from './components/Axes.js';
import { Container } from './components/Container.js';

async function init() {
  const datArr = await d3.json('./payloads/datArr.json');
  const layout = await d3.json('./payloads/layout.json');

  const parent = document.getElementById('container');
  var ax = new Axes(datArr, parent, layout);
  ax.init();
  return parent;
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});