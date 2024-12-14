import { Navbar } from "@/components/Navbar"
import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "./pages/HomePage"

function App() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar />
      <main className="flex-1">
        <BrowserRouter>
          <Routes>
            <Route index element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </main>
    </div>
  )
}

export default App
