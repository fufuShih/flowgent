import { Navbar } from "@/components/Navbar"
import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "./pages/HomePage"
import ProjectsPage from "./pages/ProjectsPage"
import ProjectDetail from "./pages/ProjectDetail"
import MatrixList from "./pages/MatrixList"
import MatrixEditorPage from "./pages/MatrixEditorPage"
import LogPage from "./pages/LogPage"

function App() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar />
      <main className="flex-1">
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetail />}>
              <Route path="matrices" element={<MatrixList />} />
              <Route path="matrices/:matrixId" element={<MatrixEditorPage />} />
            </Route>
            <Route path="/logs" element={<LogPage />} />
          </Routes>
        </BrowserRouter>
      </main>
    </div>
  )
}

export default App
