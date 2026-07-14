import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import BrowseCodes from './pages/BrowseCodes'
import MyReferrals from './pages/MyReferrals'
import UserProfile from './pages/UserProfile'
import './App.css'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowseCodes />} />
          <Route path="/my-referrals" element={<MyReferrals />} />
          <Route path="/profile/:username" element={<UserProfile />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
