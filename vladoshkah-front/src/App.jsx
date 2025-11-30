// src/App.jsx
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
import ProfileSelector from './pages/ProfileSelector' // Исправленный импорт
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
              <Route path="/найти-питомца" element={<FindPet />} />
              <Route path="/приюты" element={<Shelters />} />
              <Route path="/отдать-животное" element={<GiveAnimal />} />
              <Route path="/войти" element={<Login />} />
              <Route path="/регистрация" element={<Register />} />
              <Route path="/личная-информация" element={<PersonalInfo />} />
              <Route path="/профиль" element={<ProfileSelector />} /> {/* Единый маршрут */}
              <Route path="/админ-профиль" element={<AdminProfile />} />
              <Route path="/питомец/:id" element={<PetProfile />} />
              <Route path="/приют/:id" element={<ShelterProfile />} />
              <Route path="/Anketa_give" element={<AnketaGive />} />
              <Route path="/регистрация-приюта" element={<ShelterRegister />} />
              <Route path="/добавить-питомца" element={<AddPetToShelter />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App;