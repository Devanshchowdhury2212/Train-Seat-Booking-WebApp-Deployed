import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login";
import Seats from "./pages/Seats";
import SignupPage from "./pages/Signup";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Seats />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
