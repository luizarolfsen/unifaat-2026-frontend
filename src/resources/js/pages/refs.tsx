import { createRoot } from "react-dom/client"
import { RefsLab } from "../components/RefsLab"

// A View (resources/views/refs.ejs) entrega o #root; o laboratório é um componente.
createRoot(document.getElementById("root")!).render(<RefsLab />)
