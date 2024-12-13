import { FlowEditor } from "@/components/FlowEditor"
import { Navbar } from "@/components/Navbar"

function App() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navbar />
      <main className="flex-1">
        <FlowEditor />
      </main>
    </div>
  )
}

export default App
