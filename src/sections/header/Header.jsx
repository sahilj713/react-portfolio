import React from 'react'
import HeaderImage from '../../assets/profile_image.jpeg'
import data from './data'
import './header.css'

const Header = () => {
  return (
    <header id="header">
      <div className="container header__container">
        <div className="header__profile">
          <img src= {HeaderImage} alt= "Header Portrait"/>
        </div>
        <h3>Sahil Jain</h3>
        <p>Welcome Fellas to my career portfolio! I hope that this portfolio provides insight into my character,work experience,projects,technical skills and accomplishments 
          </p>
          <div className="header__cta">
            <a href = '#contact' className='btn primary'>Let's Talk</a>
            <a href ='#portfolio' className='btn light'>My Work</a>
          </div>
          <div className="header__socials">
              {
                data.map(item => <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer">{item.icon}</a>)
              }
          </div>
      </div>
    </header>
  )
}

export default Header