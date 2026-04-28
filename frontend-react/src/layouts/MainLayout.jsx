import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="scan-line" />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
