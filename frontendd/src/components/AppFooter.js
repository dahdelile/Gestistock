import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter style={{ backgroundColor: "#003366", color: "#ffffff" }} className="px-4">

      <div>
        <a href="" target="_blank" rel="noopener noreferrer">
       APPLIATION  GESTION DE STOCK
        </a>
        <span className="ms-1">  </span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Creer par</span>
        <a href="" target="_blank" rel="noopener noreferrer">
            Iginiers informatique DAh/deli 48614463
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
