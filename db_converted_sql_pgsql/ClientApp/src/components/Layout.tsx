import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '70px' }}>
        <Outlet />
        <hr />
        <footer><p>&copy; {new Date().getFullYear()} - Contoso University</p></footer>
      </div>
    </>
  )
}
