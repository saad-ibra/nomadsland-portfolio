const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('LoadingScreen')) {
  content = content.replace(
    "import SceneTransition from './components/ui/SceneTransition.jsx';",
    "import SceneTransition from './components/ui/SceneTransition.jsx';\nimport LoadingScreen from './components/ui/LoadingScreen.jsx';"
  );
}

if (!content.includes('const [appLoaded, setAppLoaded] = useState(false);')) {
  content = content.replace(
    "function App() {",
    "function App() {\n  const [appLoaded, setAppLoaded] = useState(false);\n  useEffect(() => {\n    if (document.readyState === 'complete') {\n      setTimeout(() => setAppLoaded(true), 1500);\n    } else {\n      window.addEventListener('load', () => setTimeout(() => setAppLoaded(true), 1500));\n    }\n    // Also ensure fonts are ready\n    document.fonts.ready.then(() => {\n       if (document.readyState === 'complete') setAppLoaded(true);\n    });\n  }, []);\n"
  );
}

if (!content.includes('<LoadingScreen ready={appLoaded}')) {
  content = content.replace(
    "{/* Pixelated Iris-Wipe Transition */}",
    "{/* Loading Screen */}\n        {!appLoaded && <LoadingScreen ready={appLoaded} onDone={() => {}} />}\n        {appLoaded && <LoadingScreen ready={true} onDone={() => {}} /> /* Just for the fade-out, but wait, LoadingScreen wrapper unmounts itself? No, wrapper just fades out. Let's just conditionally render but let it fade out first. */}\n\n        {/* Pixelated Iris-Wipe Transition */}"
  );
  // Wait, the wrapper needs to stay mounted to fade out.
  // Actually, if I just render `<LoadingScreen ready={appLoaded} onDone={() => {}} />` unconditionally, it'll cover everything until it fades out, then set pointer-events: none!
  // But wait! We need a state to fully UNMOUNT it after it's done so it doesn't block clicks.
  // Let's create `unmountLoadingScreen` state.
}
fs.writeFileSync(file, content);
