import { Routes, Route } from "react-router";
import "./Layout.css";
import * as Page from "./pages";
import * as Comp from "./components";
import Cursor from "./components/Cursor";
function App() {
  return (
    <>
    <Cursor />
      <Comp.Nav />
      <Routes>
        <Route path="/" element={<Page.Landing />} />
        <Route path="/home" element={<Page.Landing />} />
        <Route path="/login" element={<Page.Sign />} />
        <Route path="/learn" element={<Page.Learn />} />
      </Routes>
    </>
  );
}

export default App;
