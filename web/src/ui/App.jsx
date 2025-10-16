import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './Dashboard.jsx'
import ItemsPage from './ItemsPage.jsx'
import BrowsePage from './BrowsePage.jsx'

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Dashboard/>} />
      <Route path="/items" element={<ItemsPage/>} />
      <Route path="/browse" element={<BrowsePage/>} />
    </Routes>
  )
}

