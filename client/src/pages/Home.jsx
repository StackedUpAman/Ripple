import React from 'react'
import { Link } from 'react-router-dom'


function Home() {
  return (
    <div>
      <Title>Ripple</Title>
      <div className="flex justify-between">          
          <button>
           <p 
              className = "mb-3 text-lg font-medium leading-none text-black peer-disabled:cursor-not-allowed peer-disabled:opacity-70"                                                                                                                                                                 
            >               
            <Link to={"/signup"}>
              SignUp     
            </Link>                                                 
          </p>
        </button>
      </div>
      <h6>        
        Landing Page to be implemented
        {console.log('Entered Home')}
      </h6>
    </div>
  )
}

export default Home
