// Lean Muscle: the two 3D characters, their media and the colours the app takes from their outfits.
(function () {
  const base = { arm: 1, leg: 1, torso: 1, hip: 1, armsCovered: false };
  window.LMTChars = {
    kei: { id: 'kei', name: 'Kei', base: 'male', full: 'media/kei-full.webp', face: 'media/kei-face.webp', video: 'media/kei.mp4', poster: 'media/kei-poster.jpg',
      c1: '#5b9bf0', c2: '#2f5fd0', c3: '#d6e6ff', deep: '#0c1836', mid: '#163063',
      look: Object.assign({}, base, { sex: 'male', skin: '#7a4630', hair: '#151214', hairStyle: 'curly', top: '#4a8be0', bottom: '#2f5fd0', shoe: '#a8cdf7', legsCovered: false, sleeves: false, midriff: false, bg: ['#1a3a6e', '#0f2042', '#0a1326'] }) },
    dafi: { id: 'dafi', name: 'Dafi', base: 'female', full: 'media/dafi-full.webp', face: 'media/dafi-face.webp', video: 'media/dafi.mp4', poster: 'media/dafi-poster.jpg',
      c1: '#f2a0ad', c2: '#d9667a', c3: '#ffe1e6', deep: '#2a1220', mid: '#4d2133',
      look: Object.assign({}, base, { sex: 'female', skin: '#f2c4aa', hair: '#151214', hairStyle: 'ponytail', top: '#e07e8e', bottom: '#d97384', shoe: '#f1f3f7', legsCovered: true, sleeves: false, midriff: true, bg: ['#4f2438', '#2a1522', '#160c14'] }) }
  };
})();
