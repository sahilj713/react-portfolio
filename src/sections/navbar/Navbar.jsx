import React from 'react'
import Profile from '../../assets/profile_photo.jpeg'
import data from './data.js'
import {IoIosColorPalette} from 'react-icons/io'
import './navbar.css'

const Navbar = () => {
  return (
    <nav>
      <div className="container nav__container">
      <a href = "index.html" className='nav__logo'>
        <img src= {Profile} alt="Profile" />
      </a>
      <ul className='nav__menu'>
        {
          data.map(item => <li key = {item.id}><a href = {item.link}>{item.title}</a></li>)
        }
      </ul>
      <button id='theme__icon'><IoIosColorPalette/></button>
      </div>
    </nav>
  )
}

export default Navbar