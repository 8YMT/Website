import { HashRouter, Router, Routes, Route, BrowserRouter } from 'react-router-dom';
import Landing  from './Landing';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route basename="*" element={<Landing />} />
      </Routes>
    </HashRouter>
  );
} export default App;