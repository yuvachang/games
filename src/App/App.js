import React from 'react'
import { Menu, Routes } from '../components'

class App extends React.Component {

  render() {
    return (
      <div className='app'>
        <Menu />
        <Routes />
      </div>
    )
  }
}

export default App
