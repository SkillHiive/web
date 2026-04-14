import { Routes, Route } from "react-router";
import './Layout.css'
import * as Page from "./pages";
import * as Comp from "./components";

function App() {
  return (
    <>
      <Comp.User />
      <Comp.Nav />
      <Routes>
        <Route path="/" element={<Page.Landing />} />
        <Route path="/login" element={<Page.Sign />} />
        <Route path="/home" element={<Page.Home />} />
        <Route path="/learn" element={<Page.Learn />} />
        <Route path="/chat" element={<Page.Messages />} />
      </Routes>
    </>
  )
}

export default App
