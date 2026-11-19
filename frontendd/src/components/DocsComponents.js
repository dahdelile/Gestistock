import PropTypes from 'prop-types'
import React from 'react'

//import { CButton,  } from '@coreui/react'
//import ComponentsImg from 'src/assets/images/components.webp'

const DocsComponents = (props) => (
   
        
          
            <div className="bg-primary bg-opacity-10 border border-2 border-primary rounded mb-4">
    <div className="row d-flex align-items-center p-3 px-xl-4 flex-xl-nowrap">
      <div className="col-xl-auto col-12 d-none d-xl-block p-0">
       
      </div>
      <div className="col-md col-6 px-lg-2">
        {' '}
        <strong>
          rapport NOTE
        </strong>
        
      </div>
      <div className="col-md-auto col-12 mt-3 mt-lg-0">
        <a
          className="btn btn-primary text-nowrap text-white"
          href={`https://coreui.io/react/docs/${props.href}`}


          
          target="_blank"
          rel="noopener noreferrer"
        >
          SITE WEB ATTM
        </a>
      </div>
    </div>
  </div>




)

DocsComponents.propTypes = {
  href: PropTypes.string,
}

export default DocsComponents
