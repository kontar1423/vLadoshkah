import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext' 
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'
import FindPet from './pages/FindPet'
import Shelters from './pages/Shelters'
import GiveAnimal from './pages/GiveAnimal'
import Login from './pages/Login'
import Register from './pages/Register'
import PersonalInfo from './pages/PersonalInfo'
import ProfileSelector from './pages/ProfileSelector'
import AdminProfile from './pages/AdminProfile'
import PetProfile from './pages/PetProfile'
import ShelterProfile from './pages/ShelterProfile'
import AnketaGive from './pages/AnketaGive'
import ShelterRegister from './pages/ShelterRegister'
import AddPetToShelter from './pages/AddPetToShelter'
import './assets/fonts/fonts.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-green-95 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/find-pet" element={<FindPet />} />
              <Route path="/shelters" element={<Shelters />} />
              <Route path="/give-animal" element={<GiveAnimal />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/personal-info" element={<PersonalInfo />} />
              <Route path="/profile" element={<ProfileSelector />} />
              <Route path="/admin-profile" element={<AdminProfile />} />
              <Route path="/pet/:id" element={<PetProfile />} />
              <Route path="/shelter/:id" element={<ShelterProfile />} />
              <Route path="/application-give" element={<AnketaGive />} />
              <Route path="/register-shelter" element={<ShelterRegister />} />
              <Route path="/add-pet" element={<AddPetToShelter />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;