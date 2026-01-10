import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {  
    document.title = 'Ripple';
  }, [])
  
  return (
    <div>      
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
      </h6>
    </div>
  )
}
