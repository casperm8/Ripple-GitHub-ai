import { Link } from 'react-router-dom'
import { useState } from 'react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            💧 Ripple
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <Link to="/browse" className="hover:text-blue-600">Browse</Link>
            <Link to="/my-referrals" className="hover:text-blue-600">My Referrals</Link>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Sign In
            </button>
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            ☰
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 space-y-2">
            <Link to="/" className="block hover:text-blue-600">Home</Link>
            <Link to="/browse" className="block hover:text-blue-600">Browse</Link>
            <Link to="/my-referrals" className="block hover:text-blue-600">My Referrals</Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
