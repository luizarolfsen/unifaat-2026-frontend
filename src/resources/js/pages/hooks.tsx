import { createRoot } from "react-dom/client"
import { HookLab } from "../components/HookLab"

// A View (resources/views/hooks.ejs) entrega o #root; o laboratório do hook é um componente.
createRoot(document.getElementById("root")!).render(<HookLab />)
