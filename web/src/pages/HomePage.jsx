import { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'

const HomePage = () => {
  const { data: codes, isLoading } = useQuery('featuredCodes', async () => {
    const response = await axios.get('/api/referral-codes/featured')
    return response.data
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-4">Welcome to Ripple</h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Share your referral codes and discover amazing deals
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-2">Share Codes</h3>
            <p className="text-gray-600">Post your referral and affiliate codes with ease</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2">Discover Deals</h3>
            <p className="text-gray-600">Browse thousands of active referral codes</p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-2xl font-bold mb-2">Build Network</h3>
            <p className="text-gray-600">Connect with other referral enthusiasts</p>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-8">Featured Codes</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {codes?.map(code => (
              <div key={code._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-2">{code.platform}</h3>
                <p className="text-gray-600 mb-4">{code.description}</p>
                <p className="text-lg font-bold text-green-600 mb-4">{code.discount}</p>
                <code className="bg-gray-100 p-2 rounded block text-center font-mono mb-4">{code.code}</code>
                <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  Copy Code
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomePage
