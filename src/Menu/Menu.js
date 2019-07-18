import React from 'react'
import {Link} from 'react-router-dom'

function Menu() {
  return (
    <div className='menu'>
      <Link to='/minesweeper'>
        Minesweeper
      </Link>
    </div>
  )
}

export default Menu
