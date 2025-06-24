import { Routes, Route } from 'react-router-dom';
import Landing from './Landing';

function App() {
  return (
    <Routes>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
export default App;