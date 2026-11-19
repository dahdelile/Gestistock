import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter style={{ backgroundColor: "#003366", color: "#ffffff" }} className="px-4">

      <div>
        <a href="" target="_blank" rel="noopener noreferrer">
        IntraNet de ATTM
        </a>
        <span className="ms-1">  </span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Creer par</span>
        <a href="" target="_blank" rel="noopener noreferrer">
            Groupe informatique ATTM
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
