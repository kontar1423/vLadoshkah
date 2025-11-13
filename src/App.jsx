import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import FindPet from './pages/FindPet'
import Help from './pages/Help'
import Shelters from './pages/Shelters'
import GiveAnimal from './pages/GiveAnimal'
import Login from './pages/Login'
import Register from './pages/Register'
import PersonalInfo from './pages/PersonalInfo'
import Profile from './pages/Profile'
import AdminProfile from './pages/AdminProfile' 
import PetProfile from './pages/PetProfile'
import ShelterProfile from './pages/ShelterProfile'
import AnketaGive from './pages/AnketaGive'
import AnketaInfo from './pages/AnketaInfo'
import ShelterRegister from './pages/ShelterRegister'
import './assets/fonts/fonts.css';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-green-95 flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/найти-питомца" element={<FindPet />} />
              <Route path="/помочь" element={<Help />} />
              <Route path="/приюты" element={<Shelters />} />
              <Route path="/отдать-животное" element={<GiveAnimal />} />
              <Route path="/войти" element={<Login />} />
              <Route path="/регистрация" element={<Register />} />
              <Route path="/личная-информация" element={<PersonalInfo />} />
              <Route path="/профиль" element={<Profile />} />
              <Route path="/админ-профиль" element={<AdminProfile />} /> 
              <Route path="/питомец/:id" element={<PetProfile />} />
              <Route path="/приют/:id" element={<ShelterProfile />} />
              <Route path="/Anketa_give" element={<AnketaGive />} />
              <Route path="/Anketa_info" element={<AnketaInfo />} />
              <Route path="/регистрация-приюта" element={<ShelterRegister />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App