import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LiveDemo } from './pages/LiveDemo';
import { Bookings } from './pages/Bookings';
import { CallHistory } from './pages/CallHistory';
import { Settings } from './pages/Settings';
import { Analytics } from './pages/Analytics';
import { Account } from './pages/Account';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<LiveDemo />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/calls" element={<CallHistory />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
