import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

//import Navbar from "./components/Navbar";
//import Home from "./pages/Home";
//import Dashboard from "../views/dashboard/Dashboard";
//import NoteDGT from "../views/noteDG/noteTable/NoteDGT";
//import NoteFile2025 from "../views/noteDG/noteFile2025/NoteFile2025";
//import NotFound from "./pages/NotFound";
//import  NoteDGF   from"../views/noteFile/NoteDGF"
// routes config
import routes from '../routes'
const AppContent = () => {
  return (
    // Ajoutez style pour limiter la largeur et centrer
    <CContainer fluid className="px-4" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <Suspense fallback={<CSpinner color="primary" />}>
        <Routes>
          {routes.map((route, idx) => {
            return (
              route.element && (
                <Route
                  key={idx}
                  path={route.path}
                  exact={route.exact}
                  name={route.name}
                  element={<route.element />}
                />
              )
            )
          })}
          <Route path="/" element={<Navigate to="/home/accueil" replace />}/>
         
        </Routes>
      </Suspense>
    </CContainer>
  )
}
export default React.memo(AppContent)