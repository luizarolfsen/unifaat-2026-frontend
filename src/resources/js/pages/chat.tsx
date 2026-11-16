import { createRoot } from "react-dom/client"
import { ChatApp } from "../components/ChatApp"

// A View (resources/views/chat.ejs) entrega o #root; o nome é digitado dentro do componente.
createRoot(document.getElementById("root")!).render(<ChatApp />)
